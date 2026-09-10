import { useEffect, useRef, useState } from 'react'

export function useBibleTextSearch({ debounceMs = 0, enabled = true, query, translationId }) {
  const workerRef = useRef(null)
  const requestIdRef = useRef(0)
  const normalizedQuery = query.trim()
  const searchKey = `${translationId}:${normalizedQuery}`
  const [state, setState] = useState({ key: null, status: 'idle', results: [] })

  useEffect(() => {
    const worker = new Worker(new URL('../../workers/searchWorker.js', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (event) => {
      if (event.data.id !== requestIdRef.current) return
      setState({
        key: event.data.key,
        message: event.data.message,
        results: event.data.results,
        status: event.data.status,
      })
    }
    return () => worker.terminate()
  }, [])

  useEffect(() => {
    if (!enabled || !normalizedQuery || !workerRef.current) return undefined

    const id = requestIdRef.current + 1
    requestIdRef.current = id
    const runSearch = () => workerRef.current?.postMessage({
      id,
      key: searchKey,
      query: normalizedQuery,
      translationId,
    })
    const timeout = debounceMs ? window.setTimeout(runSearch, debounceMs) : null
    if (!debounceMs) runSearch()

    return () => {
      if (timeout !== null) window.clearTimeout(timeout)
    }
  }, [debounceMs, enabled, normalizedQuery, searchKey, translationId])

  if (!enabled || !normalizedQuery) return { status: 'idle', results: [] }
  if (state.key !== searchKey) return { status: 'loading', results: [] }
  return state
}
