import { useEffect, useState } from 'react'
import { getLocalRpspDate } from './rpspDate'

function millisecondsUntilNextLocalDay(now = new Date()) {
  const nextDay = new Date(now)
  nextDay.setHours(24, 0, 0, 75)
  return Math.max(nextDay.getTime() - now.getTime(), 1_000)
}

/**
 * Keeps the date civil to the reader's device. Reavivados changes with the
 * local day, so a return to the tab also checks whether midnight passed.
 */
export function useRpspLocalDate() {
  const [date, setDate] = useState(() => getLocalRpspDate())

  useEffect(() => {
    let timeoutId
    const refresh = () => setDate(getLocalRpspDate())
    const schedule = () => {
      timeoutId = window.setTimeout(() => {
        refresh()
        schedule()
      }, millisecondsUntilNextLocalDay())
    }

    window.addEventListener('focus', refresh)
    schedule()
    return () => {
      window.removeEventListener('focus', refresh)
      window.clearTimeout(timeoutId)
    }
  }, [])

  return date
}
