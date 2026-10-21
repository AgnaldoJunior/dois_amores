import { cssVar } from './cssVars'
import { tokens } from './tokens'

/**
 * Tema do Tailwind derivado dos tokens. Cada utilitário aponta para uma
 * variável CSS (`var(--da-*)`), nunca para um valor literal. O tema padrão do
 * Tailwind não é importado (ver index.css), então só existem as classes
 * definidas aqui — `bg-red-500` ou `p-7`, por exemplo, não geram CSS.
 */
const mapVars = <T extends object>(group: string, source: T) =>
  Object.fromEntries(Object.keys(source).map((k) => [k, cssVar(group, k)])) as Record<
    keyof T & string,
    string
  >

const spacing = { ...mapVars('space', tokens.space), ...mapVars('size', tokens.size) }

export const tailwindTheme = {
  screens: Object.fromEntries(
    Object.entries(tokens.breakpoint).map(([k, v]) => [k, `${v}px`]),
  ),
  colors: mapVars('color', tokens.color),
  fontFamily: mapVars('font', tokens.font),
  fontSize: mapVars('text', tokens.fontSize),
  lineHeight: mapVars('leading', tokens.lineHeight),
  letterSpacing: mapVars('tracking', tokens.letterSpacing),
  spacing,
  borderRadius: mapVars('radius', tokens.radius),
  borderWidth: mapVars('border', tokens.borderWidth),
  boxShadow: mapVars('shadow', tokens.shadow),
  blur: mapVars('blur', tokens.blur),
  transitionDuration: { DEFAULT: cssVar('duration', 'base'), ...mapVars('duration', tokens.duration) },
}
