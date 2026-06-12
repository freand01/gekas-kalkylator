/**
 * Pick the most likely price from OCR text on a cropped region.
 */
function parseAmount(raw) {
  if (!raw) return null
  const joined = raw.replace(/(?<=\d)\s+(?=\d)/g, '').replace(',', '.')
  const value = parseFloat(joined)
  if (Number.isNaN(value) || value <= 0 || value > 999_999) return null
  return Math.round(value * 100) / 100
}

function normalizeText(text) {
  return text
    .replace(/\r?\n/g, ' ')
    .replace(/k\s*r\.?/gi, 'kr')
    .replace(/s\s*e\s*k\.?/gi, 'sek')
    .replace(/:\s*-+/g, ':-')
    .replace(/-\s*:/g, ':-')
    .replace(/[OoØø]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/\s+/g, ' ')
    .trim()
}

const MARKED = [
  /(\d+(?:\s+\d+)*(?:[.,]\d{1,2})?)\s*(?:kr|sek|:-)/gi,
  /(?:kr|sek)\s*(\d+(?:\s+\d+)*(?:[.,]\d{1,2})?)/gi,
  /(\d+(?:\s+\d+)*(?:[.,]\d{1,2})?)\s*k\b/gi,
]

export function extractBestPrice(text) {
  if (!text?.trim()) return null

  const normalized = normalizeText(text)
  const candidates = []

  for (const pattern of MARKED) {
    pattern.lastIndex = 0
    for (const match of normalized.matchAll(pattern)) {
      const value = parseAmount(match[1])
      if (value !== null) {
        candidates.push({ value, score: 100 + String(match[1]).replace(/\D/g, '').length })
      }
    }
  }

  const loose = normalized.match(/\d+(?:[.,]\d{1,2})?/g) || []
  for (const token of loose) {
    const digits = token.replace(/\D/g, '')
    if (digits.length < 2) continue
    const value = parseAmount(token)
    if (value !== null) {
      candidates.push({ value, score: 50 + digits.length })
    }
  }

  if (candidates.length === 0) return null

  candidates.sort((a, b) => b.score - a.score || b.value - a.value)
  return candidates[0].value
}

export function priceToInputString(value) {
  if (value == null) return ''
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(2).replace('.', ',')
}
