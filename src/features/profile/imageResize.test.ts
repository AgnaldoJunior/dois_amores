import { squareCrop, validateAvatarFile } from './imageResize'

describe('recorte do avatar', () => {
  it('recorta o centro de uma foto em pé', () => {
    expect(squareCrop(3024, 4032)).toEqual({ sx: 0, sy: 504, side: 3024 })
  })

  it('recorta o centro de uma foto deitada', () => {
    expect(squareCrop(1600, 900)).toEqual({ sx: 350, sy: 0, side: 900 })
  })

  it('mantém imagens já quadradas', () => {
    expect(squareCrop(512, 512)).toEqual({ sx: 0, sy: 0, side: 512 })
  })
})

describe('validação do arquivo', () => {
  const file = (type: string, size: number) => {
    const f = new File(['x'], 'foto', { type })
    Object.defineProperty(f, 'size', { value: size })
    return f
  }

  it('aceita imagens até 15 MB', () => {
    expect(validateAvatarFile(file('image/heic', 3_000_000))).toBeNull()
  })

  it('recusa outros tipos e arquivos grandes', () => {
    expect(validateAvatarFile(file('application/pdf', 1000))).toMatch(/Escolha uma imagem/)
    expect(validateAvatarFile(file('image/jpeg', 20 * 1024 * 1024))).toMatch(/grande demais/)
  })
})
