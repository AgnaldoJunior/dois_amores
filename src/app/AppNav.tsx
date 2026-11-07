import { NavLink } from 'react-router'
import { Icon } from '@/components/ui/Icon'
import { navItems } from './navigation'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  'flex min-w-11 flex-col items-center gap-1 py-1.5 font-sans text-2xs no-underline transition-colors ' +
  'lg:flex-row lg:gap-3 lg:rounded-full lg:px-4 lg:py-2.5 lg:text-md ' +
  (isActive ? 'font-bold text-primary lg:bg-tag' : 'font-medium text-muted hover:text-primary')

/** Barra inferior no mobile; vira barra lateral a partir do breakpoint `lg`. */
export function AppNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className={
        'fixed z-10 border-line bg-card ' +
        'inset-x-0 bottom-0 border-t pb-[env(safe-area-inset-bottom)] ' +
        'lg:inset-x-auto lg:top-0 lg:bottom-0 lg:left-0 lg:w-sidebar-w lg:border-t-0 lg:border-r lg:pb-0'
      }
    >
      <p className="hidden px-6 pt-12 pb-8 font-display italic font-semibold text-2xl text-primary lg:block" aria-hidden="true">
        dois amores <span className="text-gold">✦</span>
      </p>
      <ul className="flex h-nav-h items-center justify-around px-2.5 pb-3 lg:h-auto lg:flex-col lg:items-stretch lg:gap-1 lg:px-4 lg:pb-0">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} className={linkClass}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
