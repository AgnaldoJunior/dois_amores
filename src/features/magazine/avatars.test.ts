import { DEFAULT_AVATAR } from '@/lib/avatar/config'
import { resolveAvatars } from './api'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

const member = (name: string, profile: Record<string, unknown>) => ({
  user_id: name,
  joined_at: '2026-04-20T10:00:00Z',
  profile: { name, avatar_url: null as string | null, ...profile },
})

describe('avatares na revista', () => {
  it('troca o avatar ilustrado por um PNG e mantém as fotos', async () => {
    const rasterize = vi.fn().mockResolvedValue('data:image/png;base64,AAA')
    const out = await resolveAvatars(
      [
        member('Leyna', { avatar_mode: 'illustrated', avatar_config: DEFAULT_AVATAR, avatar_url: 'https://x/foto.jpg' }),
        member('Irla', { avatar_mode: 'photo', avatar_config: DEFAULT_AVATAR, avatar_url: 'https://x/irla.jpg' }),
      ],
      rasterize,
    )
    expect(rasterize).toHaveBeenCalledTimes(1)
    expect(rasterize.mock.calls[0]![0]).toMatch(/^<svg /)
    expect(out.map((m) => m.profile.avatar_url)).toEqual(['data:image/png;base64,AAA', 'https://x/irla.jpg'])
  })

  it('se a rasterização falhar, volta para a foto', async () => {
    const out = await resolveAvatars(
      [member('Leyna', { avatar_mode: 'illustrated', avatar_config: DEFAULT_AVATAR, avatar_url: 'https://x/foto.jpg' })],
      () => Promise.reject(new Error('sem canvas')),
    )
    expect(out[0]!.profile.avatar_url).toBe('https://x/foto.jpg')
  })
})
