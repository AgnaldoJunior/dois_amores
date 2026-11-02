import { render } from '@testing-library/react'
import { DEFAULT_AVATAR } from '@/lib/avatar/config'
import { Avatar, avatarOf } from './Avatar'

describe('<Avatar>', () => {
  it('avatar ilustrado tem prioridade sobre a foto quando escolhido', () => {
    const { container } = render(
      <Avatar {...avatarOf({ name: 'Leyna', avatar_url: 'https://x/foto.jpg', avatar_mode: 'illustrated', avatar_config: DEFAULT_AVATAR })} />,
    )
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })

  it('no modo foto mostra a foto; sem foto, a inicial', () => {
    const photo = render(<Avatar {...avatarOf({ name: 'Irla', avatar_url: 'https://x/irla.jpg', avatar_mode: 'photo', avatar_config: DEFAULT_AVATAR })} />)
    expect(photo.container.querySelector('img')).toHaveAttribute('src', 'https://x/irla.jpg')
    const initial = render(<Avatar name="wanessa" />)
    expect(initial.container.textContent).toBe('W')
  })
})
