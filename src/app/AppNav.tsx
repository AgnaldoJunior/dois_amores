import { NavLink } from 'react-router'
import { Icon } from '@/components/ui/Icon'
import { navItems } from './navigation'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  'flex flex-col items-center gap-0.5 rounded-full py-1.5 no-underline transition-colors ' +
  'lg:flex-row lg:gap-3 lg:px-4 lg:py-2 ' +
  (isActive ? 'bg-navActive text-inverse hover:text-inverse px-4' : 'text-navInactive hover:bg-card px-2.5')

/** Barra inferior no mobile; vira barra lateral a partir do breakpoint `lg`. */
export function AppNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className={
        'fixed z-10 bg-page border-line ' +
        'inset-x-0 bottom-0 border-t pb-[env(safe-area-inset-bottom)] ' +
        'lg:inset-x-auto lg:left-0 lg:top-0 lg:bottom-0 lg:w-sidebar-w lg:border-t-0 lg:border-r lg:pb-0'
      }
    >
      <div className="hidden lg:block px-6 pt-16 pb-8" aria-hidden="true">
        <p className="ticket bg-primary text-inverse font-display text-title-md leading-none text-center whitespace-nowrap px-4 pt-2 pb-1">
          Dois Amores
        </p>
        <p className="font-script text-3xl text-title text-center pt-1">clube do livro</p>
      </div>
      <ul className="flex h-nav-h items-start justify-around px-3 pt-2.5 lg:h-auto lg:flex-col lg:items-stretch lg:gap-2 lg:px-6 lg:pt-0">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} className={linkClass}>
              <Icon name={item.icon} />
              <span className="font-mono font-bold text-2xs uppercase tracking-label lg:text-xs">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
