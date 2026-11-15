import DepartureList from '../components/DepartureList'
import ModelCard from '../components/ModelCard'
import StateTile from '../components/StateTile'
import StopSearch from '../components/StopSearch'
import type { DeparturesSearch } from '../lib/departuresSearch'

interface DeparturesPageProps {
  // The search lives in App, so it is still there after a visit to the other tab.
  search: DeparturesSearch
  onSearchChange: (search: DeparturesSearch) => void
}

// The "Departures" tab: pick a stop, see its live departures, and the model card beside them.
function DeparturesPage({ search, onSearchChange }: DeparturesPageProps) {
  return (
    <main className="page">
      <h1 className="visually-hidden">Departures</h1>
      <StopSearch
        initialText={search.text}
        onTextChange={(text) => onSearchChange({ ...search, text })}
        selectedStop={search.stop}
        onSelect={(stop) => onSearchChange({ ...search, stop })}
      />
      <div className="split">
        <div className="split-main">
          {search.stop ? (
            <DepartureList stop={search.stop} />
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
