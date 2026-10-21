import { tokens as defaultTokens, type Tokens } from './tokens'

const ROOT_FONT_PX = 16
const PREFIX = '--da'

export const rem = (px: number) => (px === 0 ? '0' : `${px / ROOT_FONT_PX}rem`)

const sanitize = (key: string) => key.replace(/\./g, '_')

/** Nome da variável CSS de um token, ex.: cssVar('color', 'primary') → `--da-color-primary`. */
export const cssVarName = (group: string, key: string) =>
  key === 'DEFAULT' ? `${PREFIX}-${group}` : `${PREFIX}-${group}-${sanitize(key)}`

export const cssVar = (group: string, key: string) => `var(${cssVarName(group, key)})`

export const fontStack = (font: Tokens['font'][keyof Tokens['font']]) =>
  `"${font.family}", ${font.fallback}`

export function buildCssVariables(t: Tokens = defaultTokens): Record<string, string> {
  const vars: Record<string, string> = {}
  const add = (group: string, key: string, value: string) => {
    vars[cssVarName(group, key)] = value
  }

  for (const [k, v] of Object.entries(t.color)) add('color', k, v)
  for (const [k, v] of Object.entries(t.font)) add('font', k, fontStack(v))
  for (const [k, v] of Object.entries(t.fontSize)) add('text', k, rem(v))
  for (const [k, v] of Object.entries(t.lineHeight)) add('leading', k, v)
  for (const [k, v] of Object.entries(t.letterSpacing)) add('tracking', k, v)
  for (const [k, v] of Object.entries(t.space)) add('space', k, rem(v))
  for (const [k, v] of Object.entries(t.size)) add('size', k, rem(v))
  for (const [k, v] of Object.entries(t.radius)) add('radius', k, v === 9999 ? '9999px' : rem(v))
  for (const [k, v] of Object.entries(t.borderWidth)) add('border', k, `${v}px`)
  for (const [k, v] of Object.entries(t.shadow)) add('shadow', k, v)
  for (const [k, v] of Object.entries(t.blur)) add('blur', k, `${v}px`)
  for (const [k, v] of Object.entries(t.duration)) add('duration', k, v)

  return vars
}

export function buildFontFaces(t: Tokens = defaultTokens): string {
  return Object.values(t.font)
    .flatMap((font) =>
      font.files.map(
        (file) =>
          `@font-face{font-family:"${font.family}";src:url("${file.src}") format("truetype");` +
          `font-weight:${file.weight};font-style:normal;font-display:swap;}`,
      ),
    )
    .join('\n')
}

export function buildTokensStylesheet(t: Tokens = defaultTokens): string {
  const declarations = Object.entries(buildCssVariables(t))
    .map(([name, value]) => `${name}:${value};`)
    .join('')
  return `${buildFontFaces(t)}\n:root{${declarations}}`
}

/** Injeta as variáveis e @font-face no <head>. Chamado uma vez, antes do primeiro render. */
export function applyTokens(doc: Document = document, t: Tokens = defaultTokens) {
  const id = 'da-tokens'
  let style = doc.getElementById(id) as HTMLStyleElement | null
  if (!style) {
    style = doc.createElement('style')
    style.id = id
    doc.head.prepend(style)
  }
  style.textContent = buildTokensStylesheet(t)
}
