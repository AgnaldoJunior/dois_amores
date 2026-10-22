export const AVATAR_SIZE = 512
export const AVATAR_MAX_INPUT_BYTES = 15 * 1024 * 1024
export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif'

/** Recorte quadrado centralizado (como object-fit: cover). */
export function squareCrop(width: number, height: number) {
  const side = Math.min(width, height)
  return {
    sx: Math.round((width - side) / 2),
    sy: Math.round((height - side) / 2),
    side,
  }
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
export async function resizeAvatar(file: Blob, size = AVATAR_SIZE, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const { sx, sy, side } = squareCrop(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponível')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem'))), 'image/jpeg', quality),
    )
  } finally {
    bitmap.close()
  }
}
