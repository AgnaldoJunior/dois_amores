// Edge Function "ai": único ponto do app que fala com o provedor de IA.
// A chave (GEMINI_API_KEY) fica nos segredos do Supabase e nunca chega ao navegador.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.118.0'
import { createAiProvider } from '../_shared/ai/index.ts'
import {
  parseQuotes,
  parseSuggestions,
  parseSummaryTranslation,
  suggestClubReadsRequest,
  suggestNextReadsRequest,
  suggestQuotesRequest,
  translateSummaryRequest,
  type ReadingForSuggestion,
} from '../_shared/ai/prompts.ts'
import { AiProviderError } from '../_shared/ai/provider.ts'
import { createAdminClient, getRequestUser } from '../_shared/auth.ts'
import { corsHeaders, errorResponse, json } from '../_shared/http.ts'
import { averageOf, verifySuggestions } from '../_shared/suggestions.ts'

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

const quotaExceeded = () => errorResponse('quota_exceeded', 'Limite diário de uso da IA atingido', 429)

/** Sugere citações do livro. Nada é salvo: o app mostra e a pessoa decide se usa. */
async function suggestQuotes(ctx: Context, body: { bookId?: unknown }) {
  if (typeof body.bookId !== 'string') return errorResponse('bad_request', 'bookId obrigatório', 400)
  const { data: book, error } = await ctx.admin
    .from('books')
    .select('title, author, summary')
    .eq('id', body.bookId)
    .maybeSingle()
  if (error) throw error
  if (!book) return errorResponse('not_found', 'Livro não encontrado', 404)

  if (!(await consumeQuota(ctx))) return quotaExceeded()
  const ai = createAiProvider(Deno.env)
  const quotes = parseQuotes(await ai.generateJson(suggestQuotesRequest(book)))
  return json({ quotes })
}

type ReadingRow = {
  finished_on: string | null
  rank_characters: number | null
  rank_plot: number | null
  rank_writing: number | null
  rank_ending: number | null
  book: { title: string; author: string | null; openlibrary_work_key: string } | null
}

/**
 * 3 sugestões de próxima leitura a partir dos livros e notas da pessoa.
 * Cada sugestão é confirmada na Open Library antes de ser devolvida.
 */
async function suggestNextReads(ctx: Context) {
  const [readings, wishlist] = await Promise.all([
    ctx.admin
      .from('user_books')
      .select(
        'finished_on, rank_characters, rank_plot, rank_writing, rank_ending, book:books(title, author, openlibrary_work_key)',
      )
      .eq('user_id', ctx.userId)
      .order('finished_on', { ascending: false, nullsFirst: false })
      .limit(60)
      .returns<ReadingRow[]>(),
    ctx.admin
      .from('reading_list')
      .select('book:books(title, author, openlibrary_work_key)')
      .eq('user_id', ctx.userId)
      .returns<{ book: ReadingRow['book'] }[]>(),
  ])
  if (readings.error) throw readings.error
  if (wishlist.error) throw wishlist.error

  const history: ReadingForSuggestion[] = readings.data
    .filter((r) => r.book)
    .map((r) => ({
      title: r.book!.title,
      author: r.book!.author,
      average: averageOf([r.rank_characters, r.rank_plot, r.rank_writing, r.rank_ending]),
      finished: Boolean(r.finished_on),
    }))
  if (!history.some((r) => r.finished)) {
    return errorResponse('not_enough_data', 'Termine pelo menos um livro para receber sugestões', 400)
  }

  const known = [...readings.data, ...wishlist.data].map((r) => r.book).filter((b) => b !== null)
  if (!(await consumeQuota(ctx))) return quotaExceeded()
  const ai = createAiProvider(Deno.env)
  const raw = parseSuggestions(
    await ai.generateJson(suggestNextReadsRequest(history, wishlist.data.flatMap((w) => (w.book ? [w.book.title] : [])))),
  )
  const suggestions = await verifySuggestions(
    raw,
    known.map((b) => b.openlibrary_work_key),
  )
  return json({ suggestions })
}

type ClubBookRow = {
  status: string
  book: { id: string; title: string; author: string | null; openlibrary_work_key: string } | null
}

/**
 * 3 sugestões para o clube: a IA recebe os livros do clube e a média das 4 notas
 * de cada membro em cada livro; cada sugestão é confirmada na Open Library.
 */
async function suggestClubReads(ctx: Context, body: { clubId?: unknown }) {
  if (typeof body.clubId !== 'string') return errorResponse('bad_request', 'clubId obrigatório', 400)

  const { data: members, error: membersError } = await ctx.admin
    .from('club_members')
    .select('user_id')
    .eq('club_id', body.clubId)
    .order('joined_at')
  if (membersError) throw membersError
  const memberIds = members.map((m) => m.user_id as string)
  if (!memberIds.includes(ctx.userId)) return errorResponse('not_found', 'Clube não encontrado', 404)

  const { data: clubBooks, error: booksError } = await ctx.admin
    .from('club_books')
    .select('status, book:books(id, title, author, openlibrary_work_key)')
    .eq('club_id', body.clubId)
    .returns<ClubBookRow[]>()
  if (booksError) throw booksError
  const read = clubBooks.filter((cb) => cb.book && (cb.status === 'finished' || cb.status === 'reading'))
  if (read.length === 0) {
    return errorResponse('not_enough_data', 'O clube ainda não leu nenhum livro', 400)
  }

  const { data: readings, error: readingsError } = await ctx.admin
    .from('user_books')
    .select('user_id, book_id, rank_characters, rank_plot, rank_writing, rank_ending')
    .in('book_id', read.map((cb) => cb.book!.id))
    .in('user_id', memberIds)
  if (readingsError) throw readingsError

  const books = read.map((cb) => ({
    title: cb.book!.title,
    author: cb.book!.author,
    memberAverages: memberIds.map((uid) => {
      const r = readings.find((x) => x.user_id === uid && x.book_id === cb.book!.id)
      return r ? averageOf([r.rank_characters, r.rank_plot, r.rank_writing, r.rank_ending]) : null
    }),
  }))
  const pending = clubBooks.filter((cb) => cb.book && cb.status === 'pending').map((cb) => cb.book!.title)

  if (!(await consumeQuota(ctx))) return quotaExceeded()
  const ai = createAiProvider(Deno.env)
  const raw = parseSuggestions(await ai.generateJson(suggestClubReadsRequest(books, pending)))
  const suggestions = await verifySuggestions(
    raw,
    clubBooks.flatMap((cb) => (cb.book ? [cb.book.openlibrary_work_key] : [])),
  )
  return json({ suggestions })
}

const actions: Record<string, (ctx: Context, body: Record<string, unknown>) => Promise<Response>> = {
  'suggest-club-reads': suggestClubReads,
  'translate-summary': translateSummary,
  'suggest-quotes': suggestQuotes,
  'suggest-next-reads': suggestNextReads,
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
