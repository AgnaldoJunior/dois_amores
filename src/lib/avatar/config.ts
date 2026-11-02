import { tokens } from '@/theme/tokens'

export const HAIR_STYLES = [
  { id: 'long', label: 'liso' },
  { id: 'wavy', label: 'ondas' },
  { id: 'fringe', label: 'franja' },
  { id: 'bob', label: 'curtinho' },
  { id: 'bun', label: 'coque' },
] as const

export const GLASSES = [
  { id: 'none', label: 'sem óculos' },
  { id: 'round', label: 'redondo' },
  { id: 'square', label: 'quadrado' },
  { id: 'cat', label: 'gatinho' },
] as const

export const EXTRAS = [
  { id: 'none', label: 'nada' },
  { id: 'stars', label: 'estrelas' },
  { id: 'bow', label: 'laço' },
  { id: 'both', label: 'tudo!' },
] as const

export type HairStyle = (typeof HAIR_STYLES)[number]['id']
export type Glasses = (typeof GLASSES)[number]['id']
export type Extras = (typeof EXTRAS)[number]['id']

/** O que fica salvo em profiles.avatar_config (índices das paletas em tokens.avatar). */
export type AvatarConfig = {
  skin: number
  hair: number
  style: HairStyle
  glasses: Glasses
  shirt: number
  extras: Extras
}

export const DEFAULT_AVATAR: AvatarConfig = { skin: 1, hair: 1, style: 'long', glasses: 'none', shirt: 0, extras: 'none' }

const index = (value: unknown, length: number) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < length ? value : null
const oneOf = <T extends string>(value: unknown, options: readonly { id: T }[]) =>
  options.find((o) => o.id === value)?.id ?? null

/** Valida o JSON vindo do banco; qualquer campo inválido → null (usa foto ou inicial). */
export function parseAvatarConfig(raw: unknown): AvatarConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const config = {
    skin: index(r.skin, tokens.avatar.skin.length),
    hair: index(r.hair, tokens.avatar.hair.length),
    style: oneOf(r.style, HAIR_STYLES),
    glasses: oneOf(r.glasses, GLASSES),
    shirt: index(r.shirt, tokens.avatar.shirt.length),
    extras: oneOf(r.extras, EXTRAS),
  }
  return Object.values(config).every((v) => v != null) ? (config as AvatarConfig) : null
}

/** Avatar sorteado (botão do dado). `random` retorna [0, 1). */
export function randomAvatar(random: () => number = Math.random): AvatarConfig {
  const pick = (n: number) => Math.floor(random() * n)
  return {
    skin: pick(tokens.avatar.skin.length),
    hair: pick(tokens.avatar.hair.length),
    style: HAIR_STYLES[pick(HAIR_STYLES.length)]!.id,
    glasses: GLASSES[pick(GLASSES.length)]!.id,
    shirt: pick(tokens.avatar.shirt.length),
    extras: EXTRAS[pick(EXTRAS.length)]!.id,
  }
}

export type AvatarMode = 'photo' | 'illustrated'

/** O avatar ilustrado só aparece quando a pessoa escolheu usá-lo e a configuração é válida. */
export function illustrationOf(profile: { avatar_mode?: string | null; avatar_config?: unknown } | null | undefined) {
  return profile?.avatar_mode === 'illustrated' ? parseAvatarConfig(profile.avatar_config) : null
}
