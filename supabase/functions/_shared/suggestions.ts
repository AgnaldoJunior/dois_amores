import type { RawSuggestion } from './ai/prompts.ts'
import { verifyBook, type VerifiedBook } from './openLibrary.ts'

export const SUGGESTIONS_SHOWN = 3

export type Suggestion = VerifiedBook & { reason: string }

type Verify = (title: string, author: string | null) => Promise<VerifiedBook | null>

/**
 * Confirma cada sugestão da IA na Open Library (títulos inventados ficam de fora),
 * descarta repetidas e livros que a pessoa/o clube já tem, e devolve as primeiras 3.
 */
export async function verifySuggestions(
  raw: RawSuggestion[],
  knownWorkKeys: Iterable<string>,
  verify: Verify = verifyBook,
): Promise<Suggestion[]> {
  const known = new Set(knownWorkKeys)
  const verified = await Promise.all(raw.map((s) => verify(s.title, s.author)))
  const result: Suggestion[] = []
  verified.forEach((book, i) => {
    if (!book || known.has(book.workKey) || result.length >= SUGGESTIONS_SHOWN) return
    known.add(book.workKey)
    result.push({ ...book, reason: raw[i]!.reason })
  })
  return result
}

/** Média das notas preenchidas (mesma regra de src/lib/domain/ratings.ts). */
export function averageOf(ranks: (number | null | undefined)[]): number | null {
  const values = ranks.filter((v): v is number => typeof v === 'number')
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
}
