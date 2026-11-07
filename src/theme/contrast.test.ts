import { profileThemes, tokens } from './tokens'

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

/** Pares de texto × fundo usados na interface (`accent`, `gold` e `line` são só decorativos). */
const TEXT_PAIRS: [string, string, string][] = [
  ['texto sobre o papel', c.ink, c.page],
  ['texto sobre cartões', c.ink, c.card],
  ['vinho (títulos, links) sobre o papel', c.primary, c.page],
  ['vinho sobre cartões', c.primary, c.card],
  ['vinho sobre etiquetas', c.primary, c.tag],
  ['vinho sobre o rosa claro', c.primary, c.blush],
  ['botão (papel sobre vinho)', c.inverse, c.primary],
  ['botão em foco (papel sobre vinho escuro)', c.inverse, c.primaryHover],
  ['rosa claro sobre o vinho', c.blush, c.primary],
  ['texto sobre a areia', c.ink, c.border],
  ['texto secundário sobre o papel', c.muted, c.page],
  ['texto secundário sobre cartões', c.muted, c.card],
  ['erros sobre o papel', c.danger, c.page],
  ['erros sobre cartões', c.danger, c.card],
  ['botão de exclusão (papel sobre vermelho)', c.inverse, c.danger],
]

/** Texto grande (≥ 24px ou ≥ 19px em negrito): WCAG AA pede ≥ 3:1. */
const LARGE_TEXT_PAIRS: [string, string, string][] = [['rosa queimado em destaques grandes', c.accent, c.page]]

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

  it('estrelas cheias (vinho) têm contraste de elemento gráfico ≥ 3:1 e vêm com rótulo de texto', () => {
    expect(contrast(c.ratingFilled, c.page)).toBeGreaterThanOrEqual(3)
    expect(contrast(c.ratingFilled, c.card)).toBeGreaterThanOrEqual(3)
  })
})

describe('temas do perfil (texto ≥ 4,5:1)', () => {
  it.each(Object.entries(profileThemes))('%s', (_id, t) => {
    expect(contrast(t.accent, t.paper)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t.ink, t.paper)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t.muted, t.paper)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t.accent, t.card)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t.ink, t.card)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5)
  })
})
