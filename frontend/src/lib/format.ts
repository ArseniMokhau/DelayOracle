import type { Advice, PredictionSource, Stop } from '../api/types'


// Shows times on the Gdańsk clock, whatever time zone the browser is in.
const gdanskTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Warsaw',
  hour: '2-digit',
  minute: '2-digit',
})

const SOURCE_LABELS: Record<PredictionSource, string> = {
  model: 'Model',
  fallback: 'ZTM live',
  schedule: 'Timetable',
}

export type DelayTone = 'none' | 'late' | 'early' | 'onTime'

export interface DelayDescription {
  text: string
  tone: DelayTone
}

export function sourceLabel(source: PredictionSource): string{
    return SOURCE_LABELS[source]
}

export function formatTime(isoTime: string): string {
    return gdanskTime.format(new Date(isoTime))
}

export function describeDelay(delay: number | null): DelayDescription {
    if (delay === null) {
            return { text: 'No live data', tone: 'none'}
    }
    const delayMinutes = Math.round(delay / 60)
    if (delayMinutes > 0) {
        return { text: `${delayMinutes} min late`, tone: 'late' }
    }
    if (delayMinutes < 0) {
        return { text: `${-delayMinutes} min early`, tone: 'early' }
    }
    return { text: 'On time', tone: 'onTime' }
}

// The answer of a commute tile in words.
export function adviceHeadline(advice: Advice): string {
  if (advice.status === 'noDeparture' || advice.leaveInMinutes === null) {
    return 'No departure'
  }
  if (advice.leaveInMinutes === 0) {
    return 'Leave now'
  }
  const unit = advice.leaveInMinutes === 1 ? 'minute' : 'minutes'
  return `Leave in ${advice.leaveInMinutes} ${unit}`
}

// Platforms of one stop share a name, so the platform code is part of the label.
export function stopLabel(stop: Stop): string {
  return stop.code ? `${stop.name} ${stop.code}` : stop.name
}