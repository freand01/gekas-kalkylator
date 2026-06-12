import { Delete } from 'lucide-react'
import { formatCurrency } from '../utils/formatCurrency'

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CartList({ items, onRemove }) {
  if (items.length === 0) {
    return (
      <section className="cart cart--empty" aria-label="Kundvagn">
        <p className="cart__empty-text">Kundvagnen är tom – lägg till varor ovan</p>
      </section>
    )
  }

  return (
    <section className="cart" aria-label="Kundvagn">
      <h2 className="cart__heading">
        Kundvagn <span className="cart__count">({items.length})</span>
      </h2>
      <ul className="cart__list">
        {items.map((item) => (
          <li key={item.id} className="cart__item">
            <div className="cart__item-info">
              <span className="cart__item-price">{formatCurrency(item.price)}</span>
              <span className="cart__item-time">{formatTime(item.timestamp)}</span>
            </div>
            <button
              type="button"
              className="btn btn--remove"
              onClick={() => onRemove(item.id)}
              aria-label={`Ta bort ${formatCurrency(item.price)}`}
            >
              <Delete size={22} aria-hidden="true" />
              Ta bort
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
