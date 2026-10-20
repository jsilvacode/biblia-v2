import { useCallback, useEffect, useRef, useState } from 'react'
import { getLocalVideoDate, normalizeVideoDate } from './dailyVideoModel.js'
import { cacheDailyVideo, loadDailyVideo, readCachedDailyVideo } from './dailyVideoRepository.js'

export function useDailyVideo({ date: requestedDate, freezeDate = false } = {}) {
  const [today, setToday] = useState(getLocalVideoDate)
  const [calendarDate, setCalendarDate] = useState(getLocalVideoDate)
  const [attempt, setAttempt] = useState(0)
  const date = requestedDate === undefined ? today : normalizeVideoDate(requestedDate)
  const [state, setState] = useState(() => {
    const cached = date ? readCachedDailyVideo(date) : null
    return { date, metadata: cached, status: cached ? 'ready' : 'loading' }
  })
  const [history, setHistory] = useState({ date: null, previous: [], status: 'idle' })
  const historyRequest = useRef(null)
  const lastRequestAt = useRef(0)
  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    if (requestedDate !== undefined) return undefined
    const update = () => {
      if (!document.hidden) {
        const currentDate = getLocalVideoDate()
        setCalendarDate(currentDate)
        if (!freezeDate) setToday(currentDate)
      }
    }
    update()
    const interval = window.setInterval(update, 30_000)
    document.addEventListener('visibilitychange', update)
    window.addEventListener('focus', update)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', update)
      window.removeEventListener('focus', update)
    }
  }, [requestedDate, freezeDate])

  useEffect(() => {
    if (!date) return undefined
    const controller = new AbortController()
    let active = true
    lastRequestAt.current = Date.now()
    const cached = readCachedDailyVideo(date)
    loadDailyVideo({ date, signal: controller.signal }).then((metadata) => {
      if (!active) return
      cacheDailyVideo(metadata)
      const available = metadata.status === 'unavailable' && cached ? { ...cached, sourceUnavailable: true } : metadata
      setState({ date, metadata: available, status: available.status })
    }).catch(() => {
      if (!active) return
      setState({ date, metadata: cached ? { ...cached, sourceUnavailable: true } : null, status: cached ? 'ready' : 'unavailable' })
    })
    return () => { active = false; controller.abort() }
  }, [date, attempt])

  useEffect(() => () => historyRequest.current?.abort(), [date])

  useEffect(() => {
    if (!date || freezeDate) return undefined
    const resume = () => {
      if (!document.hidden && Date.now() - lastRequestAt.current >= 120_000) retry()
    }
    const reconnect = () => retry()
    const timeout = window.setTimeout(() => {
      if (!document.hidden) retry()
    }, state.date === date && state.status === 'ready' ? 900_000 : 120_000)
    window.addEventListener('focus', resume)
    window.addEventListener('online', reconnect)
    document.addEventListener('visibilitychange', resume)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('focus', resume)
      window.removeEventListener('online', reconnect)
      document.removeEventListener('visibilitychange', resume)
    }
  }, [date, state.date, state.status, attempt, freezeDate, retry])

  const loadPrevious = useCallback(async () => {
    if (!date || (history.date === date && ['loading', 'ready'].includes(history.status))) return
    historyRequest.current?.abort()
    const controller = new AbortController()
    historyRequest.current = controller
    setHistory({ date, previous: [], status: 'loading' })
    try {
      const metadata = await loadDailyVideo({ date, history: true, signal: controller.signal })
      if (metadata.historyStatus === 'unavailable') throw new Error('Capsule history unavailable')
      if (!controller.signal.aborted) setHistory({ date, previous: metadata.previous ?? [], status: 'ready' })
    } catch {
      if (!controller.signal.aborted) setHistory({ date, previous: [], status: 'error' })
    }
  }, [date, history.date, history.status])

  const visibleState = state.date === date ? state : { metadata: null, status: 'loading' }
  return {
    date,
    newerDate: requestedDate === undefined && calendarDate !== date ? calendarDate : null,
    metadata: visibleState.metadata,
    episode: visibleState.metadata?.episode ?? null,
    status: date ? visibleState.status : 'invalid_date',
    retry,
    loadPrevious,
    previous: history.date === date ? history.previous : [],
    historyStatus: history.date === date ? history.status : 'idle',
  }
}
