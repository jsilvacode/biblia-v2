import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { bookmarkId, savedStorage, SavedStorageError } from './savedStorage'

const SavedContext = createContext(null)

export function SavedProvider({ children }) {
  const [state, setState] = useState({ bookmarks: [], highlights: [], status: 'loading', loadError: null })
  const stateRef = useRef(state)
  const mountedRef = useRef(false)
  const queueRef = useRef(Promise.resolve())
  const loadRef = useRef(null)

  const publish = useCallback((changes) => {
    stateRef.current = { ...stateRef.current, ...changes }
    if (mountedRef.current) setState(stateRef.current)
  }, [])

  const enqueue = useCallback((action) => {
    const pending = queueRef.current.then(action, action)
    queueRef.current = pending.catch(() => undefined)
    return pending
  }, [])

  const retry = useCallback(() => {
    if (loadRef.current) return loadRef.current
    const load = enqueue(async () => {
      publish({ status: 'loading', loadError: null })
      try {
        const saved = await savedStorage.read()
        publish({ ...saved, status: 'ready', loadError: null })
      } catch (loadError) {
        publish({ status: 'error', loadError })
        throw loadError
      }
    })
    loadRef.current = load
    const clearLoad = () => { if (loadRef.current === load) loadRef.current = null }
    void load.then(clearLoad, clearLoad)
    return load
  }, [enqueue, publish])

  useEffect(() => {
    mountedRef.current = true
    void retry().catch(() => undefined)
    return () => { mountedRef.current = false }
  }, [retry])

  const toggle = useCallback((kind, reference) => enqueue(async () => {
    // An unread collection is not empty. A successful retry must precede
    // any mutation, and state is published only after its transaction commits.
    if (stateRef.current.status !== 'ready') throw stateRef.current.loadError ?? new SavedStorageError('read')
    const method = kind === 'bookmarks' ? 'toggleBookmark' : 'toggleHighlight'
    const result = await savedStorage[method](reference)
    publish({ [kind]: result.entries })
    return result.active
  }), [enqueue, publish])

  const bookmarkIds = useMemo(() => new Set(state.bookmarks.map(({ id }) => id)), [state.bookmarks])
  const highlightIds = useMemo(() => new Set(state.highlights.map(({ id }) => id)), [state.highlights])
  const value = useMemo(() => ({
    bookmarks: state.bookmarks,
    highlights: state.highlights,
    isReady: state.status === 'ready',
    isLoading: state.status === 'loading',
    loadError: state.loadError,
    retry,
    isBookmarked: (reference) => bookmarkIds.has(bookmarkId(reference)),
    isHighlighted: (reference) => highlightIds.has(bookmarkId(reference)),
    toggleBookmark: (reference) => toggle('bookmarks', reference),
    toggleHighlight: (reference) => toggle('highlights', reference),
  }), [bookmarkIds, highlightIds, retry, state, toggle])

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}

export function useSaved() {
  const context = useContext(SavedContext)
  if (!context) throw new Error('useSaved must be used inside SavedProvider')
  return context
}
