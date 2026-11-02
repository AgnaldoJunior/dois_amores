/**
 * Design tokens — única fonte de verdade da identidade visual "Dois Amores".
 *
 * Para trocar a identidade visual, altere apenas este arquivo (e os assets).
 * Os valores viram variáveis CSS (`--da-*`, ver cssVars.ts) e o Tailwind só
 * enxerga essas variáveis (ver tailwindTheme.ts). Tamanhos em px são
 * convertidos para rem, respeitando o tamanho de fonte escolhido pelo usuário.
 *
 * Paleta e fontes do design "Dois Amores · clube do livro" (scrapbook).
 */

export const palette = {
  green: '#0B5130',
  greenDark: '#08391F',
  cream: '#FBF8EC',
  kraft: '#EFE8DA',
  stripeLight: '#FBF5E8',
  /** Rosa claro das pílulas, listras e botões secundários (texto verde por cima: 6,1:1). */
  pinkPill: '#F6C4D0',
  /** Rosa dos fios e divisórias (decorativo). */
  pinkLine: '#E8879E',
  /** Rosa do avatar e da moldura polaroid (decorativo). */
  pinkAvatar: '#EE8AA0',
  /** Rosa dos títulos cursivos: 4:1 sobre o creme, só para texto grande (≥ 24px). */
  pinkTitle: '#C9506F',
  /** Rosa escurecido para textos funcionais: contraste ≥ 4.5:1 sobre creme e kraft. */
  pinkStrong: '#B03F5E',
  shelfShadow: '#D9CBB0',
  dashed: '#CDBF9F',
  /** Texto secundário (≥ 5:1 sobre creme e kraft). */
  muted: '#6E6040',
  danger: '#9E2A2B',
} as const

export const tokens = {
  color: {
    primary: palette.green,
    primaryHover: palette.greenDark,
    accent: palette.pinkAvatar,
    accentStrong: palette.pinkStrong,
    title: palette.pinkTitle,
    pill: palette.pinkPill,
    line: palette.pinkLine,
    stripe: palette.pinkPill,
    stripeLight: palette.stripeLight,
    page: palette.cream,
    card: palette.kraft,
    inverse: palette.cream,
    border: palette.green,
    muted: palette.muted,
    slot: palette.dashed,
    shelfShadow: palette.shelfShadow,
    ratingFilled: palette.green,
    ratingEmpty: palette.green,
    navActive: palette.green,
    navInactive: palette.green,
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
    /** Rótulos e botões: máquina de escrever em negrito, caixa alta. */
    mono: {
      family: 'Courier Prime',
      fallback: '"Courier New", monospace',
      files: [
        { src: '/fonts/CourierPrime-Regular.ttf', weight: 400 },
        { src: '/fonts/CourierPrime-Bold.ttf', weight: 700 },
      ],
    },
    /** Títulos de livros (tipo de máquina gasta). */
    type: {
      family: 'Special Elite',
      fallback: '"Courier New", monospace',
      files: [{ src: '/fonts/SpecialElite-Regular.ttf', weight: 400 }],
    },
    /** Texto corrido manuscrito: comentários, citações, nomes de autores. */
    hand: {
      family: 'Shadows Into Light Two',
      fallback: 'cursive',
      files: [{ src: '/fonts/ShadowsIntoLightTwo-Regular.ttf', weight: 400 }],
    },
    /** Campos de formulário e textos longos (resumos): leitura confortável. */
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
    '3xl': 32,
    '4xl': 36,
    stat: 38,
    '5xl': 44,
    '6xl': 56,
  },

  fontWeight: {
    normal: 400,
    semibold: 600,
    bold: 700,
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

  /** px — escala de espaçamentos (grade de 4px) */
  space: {
    '0': 0,
    px: 1,
    '0.5': 2,
    '1': 4,
    '1.5': 6,
    '2': 8,
    '2.5': 10,
    '3': 12,
    '3.5': 14,
    '4': 16,
    '5': 20,
    '6': 24,
    '8': 32,
    '10': 40,
    '9': 36,
    '11': 44,
    '12': 48,
    '13': 52,
    '15': 60,
    '16': 64,
    '24': 96,
  },

  /** px — dimensões fixas de elementos (capas, avatares, estrelas, navegação) */
  size: {
    'star-xs': 10,
    'star-sm': 12,
    'star-md': 16,
    'star-post': 18,
    'star-lg': 24,
    'icon-sm': 18,
    'pill-h': 40,
    'rating-label-w': 112,
    'button-sm-h': 36,
    header: 128,
    'club-header': 196,
    'club-badge': 84,
    icon: 24,
    'avatar-xs': 38,
    'avatar-sm': 44,
    'avatar-md': 56,
    'avatar-podium-3': 56,
    'avatar-podium-2': 60,
    'avatar-podium-1': 72,
    'avatar-lg': 88,
    'avatar-xl': 200,
    swatch: 44,
    'cover-xs-w': 40,
    'cover-xs-h': 56,
    'feed-cover-w': 52,
    'feed-cover-h': 76,
    'club-xs-w': 56,
    'club-xs-h': 80,
    'stamp-w': 74,
    'stamp-h': 106,
    'track-w': 78,
    'track-h': 112,
    /** listras rosa e creme (cabeçalhos, pódio, prévia da revista) */
    stripe: 13,
    /** selo picotado em volta das capas: margem, grade e raio dos furos */
    'stamp-pad': 4,
    'stamp-grid': 7,
    'stamp-dot': 2,
    /** recorte semicircular nas laterais do ingresso */
    'ticket-notch': 12,
    'cover-sm-w': 80,
    'cover-sm-h': 120,
    'cover-md-w': 100,
    'cover-md-h': 150,
    'cover-lg-w': 140,
    'cover-lg-h': 210,
    plank: 7,
    'tape-w': 80,
    'tape-h': 24,
    'podium-1': 104,
    'podium-2': 76,
    'podium-3': 54,
    progress: 10,
    preview: 290,
    'control-h': 48,
    'nav-h': 84,
    'sidebar-w': 240,
    'content-max': 480,
    'content-wide': 960,
  },

  /** px */
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    card: 6,
    pill: 12,
    full: 9999,
  },

  /** px */
  borderWidth: {
    '0': 0,
    DEFAULT: 1.5,
    thin: 1,
    thick: 2.5,
  },

  shadow: {
    none: 'none',
    card: '0 1px 2px rgb(11 81 48 / 0.08)',
    raised: '0 6px 20px rgb(11 81 48 / 0.16)',
    lift: '0 3px 0 rgb(11 81 48 / 0.15)',
    plank: `0 3px 0 ${palette.shelfShadow}`,
    spine: '2px 0 0 rgb(11 81 48 / 0.25)',
  },

  /** graus — inclinação dos elementos colados (fitas, selos, polaroid) */
  tilt: {
    half: 0.5,
    '1': 1.5,
    '2': 3,
    '3': 6,
  },

  /** px */
  blur: {
    cover: 6,
  },

  duration: {
    fast: '120ms',
    base: '200ms',
  },

  /**
   * Cores do avatar ilustrado (SVG desenhado no app e rasterizado para a revista).
   * Opções na ordem em que aparecem no criador de avatar.
   */
  avatar: {
    skin: [
      { fill: '#F6D2BE', shade: '#E9B39C', label: 'pele clara' },
      { fill: '#EDB596', shade: '#D99878', label: 'pele média clara' },
      { fill: '#C98E6B', shade: '#B07655', label: 'pele média' },
      { fill: '#8D5A3E', shade: '#744631', label: 'pele escura' },
    ],
    hair: [
      { fill: '#2A1A14', label: 'preto' },
      { fill: '#5A3122', label: 'castanho' },
      { fill: '#B8340E', label: 'ruivo' },
      { fill: '#E3B562', label: 'loiro' },
      { fill: palette.pinkAvatar, label: 'rosa' },
      { fill: palette.green, label: 'verde' },
    ],
    shirt: [
      { fill: palette.green, label: 'verde' },
      { fill: palette.pinkAvatar, label: 'rosa' },
      { fill: palette.kraft, label: 'kraft' },
      { fill: '#2A1A14', label: 'preto' },
    ],
    paper: '#FDFBF3',
    eye: '#2A1A14',
    mouth: '#7A3A2E',
    frame: '#3A2A22',
    blush: palette.pinkAvatar,
    bow: palette.pinkAvatar,
    bowLine: palette.pinkTitle,
    accent: palette.green,
  },

  /** px — larguras mínimas dos breakpoints (mobile first) */
  breakpoint: {
    sm: 560,
    md: 768,
    lg: 1024,
  },
} as const

export type Tokens = typeof tokens
export type FontRole = keyof Tokens['font']
