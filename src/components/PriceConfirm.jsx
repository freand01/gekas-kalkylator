import { useState } from 'react'
import NumericKeypad from './NumericKeypad'
import { formatInputDisplay } from '../utils/formatCurrency'
import { priceToInputString } from '../utils/extractNumbers'

export default function PriceConfirm({ initialPrice, lowConfidence, onConfirm, onRetry }) {
  const [input, setInput] = useState(() => priceToInputString(initialPrice))

  const parsed = parseFloat(input.replace(',', '.'))
  const valid = !Number.isNaN(parsed) && parsed > 0

  return (
    <div className="price-confirm">
      <p className="price-confirm__label">Kontrollera priset innan du lägger till</p>

      {lowConfidence && (
        <p className="price-confirm__warn" role="status">
          Osäker läsning – justera vid behov.
        </p>
      )}

      <div className="price-confirm__display" aria-live="polite">
        {formatInputDisplay(input || '0')}
        <span className="manual-input__currency"> kr</span>
      </div>

      <NumericKeypad value={input} onChange={setInput} />

      <button
        type="button"
        className="btn btn--add"
        onClick={() => valid && onConfirm(parsed)}
        disabled={!valid}
      >
        LÄGG TILL I VAGNEN
      </button>

      <button type="button" className="btn btn--text" onClick={onRetry}>
        Tryck på bilden igen
      </button>
    </div>
  )
}
