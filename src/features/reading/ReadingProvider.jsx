import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getBook } from '../bible/catalog'

const STORAGE_KEY = 'santa_biblia_v2_reading'
const defaultReading = { book: 43, chapter: 3, verse: null, progress: 0, updatedAt: null }
const ReadingContext = createContext(null)

function readLastRead() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...defaultReading }
    const value = JSON.parse(stored)
    const book = getBook(value?.book)
    const chapter = Number(value?.chapter)
    if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
      return { ...defaultReading }
    }
    return {
      book: book.id,
      chapter,
      progress: Number.isFinite(value.progress) ? Math.min(100, Math.max(0, Math.round(value.progress))) : 0,
      updatedAt: Number.isFinite(value.updatedAt) ? value.updatedAt : null,
      verse: Number.isInteger(value.verse) && value.verse > 0 ? value.verse : null,
    }
  } catch {
    return { ...defaultReading }
  }
}

export function ReadingProvider({ children }) {
  const [lastRead, setLastReadState] = useState(readLastRead)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lastRead))
    } catch {
      // Reading continues even if private mode or a full quota blocks storage.
    }
  }, [lastRead])

  const setLastRead = useCallback((reference) => {
    setLastReadState((current) => {
      const next = {
        ...defaultReading,
        ...current,
        ...reference,
        progress: Number.isFinite(reference.progress)
          ? Math.min(100, Math.max(0, Math.round(reference.progress)))
          : current.progress ?? 0,
        updatedAt: Date.now(),
      }
      return next
    })
  }, [])

  const value = useMemo(() => ({
    lastRead,
    setLastRead,
  }), [lastRead, setLastRead])

  return <ReadingContext.Provider value={value}>{children}</ReadingContext.Provider>
}

export function useReading() {
  const context = useContext(ReadingContext)
  if (!context) throw new Error('useReading must be used inside ReadingProvider')
  return context
}
