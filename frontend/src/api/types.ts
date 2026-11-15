// The shapes of the API's JSON, mirroring the response records of the backend.
// Times are ISO strings in UTC (they end with Z).

export interface Stop {
  id: number
  name: string
  // Tells apart the platforms that share a name.
  code: string | null
  zone: string | null
}

// Where a predicted time came from: our model, ZTM's own live delay, or only the timetable.
export type PredictionSource = 'model' | 'fallback' | 'schedule'

export interface Departure {
  route: string
  headsign: string
  scheduledTime: string
  estimatedTime: string
  // The delays are null when ZTM has no live data for the departure.
  currentDelaySeconds: number | null
  predictedDelaySeconds: number | null
  predictedTime: string
  source: PredictionSource
}

export interface Commute {
  // A random GUID; it is the only key to the commute.
  id: string
  name: string
  stopId: number
  // Null means any line from the stop.
  routeShortName: string | null
  walkMinutes: number
  createdAt: string
}

// The body of POST and PUT /api/commutes.
export interface CommuteInput {
  name: string
  stopId: number
  routeShortName: string | null
  walkMinutes: number
}

// When no departure can be caught, status is "noDeparture" and the other values are null.
export interface Advice {
  status: 'leave' | 'noDeparture'
  departure: Departure | null
  leaveBy: string | null
  leaveInMinutes: number | null
}

export interface ModelCard {
  model: string
  features: string[]
  rows: { train: number; test: number }
  maeSeconds: { model: number; baseline: number }
  trainedAtUtc: string
}
