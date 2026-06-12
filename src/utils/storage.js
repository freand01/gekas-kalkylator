const STORAGE_KEY = 'ullared-cart'

export function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { items: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] }
    return parsed
  } catch {
    return { items: [] }
  }
}

export function saveCart(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Quota exceeded or private mode – silently ignore
  }
}

export function createItem(price, source = 'manual') {
  return {
    id: crypto.randomUUID(),
    price: Math.round(price * 100) / 100,
    timestamp: Date.now(),
    source,
  }
}
