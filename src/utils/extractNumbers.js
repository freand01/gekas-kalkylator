/**
 * Extract all plausible numbers from OCR text.
 * Shows everything found – user picks the correct price.
 */
export function extractNumbersFromText(text) {
  if (!text || !text.trim()) return []

  const normalized = text
    .replace(/[OoØø]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/[Ss$]/g, '5')
    .replace(/[Bb]/g, '8')
    .replace(/[Zz]/g, '2')
    .replace(/\s+/g, ' ')

  const matches = normalized.match(/\d+(?:[.,]\d{1,2})?/g) || []

  const seen = new Set()
  const results = []

  for (const match of matches) {
    const cleaned = match.replace(',', '.')
    const value = parseFloat(cleaned)

    if (Number.isNaN(value) || value <= 0) continue
    if (value > 999_999) continue

    const key = value.toFixed(2)
    if (seen.has(key)) continue
    seen.add(key)

    results.push(value)
  }

  return results.sort((a, b) => a - b)
}

export function formatNumberButton(value) {
  if (Number.isInteger(value)) {
    return `${value} kr`
  }
  return `${value.toFixed(2).replace('.', ',')} kr`
}
