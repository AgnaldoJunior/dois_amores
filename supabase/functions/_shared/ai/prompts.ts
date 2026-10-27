import type { JsonRequest } from './provider.ts'

/** Tamanho máximo do resumo enviado à IA (os da Open Library raramente passam disso). */
export const MAX_SUMMARY_CHARS = 6000

export type BookForTranslation = { title: string; author: string | null; summary: string }

export type SummaryTranslation = {
  /** Idioma do texto original (ISO 639-1). */
  sourceLanguage: string
  /** Texto em português do Brasil (igual ao original se já estava em português). */
  translation: string
}

export function translateSummaryRequest(book: BookForTranslation): JsonRequest {
  return {
    system:
      'Você traduz sinopses de livros para o português do Brasil. Seja fiel ao original e natural na leitura. ' +
      'Não invente informações, não acrescente opiniões nem spoilers que não estejam no texto. ' +
      'Mantenha nomes de personagens como no original; use o título consagrado em português de outras obras ' +
      'citadas apenas quando tiver certeza, senão mantenha o título original.',
    prompt: [
      `Livro: ${book.title}${book.author ? ` — ${book.author}` : ''}`,
      'Sinopse original (entre <sinopse> e </sinopse>):',
      `<sinopse>\n${book.summary.slice(0, MAX_SUMMARY_CHARS)}\n</sinopse>`,
      '',
      'Responda em JSON:',
      '- source_language: código ISO 639-1 (2 letras, minúsculas) do idioma da sinopse original;',
      '- translation: a sinopse em português do Brasil. Se a original já estiver em português, repita-a sem mudanças.',
    ].join('\n'),
    schema: {
      type: 'object',
      properties: {
        source_language: { type: 'string', description: 'ISO 639-1, ex.: en, fr, pt' },
        translation: { type: 'string' },
      },
      required: ['source_language', 'translation'],
    },
    temperature: 0.2,
  }
}

/** Valida a resposta da IA; lança erro se vier algo inesperado. */
export function parseSummaryTranslation(raw: unknown): SummaryTranslation {
  const value = raw as { source_language?: unknown; translation?: unknown } | null
  const lang = typeof value?.source_language === 'string' ? value.source_language.trim().toLowerCase() : ''
  const translation = typeof value?.translation === 'string' ? value.translation.trim() : ''
  if (!/^[a-z]{2}$/.test(lang)) throw new Error('Idioma inválido na resposta da IA')
  if (!translation || translation.length > 20000) throw new Error('Tradução vazia ou longa demais')
  return { sourceLanguage: lang, translation }
}
