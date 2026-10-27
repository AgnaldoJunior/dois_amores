export const AVATAR_SIZE = 512
export const AVATAR_MAX_INPUT_BYTES = 15 * 1024 * 1024
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif'

/** Capa do clube: proporção de livro (2:3). */
export const CLUB_COVER_SIZE = { width: 600, height: 900 }

/** Recorte centralizado na proporção pedida (como object-fit: cover). */
export function aspectCrop(width: number, height: number, ratio: number) {
  const cropWidth = Math.min(width, height * ratio)
  const cropHeight = cropWidth / ratio
  return {
    sx: Math.round((width - cropWidth) / 2),
    sy: Math.round((height - cropHeight) / 2),
    sw: Math.round(cropWidth),
    sh: Math.round(cropHeight),
  }
}

/** Recorte quadrado centralizado. */
export function squareCrop(width: number, height: number) {
  const { sx, sy, sw } = aspectCrop(width, height, 1)
  return { sx, sy, side: sw }
}

export function validateAvatarFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Escolha uma imagem (JPG, PNG, WEBP ou HEIC).'
  if (file.size > AVATAR_MAX_INPUT_BYTES) return 'A imagem é grande demais (máximo 15 MB).'
  return null
}

/**
 * Redimensiona para AVATAR_SIZE × AVATAR_SIZE e reexporta como JPEG.
 * A reexportação pelo canvas descarta todos os metadados (EXIF, GPS, câmera);
 * a orientação do EXIF é aplicada antes, para a foto não ficar deitada.
 */
export function resizeAvatar(file: Blob, size = AVATAR_SIZE, quality = 0.85): Promise<Blob> {
  return resizeImage(file, { width: size, height: size }, quality)
}

/** Recorta na proporção de `target`, redimensiona e reexporta como JPEG (sem metadados). */
export async function resizeImage(
  file: Blob,
  target: { width: number; height: number },
  quality = 0.85,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const { sx, sy, sw, sh } = aspectCrop(bitmap.width, bitmap.height, target.width / target.height)
    const canvas = document.createElement('canvas')
    canvas.width = target.width
    canvas.height = target.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponível')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, target.width, target.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem'))), 'image/jpeg', quality),
    )
  } finally {
    bitmap.close()
  }
}
