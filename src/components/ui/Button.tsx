import type { ButtonHTMLAttributes, Ref } from 'react'
import { Link, type LinkProps } from 'react-router'

type Variant = 'primary' | 'secondary' | 'outline' | 'quiet' | 'danger'
type Size = 'lg' | 'sm'

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary text-inverse border border-primary hover:bg-primaryHover hover:text-inverse',
  secondary: 'bg-tag text-primary border border-tag hover:border-border hover:text-primary',
  outline: 'bg-transparent text-primary border border-primary hover:bg-tag hover:text-primary',
  quiet: 'bg-card text-ink border border-border hover:border-primary hover:text-ink',
  danger: 'bg-danger text-inverse border border-danger hover:text-inverse',
}

const sizeClass: Record<Size, string> = {
  lg: 'min-h-button-h px-5 text-lg',
  sm: 'min-h-button-sm-h px-3.5 text-sm',
}

/** Botão em pílula: vinho cheio (principal), contorno vinho, papel ou etiqueta. */
export const buttonClass = (variant: Variant = 'primary', fullWidth = true, className = '', size: Size = 'lg') =>
  `${fullWidth ? 'w-full' : ''} ${sizeClass[size]} py-2 rounded-full ` +
  `inline-flex items-center justify-center gap-2 ` +
  `font-sans font-semibold leading-tight text-center no-underline ` +
  `transition-colors disabled:opacity-50 disabled:cursor-not-allowed ` +
  `${variantClass[variant]} ${className}`

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({
  variant = 'primary',
  size = 'lg',
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
      className={buttonClass(variant, fullWidth, className, size)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? 'Aguarde…' : children}
    </button>
  )
}

type ButtonLinkProps = LinkProps & { variant?: Variant; size?: Size; fullWidth?: boolean }

/** Link de navegação com aparência de botão. */
export function ButtonLink({ variant = 'primary', size = 'lg', fullWidth = true, className = '', ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, fullWidth, className, size)} {...props} />
}
