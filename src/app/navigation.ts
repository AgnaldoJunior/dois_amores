import type { IconName } from '@/components/ui/Icon'

export type NavItem = { to: string; label: string; icon: IconName; end?: boolean }

export const navItems: NavItem[] = [
  { to: '/', label: 'início', icon: 'home', end: true },
  { to: '/estantes', label: 'estantes', icon: 'shelves' },
  { to: '/clubes', label: 'clubes', icon: 'people' },
  { to: '/numeros', label: 'números', icon: 'chart' },
  { to: '/perfil', label: 'perfil', icon: 'person' },
]
