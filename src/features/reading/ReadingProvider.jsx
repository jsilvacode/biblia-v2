import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { advanceReading, readReadingState, READING_KEY, RECENT_READINGS_KEY } from './readingHistory'

const ReadingStateContext = createContext(null)
const ReadingActionsContext = createContext(null)

export function ReadingProvider({ children }) {
  const [readingState, setReadingState] = useState(readReadingState)

  useEffect(() => {
    try {
      window.localStorage.setItem(READING_KEY, JSON.stringify(readingState.lastRead))
      window.localStorage.setItem(RECENT_READINGS_KEY, JSON.stringify(readingState.recentReadings))
    } catch {
      // Reading continues even if private mode or a full quota blocks storage.
    }
  }, [readingState])

  const setLastRead = useCallback((reference) => {
    setReadingState((current) => advanceReading(current, reference))
  }, [])

  const actionsValue = useMemo(() => ({ setLastRead }), [setLastRead])

  return (
    <ReadingActionsContext.Provider value={actionsValue}>
      <ReadingStateContext.Provider value={readingState}>{children}</ReadingStateContext.Provider>
    </ReadingActionsContext.Provider>
  )
}

export function useReadingState() {
  const context = useContext(ReadingStateContext)
  if (!context) throw new Error('useReadingState must be used inside ReadingProvider')
  return context
}

export function useReadingActions() {
  const context = useContext(ReadingActionsContext)
  if (!context) throw new Error('useReadingActions must be used inside ReadingProvider')
  return context
}

export function useReading() {
  return { ...useReadingState(), ...useReadingActions() }
}
