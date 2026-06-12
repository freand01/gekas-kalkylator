/**
 * Map a screen tap to coordinates on the source image (object-fit: contain).
 */
export function getTapOnImage(imgElement, clientX, clientY) {
  const rect = imgElement.getBoundingClientRect()
  const naturalW = imgElement.naturalWidth
  const naturalH = imgElement.naturalHeight

  if (!naturalW || !naturalH) return null

  const scale = Math.min(rect.width / naturalW, rect.height / naturalH)
  const displayW = naturalW * scale
  const displayH = naturalH * scale
  const offsetX = (rect.width - displayW) / 2
  const offsetY = (rect.height - displayH) / 2

  const relX = clientX - rect.left - offsetX
  const relY = clientY - rect.top - offsetY

  if (relX < 0 || relY < 0 || relX > displayW || relY > displayH) {
    return null
  }

  return {
    x: relX / scale,
    y: relY / scale,
    displayX: offsetX + relX,
    displayY: offsetY + relY,
    naturalW,
    naturalH,
  }
}

/**
 * Crop a region around a tap point. Default box covers a typical price line.
 */
export function cropAroundPoint(source, x, y, naturalW, naturalH) {
  const cropW = naturalW * 0.55
  const cropH = naturalH * 0.18
  const sx = clamp(x - cropW / 2, 0, naturalW - cropW)
  const sy = clamp(y - cropH / 2, 0, naturalH - cropH)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(cropW)
  canvas.height = Math.round(cropH)

  const ctx = canvas.getContext('2d')
  ctx.drawImage(source, sx, sy, cropW, cropH, 0, 0, cropW, cropH)

  return canvas
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
