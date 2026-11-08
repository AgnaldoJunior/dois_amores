/**
 * Recorte da capa: um retângulo na proporção da capa, dentro da imagem original.
 * `zoom` 1 é o maior recorte possível; aumentar o zoom aproxima (recorte menor).
 */
export type Crop = { sx: number; sy: number; sw: number; sh: number }

export const MAX_ZOOM = 4

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Recorte com o centro em (cx, cy), no zoom pedido, sempre dentro da imagem. */
export function cropAt(width: number, height: number, ratio: number, zoom: number, cx: number, cy: number): Crop {
  const z = clamp(zoom, 1, MAX_ZOOM)
  const baseW = Math.min(width, height * ratio)
  const sw = baseW / z
  const sh = sw / ratio
  const sx = clamp(cx - sw / 2, 0, width - sw)
  const sy = clamp(cy - sh / 2, 0, height - sh)
  return { sx, sy, sw, sh }
}

/** Recorte inicial: o maior possível, centralizado. */
export const initialCrop = (width: number, height: number, ratio: number) => cropAt(width, height, ratio, 1, width / 2, height / 2)

/** Arrasta a imagem: `dx`, `dy` em fração da moldura (arrastar para a direita mostra mais da esquerda). */
export function panCrop(crop: Crop, width: number, height: number, dx: number, dy: number): Crop {
  return {
    ...crop,
    sx: clamp(crop.sx - dx * crop.sw, 0, width - crop.sw),
    sy: clamp(crop.sy - dy * crop.sh, 0, height - crop.sh),
  }
}

/** Muda o zoom mantendo o centro do recorte. */
export function zoomCrop(crop: Crop, width: number, height: number, ratio: number, zoom: number): Crop {
  return cropAt(width, height, ratio, zoom, crop.sx + crop.sw / 2, crop.sy + crop.sh / 2)
}

/** Zoom atual (1 = maior recorte). */
export const zoomOf = (crop: Crop, width: number, height: number, ratio: number) => Math.min(width, height * ratio) / crop.sw
