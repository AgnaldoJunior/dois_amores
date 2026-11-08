import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CoverCropDialog } from './CoverCropDialog'

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:capa')
  URL.revokeObjectURL = vi.fn()
})

function open(onConfirm = vi.fn(), onCancel = vi.fn()) {
  render(<CoverCropDialog file={new Blob(['x'])} onConfirm={onConfirm} onCancel={onCancel} />)
  const img = document.querySelector('img')!
  Object.defineProperty(img, 'naturalWidth', { value: 1000 })
  Object.defineProperty(img, 'naturalHeight', { value: 2000 })
  fireEvent.load(img)
  return { onConfirm, onCancel }
}

describe('<CoverCropDialog>', () => {
  it('começa centralizado e devolve o recorte escolhido', async () => {
    const { onConfirm } = open()
    expect(screen.getByRole('dialog', { name: 'ajustar a capa' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'usar esta capa' }))
    expect(onConfirm).toHaveBeenCalledWith({ sx: 0, sy: 750, sw: 1000, sh: 500 })
  })

  it('setas movem e o zoom aproxima', async () => {
    const { onConfirm } = open()
    fireEvent.keyDown(screen.getByRole('img', { name: /Prévia da capa/ }), { key: 'ArrowDown' })
    fireEvent.change(screen.getByLabelText('Zoom'), { target: { value: '2' } })
    await userEvent.click(screen.getByRole('button', { name: 'usar esta capa' }))
    expect(onConfirm).toHaveBeenCalledWith({ sx: 250, sy: 900, sw: 500, sh: 250 })
  })

  it('Esc cancela', () => {
    const { onCancel } = open()
    fireEvent.keyDown(screen.getByRole('button', { name: 'cancelar' }), { key: 'Escape' })
    expect(onCancel).toHaveBeenCalled()
  })
})
