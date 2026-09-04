import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { bookmarkId, savedStorage } from './savedStorage'

const SavedContext = createContext(null)

function enqueueWrite(queueRef, write) {
  const pending = queueRef.current.then(write, write)
  queueRef.current = pending.catch(() => undefined)
  return pending
}

export function SavedProvider({ children }) {
  const [bookmarks, setBookmarks] = useState([])
  const [highlights, setHighlights] = useState([])
  const [isReady, setIsReady] = useState(false)
  const bookmarksRef = useRef([])
  const highlightsRef = useRef([])
  const bookmarkWritesRef = useRef(Promise.resolve())
  const highlightWritesRef = useRef(Promise.resolve())
  const loadRef = useRef(Promise.resolve())

  useEffect(() => {
    let active = true
    const load = savedStorage.read()
      .then(({ bookmarks: storedBookmarks, highlights: storedHighlights }) => {
        if (!active) return
        bookmarksRef.current = storedBookmarks
        highlightsRef.current = storedHighlights
        setBookmarks(storedBookmarks)
        setHighlights(storedHighlights)
      })
      .finally(() => {
        if (active) setIsReady(true)
      })
    loadRef.current = load.catch(() => undefined)
    return () => { active = false }
  }, [])

  const value = useMemo(() => ({
    bookmarks,
    highlights,
    isReady,
    isBookmarked(reference) {
      return bookmarks.some((bookmark) => bookmark.id === bookmarkId(reference))
    },
    async toggleBookmark(reference) {
      await loadRef.current
      const id = bookmarkId(reference)
      const current = bookmarksRef.current
      const alreadySaved = current.some((bookmark) => bookmark.id === id)
      const next = alreadySaved
        ? current.filter((bookmark) => bookmark.id !== id)
        : [{ ...reference, id, createdAt: Date.now() }, ...current]
      bookmarksRef.current = next
      setBookmarks(next)
      await enqueueWrite(bookmarkWritesRef, () => savedStorage.writeBookmarks(next))
    },
    isHighlighted(reference) {
      return highlights.some((highlight) => highlight.id === bookmarkId(reference))
    },
    async toggleHighlight(reference) {
      await loadRef.current
      const id = bookmarkId(reference)
      const current = highlightsRef.current
      const alreadyHighlighted = current.some((highlight) => highlight.id === id)
      const next = alreadyHighlighted
        ? current.filter((highlight) => highlight.id !== id)
        : [{ ...reference, id, createdAt: Date.now() }, ...current]
      highlightsRef.current = next
      setHighlights(next)
      await enqueueWrite(highlightWritesRef, () => savedStorage.writeHighlights(next))
    },
  }), [bookmarks, highlights, isReady])

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}

export function useSaved() {
  const context = useContext(SavedContext)
  if (!context) throw new Error('useSaved must be used inside SavedProvider')
  return context
}
