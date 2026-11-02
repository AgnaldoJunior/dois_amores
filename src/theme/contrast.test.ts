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

/** Pares de texto × fundo usados na interface (`accent` e `line` são só decorativos). */
const TEXT_PAIRS: [string, string, string][] = [
  ['texto verde sobre a página', c.primary, c.page],
  ['texto verde sobre cartões', c.primary, c.card],
  ['texto verde sobre as pílulas rosa', c.primary, c.pill],
  ['texto verde sobre as listras', c.primary, c.stripeLight],
  ['botão primário (creme sobre verde)', c.inverse, c.primary],
  ['botão primário em foco (creme sobre verde escuro)', c.inverse, c.primaryHover],
  ['rótulos rosa sobre verde', c.pill, c.primary],
  ['abas inativas sobre a barra', c.navInactive, c.page],
  ['rosa forte (avisos de IA) sobre a página', c.accentStrong, c.page],
  ['rosa forte sobre cartões', c.accentStrong, c.card],
  ['texto secundário sobre a página', c.muted, c.page],
  ['texto secundário sobre cartões', c.muted, c.card],
  ['erros sobre a página', c.danger, c.page],
  ['erros sobre cartões', c.danger, c.card],
  ['botão de exclusão (creme sobre vermelho)', c.inverse, c.danger],
]

/** Texto grande (≥ 24px, títulos cursivos): WCAG AA pede ≥ 3:1. */
const LARGE_TEXT_PAIRS: [string, string, string][] = [
  ['títulos cursivos rosa sobre a página', c.title, c.page],
  ['títulos cursivos rosa sobre cartões', c.title, c.card],
]

describe('contraste das cores (WCAG AA, texto normal ≥ 4,5:1)', () => {
  it('calcula como a WCAG (preto × branco = 21:1)', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21)
  })

  it.each(TEXT_PAIRS)('%s', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(LARGE_TEXT_PAIRS)('%s (texto grande ≥ 3:1)', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3)
  })

  it('estrelas vazias (contorno verde) têm contraste de elemento gráfico ≥ 3:1', () => {
    expect(contrast(c.ratingEmpty, c.page)).toBeGreaterThanOrEqual(3)
    expect(contrast(c.ratingEmpty, c.card)).toBeGreaterThanOrEqual(3)
  })
})
