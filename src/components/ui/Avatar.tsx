const sizeClass = {
  sm: 'size-avatar-sm text-xl',
  md: 'size-avatar-md text-2xl',
  lg: 'size-avatar-lg text-5xl',
} as const

type AvatarProps = {
  name: string
  url?: string | null
  size?: keyof typeof sizeClass
  className?: string
}

/** Foto do perfil ou, sem foto, a inicial do nome sobre o círculo rosa. */
export function Avatar({ name, url, size = 'md', className = '' }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return url ? (
    <img
      src={url}
      alt=""
      referrerPolicy="no-referrer"
      className={`${sizeClass[size]} shrink-0 rounded-full object-cover bg-accent ${className}`}
    />
  ) : (
    <span
      aria-hidden="true"
      className={
        `${sizeClass[size]} shrink-0 rounded-full bg-accent text-primary font-display ` +
        `inline-flex items-center justify-center leading-none ${className}`
      }
    >
      {initial}
    </span>
  )
}
