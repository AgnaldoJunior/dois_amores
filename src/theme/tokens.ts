/**
 * Design tokens — única fonte de verdade da identidade visual "Dois Amores".
 *
 * Para trocar a identidade visual, altere apenas este arquivo (e os assets).
 * Os valores viram variáveis CSS (`--da-*`, ver cssVars.ts) e o Tailwind só
 * enxerga essas variáveis (ver tailwindTheme.ts). Tamanhos em px são
 * convertidos para rem, respeitando o tamanho de fonte escolhido pelo usuário.
 *
 * Identidade "the bookside": vinho, papel creme e capas com lombada,
 * Playfair Display em itálico nos títulos, DM Serif Display nas citações e Inter no texto.
 */

export const palette = {
  wine: '#6B0D24',
  wineDark: '#4B0D1B',
  wineSoft: '#8E1D3D',
  ink: '#2B1420',
  paper: '#F9F5EE',
  card: '#FFF8F3',
  tag: '#F1E4DC',
  line: '#E6D5CE',
  sand: '#D8C3AA',
  shelf: '#C4AC93',
  /** Texto secundário: 4,7:1 sobre o papel. */
  muted: '#7A6A6E',
  /** Rosa queimado: só decorativo ou texto grande (4,1:1). */
  rose: '#B75A6B',
  /** Rosa claro: texto sobre o vinho (6,9:1) e etiquetas. */
  blush: '#E8B4BF',
  /** Dourado das estrelinhas (decorativo). */
  gold: '#C9A46A',
  /** Fundo em volta da coluna do app no desktop. */
  backdrop: '#E9E1D3',
  petal: '#FDF2F4',
  track: '#F0E6DC',
  danger: '#9E2A2B',
} as const

/**
 * Temas do perfil: cada pessoa escolhe a cor de destaque e o papel do próprio perfil.
 * `band` é a faixa de cima do cartão de amostra; `onAccent` é o texto sobre a cor de destaque.
 */
export const profileThemes = {
  classica: { label: 'biblioteca clássica', paper: palette.paper, band: '#C9A46A', accent: palette.wine, ink: palette.ink, card: palette.card, muted: palette.muted, onAccent: palette.paper },
  epoca: { label: 'romance de época', paper: '#ECEBE9', band: '#8F8A87', accent: '#55514F', ink: '#2E2B2A', card: '#F7F6F4', muted: '#625D5A', onAccent: '#F7F6F4' },
  madrugada: { label: 'madrugada', paper: '#E7E5EE', band: '#B9B3CC', accent: '#464052', ink: '#2E2A38', card: '#F6F4FA', muted: '#5F5870', onAccent: '#F6F4FA' },
  jardim: { label: 'jardim de livros', paper: '#E8E7DC', band: '#B6BBA4', accent: '#545B47', ink: '#2B2E24', card: '#F6F5EE', muted: '#5D6151', onAccent: '#F6F5EE' },
  tinta: { label: 'noite de tinta', paper: '#29252A', band: '#3B3239', accent: '#C9A46A', ink: '#F9F5EE', card: '#3B3239', muted: '#C4B8BD', onAccent: '#29252A' },
  rosa: { label: 'orelha rosa', paper: '#F9D9E2', band: '#F4C6D0', accent: '#963451', ink: '#3A1622', card: '#FDF2F4', muted: '#76505B', onAccent: '#FDF2F4' },
  kraft: { label: 'capa kraft', paper: '#D9C3A0', band: '#8E1D3D', accent: palette.wine, ink: palette.ink, card: '#EFE2CC', muted: '#5F4B44', onAccent: palette.paper },
  poesia: { label: 'poesia de bolso', paper: '#CFDDEB', band: '#8FB0D6', accent: '#2B4C7E', ink: '#1D2A3D', card: '#EAF1F8', muted: '#45556B', onAccent: '#EAF1F8' },
} as const

export type ProfileThemeId = keyof typeof profileThemes

/** Cores das estantes próprias: fundo do cartão e texto por cima. */
export const shelfColors = {
  vinho: { bg: palette.wine, fg: palette.paper, sub: palette.blush },
  rosa: { bg: palette.blush, fg: palette.wine, sub: palette.wine },
  areia: { bg: palette.sand, fg: palette.ink, sub: palette.wine },
  dourado: { bg: '#E8D3A8', fg: palette.ink, sub: palette.wine },
  tinta: { bg: '#29252A', fg: palette.paper, sub: '#E8D3A8' },
} as const

export const tokens = {
  color: {
    primary: palette.wine,
    primaryHover: palette.wineDark,
    primarySoft: palette.wineSoft,
    ink: palette.ink,
    page: palette.paper,
    card: palette.card,
    inverse: palette.paper,
    tag: palette.tag,
    line: palette.line,
    border: palette.sand,
    shelf: palette.shelf,
    muted: palette.muted,
    accent: palette.rose,
    blush: palette.blush,
    gold: palette.gold,
    backdrop: palette.backdrop,
    petal: palette.petal,
    track: palette.track,
    ratingFilled: palette.wine,
    ratingEmpty: palette.sand,
    danger: palette.danger,
    transparent: 'transparent',
    current: 'currentColor',
  },

  font: {
    /** Títulos: Playfair Display em itálico. */
    display: {
      family: 'Playfair Display',
      fallback: 'Georgia, serif',
      files: [
        { src: '/fonts/PlayfairDisplay-SemiBold.woff2', weight: 600, style: 'normal' },
        { src: '/fonts/PlayfairDisplay-SemiBoldItalic.woff2', weight: 600, style: 'italic' },
        { src: '/fonts/PlayfairDisplay-BoldItalic.woff2', weight: 700, style: 'italic' },
      ],
    },
    /** Citações, autores e notas: DM Serif Display. */
    serif: {
      family: 'DM Serif Display',
      fallback: 'Georgia, serif',
      files: [
        { src: '/fonts/DMSerifDisplay-Regular.woff2', weight: 400, style: 'normal' },
        { src: '/fonts/DMSerifDisplay-Italic.woff2', weight: 400, style: 'italic' },
      ],
    },
    /** Texto, rótulos, botões e campos. */
    sans: {
      family: 'Inter',
      fallback: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      files: [
        { src: '/fonts/Inter-Regular.woff2', weight: 400, style: 'normal' },
        { src: '/fonts/Inter-Medium.woff2', weight: 500, style: 'normal' },
        { src: '/fonts/Inter-SemiBold.woff2', weight: 600, style: 'normal' },
        { src: '/fonts/Inter-Bold.woff2', weight: 700, style: 'normal' },
      ],
    },
  },

  /** px */
  fontSize: {
    '2xs': 10,
    xs: 11,
    sm: 12,
    base: 13,
    md: 14,
    lg: 15,
    xl: 17,
    'title-sm': 19,
    '2xl': 21,
    'title-md': 23,
    '3xl': 26,
    '4xl': 32,
    '5xl': 40,
    '6xl': 46,
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    none: '1',
    tight: '1.15',
    snug: '1.3',
    normal: '1.4',
    relaxed: '1.5',
  },

  /** em */
  letterSpacing: {
    normal: '0',
    wide: '0.06em',
    label: '0.12em',
    eyebrow: '0.14em',
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
    '4.5': 18,
    '5': 20,
    '6': 24,
    '7': 28,
    '8': 32,
    '9': 36,
    '10': 40,
    '11': 44,
    '12': 48,
    '13': 52,
    '14': 56,
    '15': 60,
    '16': 64,
    '20': 80,
    '24': 96,
    '32': 128,
    '36': 144,
  },

  /** px — dimensões fixas de elementos (capas, avatares, estrelas, navegação) */
  size: {
    'star-xs': 10,
    'star-sm': 12,
    'star-md': 14,
    'star-lg': 22,
    'icon-sm': 16,
    icon: 21,
    'icon-lg': 30,
    'control-h': 48,
    'button-h': 52,
    'button-sm-h': 34,
    'chip-h': 32,
    'tag-h': 22,
    'avatar-xs': 30,
    'avatar-sm': 44,
    'avatar-md': 56,
    'avatar-lg': 78,
    'avatar-xl': 104,
    'avatar-podium-3': 56,
    'avatar-podium-2': 60,
    'avatar-podium-1': 72,
    'avatar-art': 200,
    swatch: 34,
    /** capas: lista, feed, prateleira, grade, amigos, favoritos, destaque */
    'cover-xs-w': 38,
    'cover-xs-h': 56,
    'cover-feed-w': 52,
    'cover-feed-h': 78,
    'cover-list-w': 54,
    'cover-list-h': 81,
    'cover-friend-w': 58,
    'cover-friend-h': 87,
    'cover-shelf-w': 74,
    'cover-shelf-h': 110,
    'cover-fav-w': 78,
    'cover-fav-h': 106,
    'cover-grid-w': 100,
    'cover-grid-h': 150,
    'cover-hero-w': 166,
    'cover-hero-h': 249,
    shelf: 9,
    'profile-cover': 198,
    'club-cover': 146,
    'club-badge': 62,
    'podium-1': 104,
    'podium-2': 76,
    'podium-3': 54,
    progress: 7,
    'theme-card-w': 92,
    'theme-card-h': 78,
    'nav-h': 70,
    'sidebar-w': 240,
    'content-max': 480,
    'content-wide': 960,
  },

  /** px */
  radius: {
    none: 0,
    xs: 3,
    sm: 6,
    md: 10,
    card: 12,
    sheet: 34,
    full: 9999,
  },

  /** px */
  borderWidth: {
    '0': 0,
    DEFAULT: 1,
    thin: 1,
    strong: 2,
    thick: 3,
  },

  shadow: {
    none: 'none',
    /** lombada e sombra das capas */
    cover: 'inset 5px 0 6px -4px rgb(43 20 32 / 0.5), 2px 4px 9px -3px rgb(43 20 32 / 0.35)',
    hero: 'inset 7px 0 8px -6px rgb(43 20 32 / 0.55), 0 16px 28px -12px rgb(43 20 32 / 0.5)',
    soft: '0 5px 12px -8px rgb(43 20 32 / 0.5)',
    raised: '0 12px 24px -12px rgb(43 20 32 / 0.45)',
    shelf: `0 2px 0 ${palette.shelf}`,
    selected: '0 6px 12px -8px rgb(107 13 36 / 0.6)',
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
   * Opções na ordem em que aparecem no criador de avatar; os valores guardados no
   * perfil são índices, então as cores de cada opção não mudam de lugar.
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
      { fill: '#EE8AA0', label: 'rosa' },
      { fill: palette.wine, label: 'vinho' },
    ],
    shirt: [
      { fill: palette.wine, label: 'vinho' },
      { fill: palette.blush, label: 'rosa' },
      { fill: palette.sand, label: 'areia' },
      { fill: '#2A1A14', label: 'preto' },
    ],
    paper: palette.card,
    eye: '#2A1A14',
    mouth: '#7A3A2E',
    frame: '#3A2A22',
    blush: palette.blush,
    bow: palette.blush,
    bowLine: palette.rose,
    accent: palette.gold,
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

/** Variáveis CSS que aplicam um tema de perfil a um trecho da tela. */
export function themeVars(id: string | null | undefined): Record<string, string> {
  const t = profileThemes[(id ?? 'classica') as ProfileThemeId] ?? profileThemes.classica
  return {
    '--da-color-primary': t.accent,
    '--da-color-page': t.paper,
    '--da-color-ink': t.ink,
    '--da-color-card': t.card,
    '--da-color-muted': t.muted,
    '--da-color-inverse': t.onAccent,
  }
}
