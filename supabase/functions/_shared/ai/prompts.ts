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

// -----------------------------------------------------------------------------
// Citações favoritas
// -----------------------------------------------------------------------------

export type BookForQuotes = { title: string; author: string | null; summary: string | null }
export type QuoteSuggestion = { text: string; context: string | null }

export function suggestQuotesRequest(book: BookForQuotes): JsonRequest {
  return {
    system:
      'Você ajuda leitores a lembrar trechos marcantes de livros. Sugira apenas frases que você tem alta ' +
      'confiança de que estão no livro; prefira trechos curtos e conhecidos. Se o livro foi publicado no ' +
      'Brasil, use a tradução brasileira quando a conhecer; senão, traduza fielmente e diga isso no contexto. ' +
      'Nunca invente: se não tiver segurança, devolva uma lista vazia.',
    prompt: [
      `Livro: ${book.title}${book.author ? ` — ${book.author}` : ''}`,
      book.summary ? `Sinopse (para contexto):\n<sinopse>\n${book.summary.slice(0, 1500)}\n</sinopse>` : '',
      '',
      'Responda em JSON com "quotes": até 3 itens, cada um com:',
      '- text: a citação, sem aspas externas (no máximo 300 caracteres);',
      '- context: em português, onde aparece ou quem diz (curto), ou vazio.',
    ]
      .filter(Boolean)
      .join('\n'),
    schema: {
      type: 'object',
      properties: {
        quotes: {
          type: 'array',
          maxItems: 3,
          items: {
            type: 'object',
            properties: { text: { type: 'string' }, context: { type: 'string' } },
            required: ['text'],
          },
        },
      },
      required: ['quotes'],
    },
    temperature: 0.3,
  }
}

const stripQuotes = (text: string) => text.trim().replace(/^["“”«»']+|["“”«»']+$/g, '').trim()

export function parseQuotes(raw: unknown): QuoteSuggestion[] {
  const items = (raw as { quotes?: unknown } | null)?.quotes
  if (!Array.isArray(items)) throw new Error('Resposta sem lista de citações')
  const seen = new Set<string>()
  return items
    .map((item) => {
      const q = item as { text?: unknown; context?: unknown }
      const text = typeof q.text === 'string' ? stripQuotes(q.text) : ''
      const context = typeof q.context === 'string' && q.context.trim() ? q.context.trim().slice(0, 200) : null
      return { text, context }
    })
    .filter((q) => q.text.length >= 8 && q.text.length <= 400 && !seen.has(q.text) && seen.add(q.text))
    .slice(0, 3)
}

// -----------------------------------------------------------------------------
// Próxima leitura
// -----------------------------------------------------------------------------

export type ReadingForSuggestion = {
  title: string
  author: string | null
  /** Média das notas (1–5) ou null se ainda sem nota. */
  average: number | null
  finished: boolean
}

export type RawSuggestion = { title: string; author: string; reason: string }

/** Quantos candidatos pedir à IA: alguns não passam na conferência com a Open Library. */
export const SUGGESTION_CANDIDATES = 6

export function suggestNextReadsRequest(
  readings: ReadingForSuggestion[],
  avoid: string[],
  { audience = 'você' }: { audience?: string } = {},
): JsonRequest {
  const lines = readings.map(
    (r) =>
      `- ${r.title}${r.author ? ` (${r.author})` : ''}: ${
        r.average != null ? `nota ${r.average.toFixed(1)}/5` : r.finished ? 'sem nota' : 'lendo agora'
      }`,
  )
  return {
    system:
      'Você é uma livreira que recomenda livros com base no histórico de leitura. Recomende apenas livros ' +
      'que existem de verdade, com título e autor exatos; prefira o título da edição brasileira quando existir. ' +
      'Não recomende livros que já estão na lista. Varie autores. Justificativas curtas, em português do Brasil.',
    prompt: [
      `Histórico de leitura de ${audience} (nota média de 1 a 5):`,
      ...lines,
      avoid.length ? `\nNão sugira estes (já lidos ou na lista): ${avoid.join('; ')}` : '',
      '',
      `Sugira ${SUGGESTION_CANDIDATES} livros em JSON, campo "suggestions", cada um com:`,
      '- title: título (de preferência da edição brasileira);',
      '- author: autor ou autora;',
      `- reason: por que combina com ${audience}, citando um livro do histórico (até 90 caracteres, ` +
        'ex.: "Porque você gostou de Três").',
    ]
      .filter(Boolean)
      .join('\n'),
    schema: {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          maxItems: SUGGESTION_CANDIDATES,
          items: {
            type: 'object',
            properties: { title: { type: 'string' }, author: { type: 'string' }, reason: { type: 'string' } },
            required: ['title', 'author', 'reason'],
          },
        },
      },
      required: ['suggestions'],
    },
    temperature: 0.7,
  }
}

export function parseSuggestions(raw: unknown): RawSuggestion[] {
  const items = (raw as { suggestions?: unknown } | null)?.suggestions
  if (!Array.isArray(items)) throw new Error('Resposta sem lista de sugestões')
  return items
    .map((item) => {
      const s = item as { title?: unknown; author?: unknown; reason?: unknown }
      return {
        title: typeof s.title === 'string' ? s.title.trim() : '',
        author: typeof s.author === 'string' ? s.author.trim() : '',
        reason: typeof s.reason === 'string' ? s.reason.trim().slice(0, 140) : '',
      }
    })
    .filter((s) => s.title && s.author)
    .slice(0, SUGGESTION_CANDIDATES)
}

// -----------------------------------------------------------------------------
// Próxima leitura do clube
// -----------------------------------------------------------------------------

export type ClubBookForSuggestion = {
  title: string
  author: string | null
  /** Média de cada membro (anônimo, na mesma ordem para todos os livros); null = não avaliou. */
  memberAverages: (number | null)[]
}

/**
 * A IA recebe os livros do clube e a média das 4 notas de cada membro para cada
 * livro. Os membros vão como "Membro 1, 2…" (nomes não saem do app).
 */
export function suggestClubReadsRequest(books: ClubBookForSuggestion[], avoid: string[]): JsonRequest {
  const lines = books.map((b) => {
    const notes = b.memberAverages
      .map((avg, i) => `Membro ${i + 1}: ${avg == null ? '—' : avg.toFixed(1)}`)
      .join(', ')
    return `- ${b.title}${b.author ? ` (${b.author})` : ''} → ${notes}`
  })
  return {
    system:
      'Você é uma livreira que escolhe o próximo livro de um clube de leitura. Recomende apenas livros que ' +
      'existem de verdade, com título e autor exatos; prefira o título da edição brasileira quando existir. ' +
      'Busque livros que agradem o grupo como um todo, considerando onde as notas concordam e discordam. ' +
      'Não repita livros do clube. Varie autores. Justificativas curtas, em português do Brasil.',
    prompt: [
      'Livros do clube com a média (1 a 5) de cada membro:',
      ...lines,
      avoid.length ? `\nNão sugira estes: ${avoid.join('; ')}` : '',
      '',
      `Sugira ${SUGGESTION_CANDIDATES} livros em JSON, campo "suggestions", cada um com:`,
      '- title: título (de preferência da edição brasileira);',
      '- author: autor ou autora;',
      '- reason: por que combina com o clube, citando livros do histórico (até 90 caracteres).',
    ]
      .filter(Boolean)
      .join('\n'),
    schema: {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          maxItems: SUGGESTION_CANDIDATES,
          items: {
            type: 'object',
            properties: { title: { type: 'string' }, author: { type: 'string' }, reason: { type: 'string' } },
            required: ['title', 'author', 'reason'],
          },
        },
      },
      required: ['suggestions'],
    },
    temperature: 0.7,
  }
}
