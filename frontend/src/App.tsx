import { useState } from 'react'
import BrandMark from './components/BrandMark'
import { emptyDeparturesSearch } from './lib/departuresSearch'
import CommutesPage from './pages/CommutesPage'
import DeparturesPage from './pages/DeparturesPage'

type Tab = 'departures' | 'commutes'

function App() {
  const [tab, setTab] = useState<Tab>('commutes')
  // Kept here, above the pages: a page loses its own state when its tab is closed.
  const [departuresSearch, setDeparturesSearch] = useState(emptyDeparturesSearch)

  return (
    <div className="app">
      <div className="app-inner">
        <header className="app-header">
          <div className="brand">
            <BrandMark />
            <span className="brand-name">DelayOracle</span>
          </div>
          <nav className="tabs" aria-label="Sections">
            <button
              type="button"
              className="tab"
              aria-current={tab === 'departures' ? 'page' : undefined}
              onClick={() => setTab('departures')}
            >
              Departures
            </button>
            <button
              type="button"
              className="tab"
              aria-current={tab === 'commutes' ? 'page' : undefined}
              onClick={() => setTab('commutes')}
            >
              My commutes
            </button>
          </nav>
        </header>
        {tab === 'departures' ? (
          <DeparturesPage search={departuresSearch} onSearchChange={setDeparturesSearch} />
        ) : (
          <CommutesPage />
        )}
      </div>
    </div>
  )
}

export default App
