import type { Advice, Commute, Departure, ModelCard, Stop } from '../api/types'

// Synthetic API answers, only for tests.

export const STOP: Stop = { id: 1028, name: 'Brama Wyżynna', code: '01', zone: 'Gdańsk' }

// 17:21 UTC is 18:21 on the Gdańsk clock in November.
export const LATE_TRAM: Departure = {
  route: '6',
  headsign: 'Łostowice Świętokrzyska',
  scheduledTime: '2026-11-14T17:18:00Z',
  estimatedTime: '2026-11-14T17:20:30Z',
  currentDelaySeconds: 150,
  predictedDelaySeconds: 170,
  predictedTime: '2026-11-14T17:20:50Z',
  source: 'model',
}

export const TIMETABLE_BUS: Departure = {
  route: '111',
  headsign: 'Gościnna',
  scheduledTime: '2026-11-14T17:40:00Z',
  estimatedTime: '2026-11-14T17:40:00Z',
  currentDelaySeconds: null,
  predictedDelaySeconds: null,
  predictedTime: '2026-11-14T17:40:00Z',
  source: 'schedule',
}

export const MODEL_CARD: ModelCard = {
  model: 'PyTorch network, two hidden layers of 32',
  features: ['current_delay_s', 'minutes_to_departure', 'hour'],
  rows: { train: 22488, test: 5622 },
  maeSeconds: { model: 113.0, baseline: 159.2 },
  trainedAtUtc: '2026-11-15T02:27:05Z',
}

export const WORK_ID = 'c0ffee00-0000-4000-8000-000000000001'
export const GYM_ID = 'c0ffee00-0000-4000-8000-000000000002'

export const WORK_COMMUTE: Commute = {
  id: WORK_ID,
  name: 'Morning to work',
  stopId: 1028,
  routeShortName: '6',
  walkMinutes: 5,
  createdAt: '2026-11-13T08:00:00Z',
}

export const GYM_COMMUTE: Commute = {
  id: GYM_ID,
  name: 'Gym',
  stopId: 1028,
  routeShortName: null,
  walkMinutes: 3,
  createdAt: '2026-11-13T09:00:00Z',
}

// Leave by 17:14 UTC, which is 18:14 on the Gdańsk clock.
export const LEAVE_IN_SIX: Advice = {
  status: 'leave',
  departure: LATE_TRAM,
  leaveBy: '2026-11-14T17:14:50Z',
  leaveInMinutes: 6,
}

export const NO_DEPARTURE: Advice = {
  status: 'noDeparture',
  departure: null,
  leaveBy: null,
  leaveInMinutes: null,
}
