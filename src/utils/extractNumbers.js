/**
 * Extract price candidates from OCR text.
 * Only numbers paired with kr, SEK, :- or similar markers.
 */

function normalizeForPriceScan(text) {
  return text
    .replace(/\r?\n/g, ' ')
    .replace(/k\s*r\.?/gi, 'kr')
    .replace(/s\s*e\s*k\.?/gi, 'sek')
    .replace(/:\s*-+/g, ':-')
    .replace(/-\s*:/g, ':-')
    .replace(/[—–]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function parsePriceNumber(raw) {
  if (!raw) return null
  const joined = raw.trim().replace(/(?<=\d)\s+(?=\d)/g, '').replace(',', '.')
  const value = parseFloat(joined)
  if (Number.isNaN(value) || value <= 0 || value > 999_999) return null
  return Math.round(value * 100) / 100
}

function addCandidate(store, seen, value, priority, order) {
  const key = value.toFixed(2)
  const existing = store.get(key)
  if (existing) {
    if (priority > existing.priority) {
      existing.priority = priority
    }
    return
  }
  seen.add(key)
  store.set(key, { value, priority, order })
}

const PRICE_PATTERNS = [
  // 157 kr, 157,50 kr, 1 432 kr, 157 SEK, 157:-
  { re: /(\d+(?:\s+\d+)*(?:[.,]\d{1,2})?)\s*(?:kr|sek|:-)/gi, priority: 3 },
  // kr 157, SEK 149
  { re: /(?:kr|sek)\s*(\d+(?:\s+\d+)*(?:[.,]\d{1,2})?)/gi, priority: 3 },
  // :- 157 (sällsynt men förekommer)
  { re: /:-\s*(\d+(?:\s+\d+)*(?:[.,]\d{1,2})?)/gi, priority: 3 },
  // 157 k – OCR missade ofta 'r' i kr
  { re: /(\d+(?:\s+\d+)*(?:[.,]\d{1,2})?)\s*k\b/gi, priority: 2 },
]

export function extractNumbersFromText(text) {
  if (!text || !text.trim()) return []

  const normalized = normalizeForPriceScan(text)
  const seen = new Set()
  const store = new Map()
  let order = 0

  for (const { re, priority } of PRICE_PATTERNS) {
    re.lastIndex = 0
    for (const match of normalized.matchAll(re)) {
      const value = parsePriceNumber(match[1])
      if (value !== null) {
        addCandidate(store, seen, value, priority, order++)
      }
    }
  }

  return [...store.values()]
    .sort((a, b) => b.priority - a.priority || a.order - b.order)
    .map((c) => c.value)
}

export function formatNumberButton(value) {
  if (Number.isInteger(value)) {
    return `${value} kr`
  }
  return `${value.toFixed(2).replace('.', ',')} kr`
}
