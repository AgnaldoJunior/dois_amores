/**
 * SVG → PNG (data: URL) no navegador. O @react-pdf só lê JPEG e PNG, então o
 * avatar ilustrado é rasterizado antes de entrar na revista.
 */
export async function svgToPng(svg: string, size = 400): Promise<string> {
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas indisponível')
  context.drawImage(image, 0, 0, size, size)
  return canvas.toDataURL('image/png')
}
