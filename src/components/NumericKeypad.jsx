import { Delete } from 'lucide-react'

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [',', '0', 'backspace'],
]

export default function NumericKeypad({ value, onChange }) {
  const handleKey = (key) => {
    if (key === 'backspace') {
      onChange(value.slice(0, -1))
      return
    }

    if (key === ',') {
      if (value.includes(',')) return
      onChange(value === '' ? '0,' : value + ',')
      return
    }

    if (value === '0' && key !== ',') {
      onChange(key)
      return
    }

    const next = value + key
    const normalized = next.replace(',', '.')
    const num = parseFloat(normalized)
    if (!Number.isNaN(num) && num > 999_999) return

    onChange(next)
  }

  return (
    <div className="keypad" role="group" aria-label="Numerisk knappsats">
      {KEYS.flat().map((key) => {
        if (key === 'backspace') {
          return (
            <button
              key={key}
              type="button"
              className="keypad__key keypad__key--action"
              onClick={() => handleKey(key)}
              aria-label="Radera sista siffran"
            >
              <Delete size={24} aria-hidden="true" />
            </button>
          )
        }

        return (
          <button
            key={key}
            type="button"
            className="keypad__key"
            onClick={() => handleKey(key)}
          >
            {key}
          </button>
        )
      })}
    </div>
  )
}
