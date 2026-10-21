import { NavLink } from 'react-router'
import { navItems } from './navigation'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `font-display text-xl leading-none uppercase transition-colors ` +
  (isActive ? 'text-navActive' : 'text-navInactive')

/** Barra inferior no mobile; vira barra lateral a partir do breakpoint `lg`. */
export function AppNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className={
        'fixed z-10 bg-card ' +
        'inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom)] ' +
        'lg:inset-x-auto lg:left-0 lg:top-0 lg:w-sidebar-w lg:pb-0'
      }
    >
      <p
        className="hidden lg:block font-display text-5xl leading-none text-primary px-6 pt-16 pb-1"
        aria-hidden="true"
      >
        Dois Amores
      </p>
      <p className="hidden lg:block font-script text-2xl text-accentStrong px-6 pb-8" aria-hidden="true">
        clube do livro
      </p>
      <ul className="flex h-nav-h items-center justify-around px-4 lg:h-auto lg:flex-col lg:items-start lg:gap-6 lg:px-6">
        {navItems.map((item) => (
          <li key={item.to} className="flex-1 text-center lg:flex-none lg:text-left">
            <NavLink to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
