/**
 * Design tokens — única fonte de verdade da identidade visual "Dois Amores".
 *
 * Para trocar a identidade visual, altere apenas este arquivo (e os assets).
 * Os valores viram variáveis CSS (`--da-*`, ver cssVars.ts) e o Tailwind só
 * enxerga essas variáveis (ver tailwindTheme.ts). Tamanhos em px são
 * convertidos para rem, respeitando o tamanho de fonte escolhido pelo usuário.
 *
 * Cores confirmadas pelas variáveis do Figma "App Clube do Livro — Design (PWA)".
 */

export const palette = {
  green: '#2D4A2F',
  pink: '#F28CA5',
  pinkLight: '#F9C6D3',
  /** Rosa escurecido para textos funcionais: contraste ≥ 4.5:1 sobre papel e creme. */
  pinkStrong: '#B03A5E',
  cream: '#FDF9EC',
  paper: '#EFE6D2',
  white: '#FFFFFF',
  danger: '#9E2A2B',
} as const

export const tokens = {
  color: {
    primary: palette.green,
    accent: palette.pink,
    accentStrong: palette.pinkStrong,
    stripe: palette.pinkLight,
    page: palette.cream,
    card: palette.paper,
    inverse: palette.white,
    border: palette.green,
    ratingFilled: palette.green,
    ratingEmpty: palette.pink,
    navActive: palette.green,
    navInactive: palette.pinkStrong,
    danger: palette.danger,
    transparent: 'transparent',
    current: 'currentColor',
  },

  font: {
    display: {
      family: 'Bebas Neue',
      fallback: '"Arial Narrow", "Roboto Condensed", sans-serif',
      files: [{ src: '/fonts/BebasNeue-Regular.ttf', weight: 400 }],
    },
    script: {
      family: 'Pinyon Script',
      fallback: 'cursive',
      files: [{ src: '/fonts/PinyonScript-Regular.ttf', weight: 400 }],
    },
    mono: {
      family: 'Courier Prime',
      fallback: '"Courier New", monospace',
      files: [
        { src: '/fonts/CourierPrime-Regular.ttf', weight: 400 },
        { src: '/fonts/CourierPrime-Bold.ttf', weight: 700 },
      ],
    },
    hand: {
      family: 'Caveat',
      fallback: 'cursive',
      files: [{ src: '/fonts/Caveat-Regular.ttf', weight: 400 }],
    },
    sans: {
      family: 'Inter',
      fallback: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      files: [
        { src: '/fonts/Inter-Regular.ttf', weight: 400 },
        { src: '/fonts/Inter-SemiBold.ttf', weight: 600 },
      ],
    },
  },

  /** px */
  fontSize: {
    '2xs': 10,
    xs: 12,
    sm: 14,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    'title-sm': 22,
    '2xl': 24,
    'title-md': 28,
    '3xl': 30,
    '4xl': 36,
    '5xl': 40,
    '6xl': 56,
  },

  lineHeight: {
    none: '1',
    tight: '1.15',
    normal: '1.35',
    relaxed: '1.55',
  },

  /** em */
  letterSpacing: {
    normal: '0',
    label: '0.08em',
    wide: '0.04em',
  },

  /** px — escala de espaçamentos (grade de 4px do Figma) */
  space: {
    '0': 0,
    px: 1,
    '0.5': 2,
    '1': 4,
    '1.5': 6,
    '2': 8,
    '3': 12,
    '4': 16,
    '5': 20,
    '6': 24,
    '8': 32,
    '10': 40,
    '12': 48,
    '16': 64,
  },

  /** px — dimensões fixas de elementos (capas, avatares, estrelas, navegação) */
  size: {
    'star-sm': 12,
    'star-md': 16,
    'star-post': 18,
    'star-lg': 20,
    'avatar-sm': 44,
    'avatar-md': 56,
    'avatar-lg': 88,
    'cover-xs-w': 40,
    'cover-xs-h': 56,
    'club-xs-w': 56,
    'club-xs-h': 80,
    'cover-sm-w': 80,
    'cover-sm-h': 120,
    'cover-md-w': 100,
    'cover-md-h': 150,
    'cover-lg-w': 140,
    'cover-lg-h': 210,
    'control-h': 48,
    'nav-h': 72,
    'sidebar-w': 240,
    'content-max': 480,
    'content-wide': 960,
  },

  /** px */
  radius: {
    none: 0,
    sm: 8,
    card: 16,
    full: 9999,
  },

  /** px */
  borderWidth: {
    '0': 0,
    DEFAULT: 2,
    thin: 1,
  },

  shadow: {
    none: 'none',
    card: '0 1px 2px rgb(45 74 47 / 0.08)',
    raised: '0 6px 20px rgb(45 74 47 / 0.16)',
  },

  /** px */
  blur: {
    cover: 6,
  },

  duration: {
    fast: '120ms',
    base: '200ms',
  },

  /** px — larguras mínimas dos breakpoints (mobile first) */
  breakpoint: {
    md: 768,
    lg: 1024,
  },
} as const

export type Tokens = typeof tokens
export type FontRole = keyof Tokens['font']
