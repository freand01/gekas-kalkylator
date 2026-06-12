export function formatCurrency(amount) {
  const rounded = Math.round(amount * 100) / 100
  const [whole, cents] = rounded.toFixed(2).split('.')
  const formattedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  if (cents === '00') {
    return `${formattedWhole} kr`
  }
  return `${formattedWhole},${cents} kr`
}

export function formatInputDisplay(value) {
  if (!value) return '0'
  return value.replace('.', ',')
}
