/**
 * Ajuste de texto em caixas de tamanho fixo (o PDF não "cresce" como uma página web).
 *
 * Estratégia da especificação: diminuir a fonte até um mínimo legível (8 pt);
 * se ainda não couber, o que sobrar continua numa página extra.
 */

export type FitBox = {
  width: number
  height: number
  maxSize: number
  minSize: number
  /** Largura média de um caractere, em "em" (depende da fonte). */
  charWidthEm: number
  /** Altura da linha em relação ao tamanho da fonte. */
  lineHeight: number
}

export type FitResult = {
  fontSize: number
  /** Parte que coube na caixa. */
  text: string
  /** Parte que vai para a página extra (null se coube tudo). */
  overflow: string | null
}

/** Quantas linhas o texto ocupa numa largura, quebrando por palavra (estimativa). */
export function estimateLines(text: string, fontSize: number, box: Pick<FitBox, 'width' | 'charWidthEm'>) {
  const charsPerLine = Math.max(1, Math.floor(box.width / (fontSize * box.charWidthEm)))
  return text.split('\n').reduce((total, paragraph) => {
    let lines = 1
    let current = 0
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const length = word.length
      if (current === 0) current = length
      else if (current + 1 + length <= charsPerLine) current += 1 + length
      else {
        lines += 1
        current = length
      }
      while (current > charsPerLine) {
        lines += 1
        current -= charsPerLine
      }
    }
    return total + lines
  }, 0)
}

const linesThatFit = (fontSize: number, box: FitBox) => Math.max(1, Math.floor(box.height / (fontSize * box.lineHeight)))

export function fitText(text: string, box: FitBox): FitResult {
  const clean = text.trim()
  for (let size = box.maxSize; size >= box.minSize; size -= 0.5) {
    if (estimateLines(clean, size, box) <= linesThatFit(size, box)) {
      return { fontSize: size, text: clean, overflow: null }
    }
  }
  // Nem no mínimo coube: corta por palavras e manda o resto para a página extra.
  const size = box.minSize
  const limit = linesThatFit(size, box)
  const words = clean.split(/(\s+)/)
  let fitted = ''
  for (const piece of words) {
    const candidate = fitted + piece
    if (estimateLines(`${candidate.trim()} …`, size, box) > limit) break
    fitted = candidate
  }
  const head = fitted.trim()
  const rest = clean.slice(fitted.length).trim()
  return { fontSize: size, text: `${head} …`, overflow: rest || null }
}
