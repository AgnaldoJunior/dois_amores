import type { MagazineBook, MagazineData } from '@templates/revista/_shared/types'

type FetchLike = (url: string) => Promise<Response>

const SUPPORTED = new Set(['image/jpeg', 'image/png'])

async function toDataUrl(url: string, fetchFn: FetchLike): Promise<string | null> {
  if (url.startsWith('data:')) return url
  try {
    const res = await fetchFn(url)
    if (!res.ok) return null
    const blob = await res.blob()
    // O @react-pdf só lê JPEG e PNG; outros formatos viram placeholder.
    if (!SUPPORTED.has(blob.type)) return null
    const bytes = new Uint8Array(await blob.arrayBuffer())
    let binary = ''
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    return `data:${blob.type};base64,${btoa(binary)}`
  } catch {
    return null
  }
}

/**
 * Baixa todas as imagens (capas, fotos, avatares) antes de gerar o PDF e as embute
 * como data: URL. Imagem que falhar (sem CORS, fora do ar) vira null e o template
 * mostra o placeholder — o PDF nunca quebra por causa de uma imagem.
 */
export async function inlineImages(data: MagazineData, fetchFn: FetchLike = (u) => fetch(u)): Promise<MagazineData> {
  const cache = new Map<string, Promise<string | null>>()
  const load = (url: string | null) => {
    if (!url) return Promise.resolve(null)
    if (!cache.has(url)) cache.set(url, toDataUrl(url, fetchFn))
    return cache.get(url)!
  }
  const book = async (b: MagazineBook) => ({ ...b, cover: await load(b.cover) })

  const [photo, members, track, editions, outside] = await Promise.all([
    load(data.club.photo),
    Promise.all(data.members.map(async (m) => ({ ...m, avatar: await load(m.avatar) }))),
    Promise.all(data.track.map(async (t) => ({ ...t, book: await book(t.book) }))),
    Promise.all(data.editions.map(async (e) => ({ ...e, book: await book(e.book) }))),
    Promise.all(
      data.outside.map(async (o) => ({
        member: { ...o.member, avatar: await load(o.member.avatar) },
        books: await Promise.all(o.books.map(async (b) => ({ ...b, book: await book(b.book) }))),
      })),
    ),
  ])
  return { ...data, club: { ...data.club, photo }, members, track, editions, outside }
}
