import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { normalizeSearchText, SEARCH_PAGE_SIZE } from './searchEngine'
import { searchWorkerClient } from './searchWorkerClient'

function idleState() {
  return {
    hasMore: false,
    isLoadingMore: false,
    key: null,
    requestKey: null,
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
  const generationRef = useRef(0)
  const abortRef = useRef(null)
  const loadingMoreRef = useRef(false)
  const [state, setState] = useState(idleState)
  const [attempt, setAttempt] = useState(0)
  const normalizedQuery = useMemo(() => normalizeSearchText(query), [query])
  const searchKey = `${translationId}:${normalizedQuery}`
  const requestKey = `${searchKey}:${pageSize}:${attempt}`

  const runSearch = useCallback(({ append = false, offset = 0, signal, generation }) => {
    searchWorkerClient.request({
      append, key: searchKey, offset, pageSize, query: normalizedQuery, translationId,
    }, { signal }).then((response) => {
      if (signal.aborted || generation !== generationRef.current) return
      loadingMoreRef.current = false
      setState((previous) => {
        if (append && previous.requestKey !== requestKey) return previous
        return {
          hasMore: response.hasMore,
          isLoadingMore: false,
          key: searchKey,
          requestKey,
          loadMoreError: null,
          message: null,
          results: append ? [...previous.results, ...response.results] : response.results,
          status: 'ready',
          total: response.total,
        }
      })
    }).catch((error) => {
      if (signal.aborted || error.name === 'AbortError' || generation !== generationRef.current) return
      loadingMoreRef.current = false
      setState((previous) => append && previous.requestKey === requestKey && previous.results.length
        ? { ...previous, isLoadingMore: false, loadMoreError: error.message }
        : { ...idleState(), key: searchKey, requestKey, message: error.message, status: 'error' })
    })
  }, [normalizedQuery, pageSize, requestKey, searchKey, translationId])

  useEffect(() => {
    const generation = ++generationRef.current
    abortRef.current?.abort()
    abortRef.current = null
    loadingMoreRef.current = false

    if (!enabled || !normalizedQuery) return undefined

    const controller = new AbortController()
    abortRef.current = controller
    const search = () => runSearch({ signal: controller.signal, generation })
    const timeout = debounceMs ? window.setTimeout(search, debounceMs) : null
    if (!debounceMs) search()

    return () => {
      if (timeout !== null) window.clearTimeout(timeout)
      abortRef.current?.abort()
      abortRef.current = null
      generationRef.current += 1
    }
  }, [debounceMs, enabled, normalizedQuery, runSearch])

  const loadMore = useCallback(() => {
    if (
      loadingMoreRef.current
      || !enabled
      || !normalizedQuery
      || state.requestKey !== requestKey
      || state.status !== 'ready'
      || !state.hasMore
    ) return

    const generation = ++generationRef.current
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    loadingMoreRef.current = true
    setState((previous) => (
      previous.requestKey === requestKey
        ? { ...previous, isLoadingMore: true, loadMoreError: null }
        : previous
    ))
    runSearch({ append: true, offset: state.results.length, signal: controller.signal, generation })
  }, [enabled, normalizedQuery, requestKey, runSearch, state.hasMore, state.requestKey, state.results.length, state.status])

  const retry = useCallback(() => setAttempt(value => value + 1), [])

  if (!enabled || !normalizedQuery) return { ...idleState(), loadMore, retry }
  if (state.requestKey !== requestKey) return { ...idleState(), loadMore, retry, status: 'loading' }
  return { ...state, loadMore, retry }
}
