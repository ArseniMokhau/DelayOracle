import { useEffect, useState } from 'react'
import { fetchHealth } from './api/health'

type ApiState = 'loading' | 'up' | 'down'

const MESSAGES: Record<ApiState, string> = {
  loading: 'Checking the API…',
  up: 'API is up',
  down: 'API is not reachable',
}

function App() {
  const [apiState, setApiState] = useState<ApiState>('loading')

  useEffect(() => {
    fetchHealth()
      .then(() => setApiState('up'))
      .catch(() => setApiState('down'))
  }, [])

  return (
    <main>
      <h1>DelayOracle</h1>
      <p>When to leave home to catch public transport in Gdańsk.</p>
      <p role="status">{MESSAGES[apiState]}</p>
    </main>
  )
}

export default App
