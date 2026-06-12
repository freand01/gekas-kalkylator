/**
 * Extract price candidates from OCR text.
 * Prioritizes numbers with kr/SEK/:- markers; falls back to likely prices if none found.
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

function toSortedValues(store) {
  return [...store.values()]
    .sort((a, b) => b.priority - a.priority || a.order - b.order)
    .map((c) => c.value)
}

function isLikelyFallbackPrice(value, raw) {
  if (value <= 0 || value > 99_999) return false

  const joined = raw.trim().replace(/(?<=\d)\s+(?=\d)/g, '')
  const hasDecimal = /[.,]\d{1,2}$/.test(joined)
  if (hasDecimal) return true

  const digitCount = joined.replace(/\D/g, '').length
  // 2–4 siffror = typiskt pris; 5+ = ofta artikelnummer
  return digitCount >= 2 && digitCount <= 4
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

const FALLBACK_PATTERN = /(\d+(?:\s+\d+)*(?:[.,]\d{1,2})?)/g

function extractMarkedPrices(normalized) {
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

  return toSortedValues(store)
}

function extractFallbackPrices(normalized) {
  const seen = new Set()
  const store = new Map()
  let order = 0

  for (const match of normalized.matchAll(FALLBACK_PATTERN)) {
    const raw = match[1]
    const value = parsePriceNumber(raw)
    if (value !== null && isLikelyFallbackPrice(value, raw)) {
      addCandidate(store, seen, value, 1, order++)
    }
  }

  return toSortedValues(store)
}

export function extractNumbersFromText(text) {
  if (!text || !text.trim()) {
    return { numbers: [], usedFallback: false }
  }

  const normalized = normalizeForPriceScan(text)
  const marked = extractMarkedPrices(normalized)

  if (marked.length > 0) {
    return { numbers: marked, usedFallback: false }
  }

  const fallback = extractFallbackPrices(normalized)
  return { numbers: fallback, usedFallback: fallback.length > 0 }
}

export function formatNumberButton(value) {
  if (Number.isInteger(value)) {
    return `${value} kr`
  }
  return `${value.toFixed(2).replace('.', ',')} kr`
}
