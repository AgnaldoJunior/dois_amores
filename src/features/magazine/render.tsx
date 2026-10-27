import type { FontFile, MagazineData, MagazineTemplate } from '@templates/revista/_shared/types'

type FontApi = {
  register: (options: { family: string; src: string; fontWeight?: number }) => void
  registerHyphenationCallback: (callback: (word: string) => string[]) => void
}

const registered = new Set<string>()

/** Registra as fontes do template no @react-pdf (que não usa Google Fonts por CSS: precisa dos TTF). */
export function registerFonts(Font: FontApi, fonts: FontFile[], resolveAsset: (path: string) => string) {
  for (const font of fonts) {
    const key = `${font.family}:${font.fontWeight ?? 400}:${font.src}`
    if (registered.has(key)) continue
    Font.register({ family: font.family, src: resolveAsset(font.src), fontWeight: font.fontWeight ?? 400 })
    registered.add(key)
  }
  // Sem hifenização automática (a padrão é para inglês e quebra palavras em português de forma estranha).
  Font.registerHyphenationCallback((word) => [word])
}

const browserAsset = (path: string) => new URL(path, window.location.origin).href

/** Gera o PDF no navegador. O @react-pdf só é baixado quando alguém exporta a revista. */
export async function renderMagazine(
  template: MagazineTemplate,
  data: MagazineData,
  resolveAsset: (path: string) => string = browserAsset,
): Promise<Blob> {
  // O @react-pdf lê imagens embutidas (data: URL) com o Buffer do Node, que o navegador não tem.
  if (!('Buffer' in globalThis)) {
    const { Buffer } = await import('buffer')
    Object.assign(globalThis, { Buffer })
  }
  const { Font, pdf } = await import('@react-pdf/renderer')
  registerFonts(Font, template.fonts, resolveAsset)
  const { Document } = template
  return pdf(<Document data={data} />).toBlob()
}
