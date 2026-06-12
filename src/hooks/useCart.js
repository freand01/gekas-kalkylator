import { useCallback, useEffect, useMemo, useState } from 'react'
import { createItem, loadCart, saveCart } from '../utils/storage'

export function useCart() {
  const [items, setItems] = useState(() => loadCart().items)

  useEffect(() => {
    saveCart({ items })
  }, [items])

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items],
  )

  const addItem = useCallback((price, source = 'manual') => {
    const num = parseFloat(String(price).replace(',', '.'))
    if (Number.isNaN(num) || num <= 0) return false

    const item = createItem(num, source)
    setItems((prev) => [item, ...prev])
    return true
  }, [])

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  return { items, total, addItem, removeItem, clearCart }
}
