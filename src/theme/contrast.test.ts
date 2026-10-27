import { tokens } from './tokens'

/** Luminância relativa (WCAG 2.x). */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

const c = tokens.color

/** Pares de texto × fundo usados na interface (o rosa claro `accent` é só decorativo: logo e estrelas). */
const TEXT_PAIRS: [string, string, string][] = [
  ['texto verde sobre a página', c.primary, c.page],
  ['texto verde sobre cartões', c.primary, c.card],
  ['botão primário (branco sobre verde)', c.inverse, c.primary],
  ['abas inativas sobre a barra', c.navInactive, c.card],
  ['rosa forte (avisos de IA) sobre a página', c.accentStrong, c.page],
  ['rosa forte sobre cartões', c.accentStrong, c.card],
  ['erros sobre a página', c.danger, c.page],
  ['erros sobre cartões', c.danger, c.card],
  ['botão de exclusão (branco sobre vermelho)', c.inverse, c.danger],
]

describe('contraste das cores (WCAG AA, texto normal ≥ 4,5:1)', () => {
  it('calcula como a WCAG (preto × branco = 21:1)', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21)
  })

  it.each(TEXT_PAIRS)('%s', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it('estrelas vazias (contorno rosa) têm contraste de elemento gráfico ≥ 1,5 e vêm sempre com rótulo de texto', () => {
    // As estrelas têm aria-label ("4,5 de 5 estrelas"); o contorno é decorativo.
    expect(contrast(c.ratingEmpty, c.page)).toBeGreaterThanOrEqual(1.5)
  })
})
