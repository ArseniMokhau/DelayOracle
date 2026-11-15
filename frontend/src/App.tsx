import { useState } from 'react'
import BrandMark from './components/BrandMark'
import CommutesPage from './pages/CommutesPage'
import DeparturesPage from './pages/DeparturesPage'


type Tab = 'departures' | 'commutes'

function App(){
  const [tab, setTab] = useState<Tab>('commutes')

  return (
    <div className='app'>
      <div className='app-inner'>
        <header className='app-header'>
          <div className='brand'>
            <BrandMark />
            <span className="brand-name">DelayOracle</span>
          </div>
          <nav className='tabs' aria-label='Sections'>
            <button
              type='button'
              className='tab'
              aria-current={tab === 'departures' ? 'page' : undefined}
              onClick={() => setTab('departures')}
            >
              Departures
            </button>
            <button
              type='button'
              className='tab'
              aria-current={tab === 'commutes' ? 'page' : undefined}
              onClick={() => setTab('commutes')}
            >
              My commutes
            </button>
          </nav>
        </header>
        {tab === 'departures' ? <DeparturesPage/> : <CommutesPage/>}
      </div>
    </div>
  )
}

export default App
