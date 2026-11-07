import { IllustratedAvatar } from '@/components/IllustratedAvatar'
import { illustrationOf, type AvatarConfig } from '@/lib/avatar/config'

const sizeClass = {
  xs: 'size-avatar-xs text-base',
  sm: 'size-avatar-sm text-xl',
  md: 'size-avatar-md text-2xl',
  'podium-3': 'size-avatar-podium-3 text-2xl',
  'podium-2': 'size-avatar-podium-2 text-2xl',
  'podium-1': 'size-avatar-podium-1 text-4xl',
  lg: 'size-avatar-lg text-4xl',
  xl: 'size-avatar-xl text-5xl',
} as const

export type AvatarSize = keyof typeof sizeClass

type AvatarProps = {
  name: string
  url?: string | null
  size?: AvatarSize
  className?: string
  /** Moldura de papel: grossa (avatares grandes sobre fotos) ou nenhuma (padrão nas listas). */
  border?: 'thick' | 'thin'
  /** Avatar ilustrado escolhido no criador (tem prioridade sobre a foto). */
  illustration?: AvatarConfig | null
}

type ProfileLike = { name: string; avatar_url?: string | null; avatar_mode?: string | null; avatar_config?: unknown }

/** Props do Avatar a partir de um perfil: nome, foto e, se escolhido, o avatar ilustrado. */
export const avatarOf = (profile: ProfileLike) => ({
  name: profile.name,
  url: profile.avatar_url ?? null,
  illustration: illustrationOf(profile),
})

/** Avatar ilustrado, foto ou, sem nenhum dos dois, a inicial sobre o vinho — num círculo. */
export function Avatar({ name, url, size = 'md', className = '', border = 'thin', illustration }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const base = `${sizeClass[size]} shrink-0 rounded-full ${border === 'thick' ? 'border-thick border-page shadow-soft' : ''} overflow-hidden`
  if (illustration) {
    return (
      <span aria-hidden="true" className={`${base} inline-flex bg-page ${className}`}>
        <IllustratedAvatar config={illustration} className="size-full" />
      </span>
    )
  }
  return url ? (
    <img src={url} alt="" referrerPolicy="no-referrer" className={`${base} object-cover bg-page ${className}`} />
  ) : (
    <span
      aria-hidden="true"
      className={`${base} bg-primary text-inverse font-display italic font-semibold inline-flex items-center justify-center leading-none ${className}`}
    >
      {initial}
    </span>
  )
}
