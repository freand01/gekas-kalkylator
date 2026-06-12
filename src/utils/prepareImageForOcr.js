const MAX_DIMENSION = 1600

/**
 * Downscale large camera photos before OCR.
 * Keeps text sharp enough for price tags while cutting processing time.
 */
export async function prepareImageForOcr(source) {
  const bitmap = await createImageBitmap(source)
  const { width, height } = bitmap
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  return canvas
}

export function canvasToObjectUrl(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Kunde inte skapa bild'))
        return
      }
      resolve(URL.createObjectURL(blob))
    }, 'image/jpeg', 0.92)
  })
}
