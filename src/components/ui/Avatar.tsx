const sizeClass = {
  xs: 'size-avatar-xs text-lg',
  sm: 'size-avatar-sm text-xl',
  md: 'size-avatar-md text-2xl',
  'podium-3': 'size-avatar-podium-3 text-2xl',
  'podium-2': 'size-avatar-podium-2 text-2xl',
  'podium-1': 'size-avatar-podium-1 text-4xl',
  lg: 'size-avatar-lg text-5xl',
} as const

export type AvatarSize = keyof typeof sizeClass

type AvatarProps = {
  name: string
  url?: string | null
  size?: AvatarSize
  className?: string
  /** Contorno verde: grosso (padrão) ou fino, para avatares pequenos dentro de botões. */
  border?: 'thick' | 'thin'
}

/** Foto do perfil num círculo com contorno verde ou, sem foto, a inicial sobre o rosa. */
export function Avatar({ name, url, size = 'md', className = '', border = 'thick' }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const base = `${sizeClass[size]} shrink-0 rounded-full ${border === 'thick' ? 'border-thick' : 'border-thin'} border-primary overflow-hidden`
  return url ? (
    <img src={url} alt="" referrerPolicy="no-referrer" className={`${base} object-cover bg-page ${className}`} />
  ) : (
    <span
      aria-hidden="true"
      className={`${base} bg-accent text-primary font-display inline-flex items-center justify-center leading-none ${className}`}
    >
      {initial}
    </span>
  )
}
