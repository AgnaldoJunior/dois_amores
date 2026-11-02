import type { IconName } from '@/components/ui/Icon'

export type NavItem = { to: string; label: string; icon: IconName; end?: boolean }

export const navItems: NavItem[] = [
  { to: '/', label: 'Início', icon: 'home', end: true },
  { to: '/feed', label: 'Feed', icon: 'feed' },
  { to: '/meus-livros', label: 'Meus livros', icon: 'books' },
  { to: '/clubes', label: 'Clubes', icon: 'people' },
]
