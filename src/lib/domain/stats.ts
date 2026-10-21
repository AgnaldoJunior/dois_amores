export type ReadingForStats = {
  finished_on: string | null
  pages: number | null
}

export type ReadingStats = {
  booksRead: number
  pagesRead: number
  clubs: number
}

/**
 * Estatísticas da tela inicial:
 *  - livros lidos: leituras com data de fim;
 *  - páginas lidas: soma das páginas dos livros concluídos (livros sem número de páginas contam 0);
 *  - clubes: número de clubes em que o usuário participa.
 */
export function computeReadingStats(readings: ReadingForStats[], clubsCount: number): ReadingStats {
  const finished = readings.filter((r) => r.finished_on != null)
  return {
    booksRead: finished.length,
    pagesRead: finished.reduce((sum, r) => sum + (r.pages ?? 0), 0),
    clubs: clubsCount,
  }
}

/** 3480 → "3.480" */
export const formatCount = (value: number) => value.toLocaleString('pt-BR')
