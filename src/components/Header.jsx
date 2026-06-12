import { Trash2 } from 'lucide-react'
import { formatCurrency } from '../utils/formatCurrency'

export default function Header({ total, onClear }) {
  const handleClear = () => {
    if (window.confirm('Vill du tömma hela kundvagnen? Detta går inte att ångra.')) {
      onClear()
    }
  }

  return (
    <header className="header">
      <div className="header__total">
        <span className="header__label">Totalt</span>
        <span className="header__amount">{formatCurrency(total)}</span>
      </div>
      <button
        type="button"
        className="btn btn--danger-outline header__clear"
        onClick={handleClear}
        aria-label="Töm vagnen"
      >
        <Trash2 size={20} aria-hidden="true" />
        Töm vagnen
      </button>
    </header>
  )
}
