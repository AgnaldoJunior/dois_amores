import { applyTokens, buildCssVariables, buildFontFaces, cssVar, rem } from './cssVars'
import { tailwindTheme } from './tailwindTheme'
import { tokens } from './tokens'

describe('design tokens → CSS', () => {
  it('converte px em rem', () => {
    expect(rem(16)).toBe('1rem')
    expect(rem(24)).toBe('1.5rem')
    expect(rem(0)).toBe('0')
  })

  it('gera uma variável para cada token de cor, tamanho e espaçamento', () => {
    const vars = buildCssVariables()
    expect(vars['--da-color-primary']).toBe(tokens.color.primary)
    expect(vars['--da-color-accent']).toBe(tokens.color.accent)
    expect(vars['--da-text-md']).toBe('1rem')
    expect(vars['--da-space-0_5']).toBe('0.125rem')
    expect(vars['--da-size-avatar-md']).toBe('3.5rem')
    expect(vars['--da-radius-card']).toBe('1rem')
    expect(vars['--da-border']).toBe('2px')
    expect(vars['--da-font-display']).toContain('"Bebas Neue"')
    expect(Object.keys(vars).filter((k) => k.startsWith('--da-color-'))).toHaveLength(
      Object.keys(tokens.color).length,
    )
  })

  it('declara @font-face para todos os arquivos de fonte', () => {
    const css = buildFontFaces()
    const files = Object.values(tokens.font).flatMap((f): readonly { src: string }[] => f.files)
    for (const file of files) expect(css).toContain(file.src)
    expect(css.match(/@font-face/g)).toHaveLength(files.length)
  })

  it('o tema do Tailwind só referencia variáveis CSS', () => {
    expect(tailwindTheme.colors.primary).toBe(cssVar('color', 'primary'))
    const values = Object.values(tailwindTheme).flatMap((group) => Object.values(group))
    const nonVar = values.filter((v) => !String(v).startsWith('var(--da-') && !/^\d+px$/.test(String(v)))
    expect(nonVar).toEqual([])
  })

  it('injeta uma única folha de estilo no documento', () => {
    applyTokens(document)
    applyTokens(document)
    const styles = document.querySelectorAll('#da-tokens')
    expect(styles).toHaveLength(1)
    expect(styles[0]?.textContent).toContain('--da-color-page')
  })
})
