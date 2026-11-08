import { cropAt, initialCrop, panCrop, zoomCrop, zoomOf } from './coverCrop'

describe('recorte da capa (2:1)', () => {
  it('foto em pé: começa com a largura toda, centralizado na altura', () => {
    expect(initialCrop(1000, 2000, 2)).toEqual({ sx: 0, sy: 750, sw: 1000, sh: 500 })
  })

  it('foto muito larga: começa com a altura toda, centralizado na largura', () => {
    expect(initialCrop(4000, 1000, 2)).toEqual({ sx: 1000, sy: 0, sw: 2000, sh: 1000 })
  })

  it('arrastar move o recorte sem sair da imagem', () => {
    const c = initialCrop(1000, 2000, 2)
    expect(panCrop(c, 1000, 2000, 0, 0.5).sy).toBe(500) // desce a imagem: mostra mais de cima
    expect(panCrop(c, 1000, 2000, 0, 10).sy).toBe(0)
    expect(panCrop(c, 1000, 2000, 0, -10).sy).toBe(1500)
    expect(panCrop(c, 1000, 2000, 1, 0).sx).toBe(0) // sem folga na largura
  })

  it('zoom aproxima mantendo o centro e limita entre 1× e 4×', () => {
    const c = initialCrop(1000, 2000, 2)
    const z = zoomCrop(c, 1000, 2000, 2, 2)
    expect(z).toEqual({ sx: 250, sy: 875, sw: 500, sh: 250 })
    expect(zoomOf(z, 1000, 2000, 2)).toBe(2)
    expect(cropAt(1000, 2000, 2, 9, 500, 1000).sw).toBe(250)
    expect(cropAt(1000, 2000, 2, 0.2, 500, 1000).sw).toBe(1000)
  })
})
