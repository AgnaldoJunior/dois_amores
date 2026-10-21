export type NavItem = { to: string; label: string; end?: boolean }

export const navItems: NavItem[] = [
  { to: '/', label: 'Início', end: true },
  { to: '/feed', label: 'Feed' },
  { to: '/meus-livros', label: 'Meus livros' },
  { to: '/clubes', label: 'Clubes' },
]
