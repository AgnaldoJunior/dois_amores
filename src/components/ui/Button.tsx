import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'outline'

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary text-inverse border border-primary',
  outline: 'bg-transparent text-primary border border-primary',
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  fullWidth = true,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={
        `${fullWidth ? 'w-full' : ''} min-h-control-h px-4 py-2 rounded-card ` +
        `font-sans text-md leading-tight text-center ` +
        `transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ` +
        `${variantClass[variant]} ${className}`
      }
      {...props}
    />
  )
}
