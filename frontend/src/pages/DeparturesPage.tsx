import { useState } from 'react'
import type { Stop } from '../api/types'
import DepartureList from '../components/DepartureList'
import ModelCard from '../components/ModelCard'
import StateTile from '../components/StateTile'
import StopSearch from '../components/StopSearch'

// The "Departures" tab: pick a stop, see its live departures, and the model card beside them.
function DeparturesPage() {
  // The stop whose departures are showing; null until the user picks one.
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null)

  return (
    <main className="page">
      <h1 className="visually-hidden">Departures</h1>
      <StopSearch selectedStop={selectedStop} onSelect={setSelectedStop} />
      <div className="split">
        <div className="split-main">
          {selectedStop ? (
            <DepartureList stop={selectedStop} />
          ) : (
            <StateTile
              tone="empty"
              title="Pick a stop to see its departures"
              text="Search for a stop above and choose it from the list."
            />
          )}
        </div>
        <div className="split-side">
          <ModelCard />
        </div>
      </div>
    </main>
  )
}

export default DeparturesPage
