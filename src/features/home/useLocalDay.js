import { useEffect, useState } from 'react'
import { getLocalCalendarDate } from './dailyPromise'

function millisecondsUntilNextLocalDay() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setHours(24, 0, 0, 75)
  return Math.max(tomorrow.getTime() - now.getTime(), 1_000)
}

/** Keeps the Home's editorial selection stable for the local day and refreshes it after midnight. */
export function useLocalDay() {
  const [localDay, setLocalDay] = useState(() => getLocalCalendarDate())

  useEffect(() => {
    let timeoutId
    const scheduleNextDay = () => {
      timeoutId = window.setTimeout(() => {
        setLocalDay(getLocalCalendarDate())
        scheduleNextDay()
      }, millisecondsUntilNextLocalDay())
    }

    scheduleNextDay()
    return () => window.clearTimeout(timeoutId)
  }, [])

  return localDay
}
