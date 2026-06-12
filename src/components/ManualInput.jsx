import { useState } from 'react'
import NumericKeypad from './NumericKeypad'
import { formatInputDisplay } from '../utils/formatCurrency'

export default function ManualInput({ onAdd }) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const normalized = input.replace(',', '.')
    const price = parseFloat(normalized)
    if (Number.isNaN(price) || price <= 0) return

    const added = onAdd(price, 'manual')
    if (added) setInput('')
  }

  return (
    <div className="manual-input">
      <div className="manual-input__display" aria-live="polite" aria-label="Pris">
        {formatInputDisplay(input || '0')}
        <span className="manual-input__currency"> kr</span>
      </div>

      <NumericKeypad value={input} onChange={setInput} />

      <button
        type="button"
        className="btn btn--add"
        onClick={handleAdd}
        disabled={!input || parseFloat(input.replace(',', '.')) <= 0}
      >
        LÄGG TILL I VAGNEN
      </button>
    </div>
  )
}
