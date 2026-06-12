const MAX_DIMENSION = 2000
const MIN_CROP_WIDTH = 900

export async function loadImageSource(source) {
  if (source instanceof HTMLCanvasElement) {
    return source
  }

  const bitmap = await createImageBitmap(source)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d').drawImage(bitmap, 0, 0)
  bitmap.close()
  return canvas
}

/**
 * Prepare a small crop for OCR: upscale, grayscale, high contrast, binarize.
 */
export function prepareCropForOcr(cropCanvas) {
  const scale = Math.max(2, MIN_CROP_WIDTH / cropCanvas.width)
  const w = Math.round(cropCanvas.width * scale)
  const h = Math.round(cropCanvas.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(cropCanvas, 0, 0, w, h)

  binarize(ctx, w, h)
  return canvas
}

function binarize(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData
  const contrast = 1.8

  let sum = 0
  const grays = new Float32Array(width * height)

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    const enhanced = Math.min(255, Math.max(0, (gray - 128) * contrast + 128))
    grays[p] = enhanced
    sum += enhanced
  }

  const threshold = sum / grays.length

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const bit = grays[p] > threshold ? 255 : 0
    data[i] = bit
    data[i + 1] = bit
    data[i + 2] = bit
    data[i + 3] = 255
  }

  ctx.putImageData(imageData, 0, 0)
}

export async function downscaleIfNeeded(sourceCanvas) {
  const { width, height } = sourceCanvas
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
  if (scale >= 1) return sourceCanvas

  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(sourceCanvas, 0, 0, w, h)
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
