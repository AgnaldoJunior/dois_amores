import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'

type Variant = 'primary' | 'secondary' | 'outline' | 'danger'

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary text-inverse border border-primary hover:bg-primaryHover hover:text-inverse',
  secondary: 'bg-pill text-primary border border-primary hover:text-primary',
  outline: 'bg-transparent text-primary border border-primary hover:bg-card hover:text-primary',
  danger: 'bg-danger text-inverse border border-danger hover:text-inverse',
}

/** Botão do scrapbook: máquina de escrever em negrito, caixa alta, cantos quase retos. */
export const buttonClass = (variant: Variant = 'primary', fullWidth = true, className = '') =>
  `${fullWidth ? 'w-full' : ''} min-h-control-h px-4 py-2 rounded-sm ` +
  `inline-flex items-center justify-center gap-2 ` +
  `font-mono font-bold text-xs uppercase tracking-label leading-tight text-center no-underline ` +
  `transition-colors disabled:opacity-50 disabled:cursor-not-allowed ` +
  `${variantClass[variant]} ${className}`

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  fullWidth?: boolean
  loading?: boolean
}

export function Button({
  variant = 'primary',
  fullWidth = true,
  loading = false,
  className = '',
  type = 'button',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, fullWidth, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? 'Aguarde…' : children}
    </button>
  )
}

type ButtonLinkProps = LinkProps & { variant?: Variant; fullWidth?: boolean }

/** Link de navegação com aparência de botão. */
export function ButtonLink({ variant = 'primary', fullWidth = true, className = '', ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, fullWidth, className)} {...props} />
}
