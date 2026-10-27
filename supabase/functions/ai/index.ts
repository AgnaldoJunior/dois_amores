// Edge Function "ai": único ponto do app que fala com o provedor de IA.
// A chave (GEMINI_API_KEY) fica nos segredos do Supabase e nunca chega ao navegador.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0'
import { createAiProvider } from '../_shared/ai/index.ts'
import { parseSummaryTranslation, translateSummaryRequest } from '../_shared/ai/prompts.ts'
import { AiProviderError } from '../_shared/ai/provider.ts'
import { createAdminClient, getRequestUser } from '../_shared/auth.ts'
import { corsHeaders, errorResponse, json } from '../_shared/http.ts'

const DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '20')

type Context = { userId: string; admin: SupabaseClient; quotaConsumed: boolean }

async function consumeQuota(ctx: Context): Promise<boolean> {
  const { data, error } = await ctx.admin.rpc('consume_ai_quota', { p_user_id: ctx.userId, p_limit: DAILY_LIMIT })
  if (error) throw error
  ctx.quotaConsumed = data === true
  return ctx.quotaConsumed
}

/** Traduz (uma única vez por livro) o resumo da Open Library para o português. */
async function translateSummary(ctx: Context, body: { bookId?: unknown }) {
  if (typeof body.bookId !== 'string') return errorResponse('bad_request', 'bookId obrigatório', 400)

  const { data: book, error } = await ctx.admin
    .from('books')
    .select('id, title, author, summary, summary_lang, summary_source')
    .eq('id', body.bookId)
    .maybeSingle()
  if (error) throw error
  if (!book) return errorResponse('not_found', 'Livro não encontrado', 404)

  // Sem resumo, ou já verificado/traduzido: nada a fazer (não consome cota).
  if (!book.summary || book.summary_lang) {
    return json({ summary: book.summary, summary_lang: book.summary_lang, summary_source: book.summary_source })
  }

  if (!(await consumeQuota(ctx))) {
    return errorResponse('quota_exceeded', 'Limite diário de uso da IA atingido', 429)
  }

  const ai = createAiProvider(Deno.env)
  const result = parseSummaryTranslation(
    await ai.generateJson(translateSummaryRequest({ title: book.title, author: book.author, summary: book.summary })),
  )

  const changes =
    result.sourceLanguage === 'pt'
      ? { summary_lang: 'pt' }
      : {
          summary: result.translation,
          summary_original: book.summary,
          summary_source: 'ai_translation',
          summary_lang: 'pt',
        }

  // "summary_lang is null" evita que duas traduções simultâneas sobrescrevam o original.
  const { data: updated, error: updateError } = await ctx.admin
    .from('books')
    .update(changes)
    .eq('id', book.id)
    .is('summary_lang', null)
    .select('summary, summary_lang, summary_source')
    .maybeSingle()
  if (updateError) throw updateError

  if (updated) return json(updated)
  const { data: current } = await ctx.admin
    .from('books')
    .select('summary, summary_lang, summary_source')
    .eq('id', book.id)
    .single()
  return json(current)
}

const actions: Record<string, (ctx: Context, body: Record<string, unknown>) => Promise<Response>> = {
  'translate-summary': translateSummary,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('method_not_allowed', 'Use POST', 405)

  const user = await getRequestUser(req)
  if (!user) return errorResponse('unauthorized', 'Entre na sua conta', 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return errorResponse('bad_request', 'JSON inválido', 400)
  }

  const action = typeof body.action === 'string' ? actions[body.action] : undefined
  if (!action) return errorResponse('bad_request', 'Ação desconhecida', 400)

  const admin = createAdminClient()
  const ctx: Context = { userId: user.id, admin, quotaConsumed: false }
  try {
    return await action(ctx, body)
  } catch (err) {
    console.error('[ai]', body.action, err)
    // Falha nossa ou do provedor: a pessoa não perde a chamada.
    if (ctx.quotaConsumed) await admin.rpc('refund_ai_quota', { p_user_id: user.id })
    if (err instanceof AiProviderError) {
      return errorResponse('ai_unavailable', 'A IA não respondeu agora. Tente de novo em instantes.', 503)
    }
    return errorResponse('internal', 'Erro inesperado', 500)
  }
})
