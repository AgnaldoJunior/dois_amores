import { estimateLines, fitText, type FitBox } from './fitText'

const box: FitBox = { width: 200, height: 60, maxSize: 11, minSize: 8, charWidthEm: 0.5, lineHeight: 1.2 }

describe('ajuste de texto no PDF', () => {
  it('estima linhas quebrando por palavras e parágrafos', () => {
    // 200 / (10 * 0.5) = 40 caracteres por linha
    expect(estimateLines('palavra '.repeat(5).trim(), 10, box)).toBe(1)
    expect(estimateLines('a'.repeat(30) + ' ' + 'b'.repeat(30), 10, box)).toBe(2)
    expect(estimateLines('linha um\nlinha dois', 10, box)).toBe(2)
    expect(estimateLines('x'.repeat(100), 10, box)).toBe(3)
  })

  it('texto curto fica no tamanho máximo', () => {
    expect(fitText('Me acompanhou por dias.', box)).toEqual({
      fontSize: 11,
      text: 'Me acompanhou por dias.',
      overflow: null,
    })
  })

  it('texto médio diminui a fonte, mas não abaixo de 8 pt', () => {
    const result = fitText('palavra '.repeat(30), box)
    expect(result.fontSize).toBeLessThan(11)
    expect(result.fontSize).toBeGreaterThanOrEqual(8)
    expect(result.overflow).toBeNull()
  })

  it('texto longo demais: 8 pt e o resto vai para a página extra, sem perder palavras', () => {
    const text = Array.from({ length: 120 }, (_, i) => `p${i}`).join(' ')
    const result = fitText(text, box)
    expect(result.fontSize).toBe(8)
    expect(result.text.endsWith(' …')).toBe(true)
    expect(result.overflow).not.toBeNull()
    const kept = result.text.replace(/ …$/, '')
    expect(`${kept} ${result.overflow}`).toBe(text)
  })
})
