import type { ReadingValues } from './api'

export type ReadingForm = {
  started_on: string
  finished_on: string
  rank_characters: number | null
  rank_plot: number | null
  rank_writing: number | null
  rank_ending: number | null
  favorite_character: string
  favorite_quote: string
  comment: string
}

export type ReadingErrors = Partial<Record<'book' | 'started_on' | 'finished_on', string>>

export function validateReading(form: ReadingForm, hasBook: boolean, today: string): ReadingErrors {
  const errors: ReadingErrors = {}
  if (!hasBook) errors.book = 'Escolha um livro na busca.'
  if (!form.started_on) errors.started_on = 'Informe quando você começou a ler.'
  else if (form.started_on > today) errors.started_on = 'O início não pode ser no futuro.'
  if (form.finished_on) {
    if (form.finished_on > today) errors.finished_on = 'O fim não pode ser no futuro.'
    else if (form.started_on && form.finished_on < form.started_on)
      errors.finished_on = 'O fim precisa ser depois do início.'
  }
  return errors
}

const blankToNull = (value: string) => (value.trim() ? value.trim() : null)

/** Converte o formulário para o formato da tabela user_books. */
export function toReadingValues(form: ReadingForm): ReadingValues {
  return {
    started_on: form.started_on,
    finished_on: form.finished_on || null,
    rank_characters: form.rank_characters,
    rank_plot: form.rank_plot,
    rank_writing: form.rank_writing,
    rank_ending: form.rank_ending,
    favorite_character: blankToNull(form.favorite_character),
    favorite_quote: blankToNull(form.favorite_quote),
    comment: blankToNull(form.comment),
  }
}

export function fromReadingValues(values: ReadingValues): ReadingForm {
  return {
    started_on: values.started_on,
    finished_on: values.finished_on ?? '',
    rank_characters: values.rank_characters,
    rank_plot: values.rank_plot,
    rank_writing: values.rank_writing,
    rank_ending: values.rank_ending,
    favorite_character: values.favorite_character ?? '',
    favorite_quote: values.favorite_quote ?? '',
    comment: values.comment ?? '',
  }
}

export const RANK_FIELDS = [
  { key: 'rank_characters', label: 'Personagens' },
  { key: 'rank_plot', label: 'Plot' },
  { key: 'rank_writing', label: 'Escrita' },
  { key: 'rank_ending', label: 'Final' },
] as const
