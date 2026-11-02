import { tokens } from '@/theme/tokens'
import { DEFAULT_AVATAR, illustrationOf, parseAvatarConfig, randomAvatar, type AvatarConfig } from './config'
import { avatarShapes, avatarSvg, starPoints } from './shapes'

describe('configuração do avatar', () => {
  it('aceita uma configuração válida', () => {
    const config: AvatarConfig = { skin: 3, hair: 5, style: 'bun', glasses: 'cat', shirt: 2, extras: 'both' }
    expect(parseAvatarConfig(config)).toEqual(config)
  })

  it('rejeita campos fora das opções', () => {
    expect(parseAvatarConfig({ ...DEFAULT_AVATAR, skin: 4 })).toBeNull()
    expect(parseAvatarConfig({ ...DEFAULT_AVATAR, style: 'moicano' })).toBeNull()
    expect(parseAvatarConfig({ ...DEFAULT_AVATAR, hair: 1.5 })).toBeNull()
    expect(parseAvatarConfig(null)).toBeNull()
    expect(parseAvatarConfig('x')).toBeNull()
  })

  it('só usa a ilustração quando a pessoa escolheu', () => {
    expect(illustrationOf({ avatar_mode: 'illustrated', avatar_config: DEFAULT_AVATAR })).toEqual(DEFAULT_AVATAR)
    expect(illustrationOf({ avatar_mode: 'photo', avatar_config: DEFAULT_AVATAR })).toBeNull()
    expect(illustrationOf({ avatar_mode: 'illustrated', avatar_config: { skin: 9 } })).toBeNull()
  })

  it('o dado sorteia sempre uma configuração válida', () => {
    let seed = 0.123
    const random = () => (seed = (seed * 9301 + 0.49297) % 1)
    for (let i = 0; i < 50; i++) expect(parseAvatarConfig(randomAvatar(random))).not.toBeNull()
    expect(randomAvatar(() => 0.999)).toEqual({ skin: 3, hair: 5, style: 'bun', glasses: 'cat', shirt: 3, extras: 'both' })
  })
})

describe('desenho do avatar', () => {
  const fills = (config: AvatarConfig) => avatarShapes(config).map((s) => s.attrs.fill)

  it('usa as cores escolhidas de pele, cabelo e blusa', () => {
    const f = fills({ ...DEFAULT_AVATAR, skin: 2, hair: 4, shirt: 3 })
    expect(f).toContain(tokens.avatar.skin[2]!.fill)
    expect(f).toContain(tokens.avatar.hair[4]!.fill)
    expect(f).toContain(tokens.avatar.shirt[3]!.fill)
  })

  it('óculos e extras só aparecem quando escolhidos', () => {
    const base = avatarShapes(DEFAULT_AVATAR).length
    expect(avatarShapes({ ...DEFAULT_AVATAR, glasses: 'round' })).toHaveLength(base + 3)
    expect(avatarShapes({ ...DEFAULT_AVATAR, extras: 'stars' })).toHaveLength(base + 3)
    expect(avatarShapes({ ...DEFAULT_AVATAR, extras: 'both' })).toHaveLength(base + 6)
  })

  it('cada penteado tem partes de trás e da frente próprias', () => {
    const coque = avatarShapes({ ...DEFAULT_AVATAR, style: 'bun' })
    expect(coque.some((s) => s.tag === 'circle' && s.attrs.r === 22)).toBe(true)
  })

  it('estrela de 6 pontas com 12 vértices', () => {
    expect(starPoints(0, 0, 10, 4, 0).split(' ')).toHaveLength(12)
    expect(starPoints(0, 0, 10, 4, 0).split(' ')[0]).toBe('10.0,0.0')
  })

  it('gera um SVG completo com fundo de papel para a revista', () => {
    const svg = avatarSvg(DEFAULT_AVATAR)
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="200" height="200"/)
    expect(svg).toContain(`fill="${tokens.avatar.paper}"`)
    expect(svg.endsWith('</svg>')).toBe(true)
  })
})
