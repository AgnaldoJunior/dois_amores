import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type AiErrorCode = 'quota_exceeded' | 'ai_unavailable' | 'unauthorized' | 'not_enough_data' | 'unknown'

export class AiError extends Error {
  constructor(readonly code: AiErrorCode) {
    super(AI_ERROR_MESSAGES[code])
    this.name = 'AiError'
  }
}

export const AI_ERROR_MESSAGES: Record<AiErrorCode, string> = {
  quota_exceeded: 'Você usou todas as sugestões de IA de hoje. Amanhã tem mais!',
  ai_unavailable: 'A IA não respondeu agora. Tente de novo em instantes.',
  unauthorized: 'Entre de novo na sua conta para usar a IA.',
  not_enough_data: 'Termine pelo menos um livro (com data de fim) para receber sugestões.',
  unknown: 'Não foi possível falar com a IA agora.',
}

/** Chama a Edge Function "ai" (a chave do provedor nunca passa pelo navegador). */
export async function callAi<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('ai', { body: { action, ...payload } })
  if (!error) return data as T

  let code: AiErrorCode = 'unknown'
  if (error instanceof FunctionsHttpError) {
    const body = (await error.context.json().catch(() => null)) as { error?: { code?: string } } | null
    const received = body?.error?.code
    if (received && received in AI_ERROR_MESSAGES) code = received as AiErrorCode
  }
  throw new AiError(code)
}

export type TranslatedSummary = {
  summary: string | null
  summary_lang: string | null
  summary_source: 'openlibrary' | 'ai_translation'
}

export const translateSummary = (bookId: string) => callAi<TranslatedSummary>('translate-summary', { bookId })

export type QuoteSuggestion = { text: string; context: string | null }

/** Sugestões de citação para o livro (nada é salvo; a pessoa escolhe se usa). */
export const suggestQuotes = (bookId: string) =>
  callAi<{ quotes: QuoteSuggestion[] }>('suggest-quotes', { bookId }).then((r) => r.quotes)

export type BookSuggestion = {
  workKey: string
  title: string
  author: string | null
  coverUrl: string | null
  pages: number | null
  reason: string
}

/** 3 sugestões de próxima leitura, já confirmadas na Open Library pelo servidor. */
export const suggestNextReads = () =>
  callAi<{ suggestions: BookSuggestion[] }>('suggest-next-reads').then((r) => r.suggestions)
