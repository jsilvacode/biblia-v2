import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { normalizeSearchText, SEARCH_PAGE_SIZE } from './searchEngine'

function idleState() {
  return {
    hasMore: false,
    isLoadingMore: false,
    key: null,
    loadMoreError: null,
    message: null,
    results: [],
    status: 'idle',
    total: 0,
  }
}

export function useBibleTextSearch({
  debounceMs = 0,
  enabled = true,
  pageSize = SEARCH_PAGE_SIZE,
  query,
  translationId,
}) {
  const workerRef = useRef(null)
  const requestIdRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const [state, setState] = useState(idleState)
  const normalizedQuery = useMemo(() => normalizeSearchText(query), [query])
  const searchKey = `${translationId}:${normalizedQuery}`

  useEffect(() => {
    const worker = new Worker(new URL('../../workers/searchWorker.js', import.meta.url), { type: 'module' })
    workerRef.current = worker
    worker.onmessage = (event) => {
      const response = event.data
      if (response.id !== requestIdRef.current) return

      loadingMoreRef.current = false
      setState((previous) => {
        if (response.status === 'error') {
          if (response.append && previous.key === response.key && previous.results.length) {
            return { ...previous, isLoadingMore: false, loadMoreError: response.message }
          }

          return {
            ...idleState(),
            key: response.key,
            message: response.message,
            status: 'error',
          }
        }

        if (response.append) {
          if (previous.key !== response.key) return previous

          return {
            hasMore: response.hasMore,
            isLoadingMore: false,
            key: response.key,
            loadMoreError: null,
            message: null,
            results: [...previous.results, ...response.results],
            status: 'ready',
            total: response.total,
          }
        }

        return {
          hasMore: response.hasMore,
          isLoadingMore: false,
          key: response.key,
          loadMoreError: null,
          message: null,
          results: response.results,
          status: 'ready',
          total: response.total,
        }
      })
    }

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    const id = requestIdRef.current + 1
    requestIdRef.current = id
    loadingMoreRef.current = false

    if (!enabled || !normalizedQuery || !workerRef.current) return undefined

    const runSearch = () => workerRef.current?.postMessage({
      append: false,
      id,
      key: searchKey,
      offset: 0,
      pageSize,
      query: normalizedQuery,
      translationId,
    })
    const timeout = debounceMs ? window.setTimeout(runSearch, debounceMs) : null
    if (!debounceMs) runSearch()

    return () => {
      if (timeout !== null) window.clearTimeout(timeout)
    }
  }, [debounceMs, enabled, normalizedQuery, pageSize, searchKey, translationId])

  const loadMore = useCallback(() => {
    if (
      loadingMoreRef.current
      || !enabled
      || !normalizedQuery
      || !workerRef.current
      || state.key !== searchKey
      || state.status !== 'ready'
      || !state.hasMore
    ) return

    const id = requestIdRef.current + 1
    requestIdRef.current = id
    loadingMoreRef.current = true
    setState((previous) => (
      previous.key === searchKey
        ? { ...previous, isLoadingMore: true, loadMoreError: null }
        : previous
    ))
    workerRef.current.postMessage({
      append: true,
      id,
      key: searchKey,
      offset: state.results.length,
      pageSize,
      query: normalizedQuery,
      translationId,
    })
  }, [enabled, normalizedQuery, pageSize, searchKey, state.hasMore, state.key, state.results.length, state.status, translationId])

  if (!enabled || !normalizedQuery) return { ...idleState(), loadMore }
  if (state.key !== searchKey) return { ...idleState(), loadMore, status: 'loading' }
  return { ...state, loadMore }
}
