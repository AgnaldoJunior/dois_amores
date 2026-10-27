/** Comparação tolerante de títulos e autores (acentos, caixa e pontuação não importam). */

export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** 3 = título igual; 2 = um começa com o outro; 1 = um contém o outro; 0 = diferente. */
export function titleScore(candidate: string, wanted: string) {
  const a = normalize(candidate)
  const b = normalize(wanted)
  if (!a || !b) return 0
  if (a === b) return 3
  if (a.startsWith(b) || b.startsWith(a)) return 2
  if (a.includes(b) || b.includes(a)) return 1
  return 0
}

/** O sobrenome do autor aparece entre os autores informados? */
export function authorMatches(authors: string[] | undefined, wanted: string | null) {
  if (!wanted) return true
  const surname = normalize(wanted).split(' ').at(-1) ?? ''
  return Boolean(surname) && (authors ?? []).some((a) => normalize(a).split(' ').includes(surname))
}
