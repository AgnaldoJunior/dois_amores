export type Ranks = {
  rank_characters: number | null
  rank_plot: number | null
  rank_writing: number | null
  rank_ending: number | null
}

export const RANK_KEYS = ['rank_characters', 'rank_plot', 'rank_writing', 'rank_ending'] as const

const mean = (values: number[]) =>
  values.length === 0 ? null : values.reduce((sum, v) => sum + v, 0) / values.length

/**
 * Média de um membro para um livro: média das notas preenchidas
 * (personagens, plot, escrita, final). Sem nenhuma nota → null.
 */
export function memberAverage(ranks: Ranks): number | null {
  return mean(RANK_KEYS.map((k) => ranks[k]).filter((v): v is number => v != null))
}

/**
 * Média geral do livro: média das médias dos membros (cada membro pesa igual,
 * independentemente de quantas notas preencheu). Membros sem nota são ignorados.
 */
export function bookAverage(memberAverages: (number | null)[]): number | null {
  return mean(memberAverages.filter((v): v is number => v != null))
}

/** Média geral a partir das notas brutas de cada membro. */
export function bookAverageFromRanks(members: Ranks[]): number | null {
  return bookAverage(members.map(memberAverage))
}

/** Arredonda para o meio ponto mais próximo (exibição em estrelas). */
export const roundToHalf = (value: number) => Math.round(value * 2) / 2

/** Formata com uma casa decimal no padrão brasileiro: 4.25 → "4,3". */
export const formatAverage = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
