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

  enhanceForOcr(ctx, w, h)

  return canvas
}

function enhanceForOcr(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData
  const contrast = 1.4

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    const enhanced = Math.min(255, Math.max(0, (gray - 128) * contrast + 128))
    data[i] = enhanced
    data[i + 1] = enhanced
    data[i + 2] = enhanced
  }

  ctx.putImageData(imageData, 0, 0)
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
