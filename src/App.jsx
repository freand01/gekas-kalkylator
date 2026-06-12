import { useState } from 'react'
import { useCart } from './hooks/useCart'
import Header from './components/Header'
import ManualInput from './components/ManualInput'
import CameraScanner from './components/CameraScanner'
import CartList from './components/CartList'

const TABS = [
  { id: 'manual', label: 'Manuell inmatning' },
  { id: 'scanner', label: 'Kamerascanner' },
]

export default function App() {
  const { items, total, addItem, removeItem, clearCart } = useCart()
  const [activeTab, setActiveTab] = useState('manual')

  return (
    <div className="app">
      <Header total={total} onClear={clearCart} />

      <nav className="tabs" role="tablist" aria-label="Inmatningsläge">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={`tabs__btn ${activeTab === tab.id ? 'tabs__btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="main">
        <div
          id="panel-manual"
          role="tabpanel"
          aria-labelledby="tab-manual"
          hidden={activeTab !== 'manual'}
          className="tab-panel"
        >
          <ManualInput onAdd={addItem} />
        </div>

        <div
          id="panel-scanner"
          role="tabpanel"
          aria-labelledby="tab-scanner"
          hidden={activeTab !== 'scanner'}
          className="tab-panel"
        >
          <CameraScanner onAdd={addItem} isActive={activeTab === 'scanner'} />
        </div>

        <CartList items={items} onRemove={removeItem} />
      </main>
    </div>
  )
}
