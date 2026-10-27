import { buildMagazineData, defaultPeriod } from './buildMagazineData'
import { inlineImages } from './inlineImages'
import { sampleSource } from './sampleSource'

const image = (type: string) => new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': type } })

describe('imagens embutidas no PDF', () => {
  const source = structuredClone(sampleSource)
  source.clubBooks[0]!.book.cover_url = 'https://x/capa.jpg'
  source.clubBooks[1]!.book.cover_url = 'https://x/capa.webp'
  source.clubBooks[2]!.book.cover_url = 'https://x/fora-do-ar.jpg'
  source.members[0]!.profile.avatar_url = 'https://x/foto.png'
  const data = buildMagazineData(source, defaultPeriod(source)!)

  it('JPEG e PNG viram data: URL; outros formatos e falhas viram placeholder (null)', async () => {
    const fetchFn = vi.fn(async (url: string) => {
      if (url.endsWith('.jpg') && !url.includes('fora')) return image('image/jpeg')
      if (url.endsWith('.png')) return image('image/png')
      if (url.endsWith('.webp')) return image('image/webp')
      throw new Error('offline')
    })
    const out = await inlineImages(data, fetchFn)
    expect(out.editions[0]!.book.cover).toBe('data:image/jpeg;base64,AQID')
    expect(out.track[0]!.book.cover).toBe('data:image/jpeg;base64,AQID')
    expect(out.editions[1]!.book.cover).toBeNull()
    expect(out.editions[2]!.book.cover).toBeNull()
    expect(out.members[0]!.avatar).toBe('data:image/png;base64,AQID')
    expect(out.outside[0]!.member.avatar).toBe('data:image/png;base64,AQID')
    // cada URL é baixada uma vez só
    expect(fetchFn.mock.calls.filter(([u]) => u === 'https://x/capa.jpg')).toHaveLength(1)
  })
})
