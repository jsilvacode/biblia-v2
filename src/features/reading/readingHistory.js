import { getBook } from '../bible/catalog'

export const READING_KEY = 'santa_biblia_v2_reading'
export const RECENT_READINGS_KEY = 'santa_biblia_v2_recent_readings'
const defaultReading = { book: 43, chapter: 3, verse: null, progress: 0, updatedAt: null }

function normalizeReading(value) {
  const book = getBook(value?.book)
  const chapter = Number(value?.chapter)
  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) return null
  return {
    book: book.id,
    chapter,
    verse: Number.isInteger(value.verse) && value.verse > 0 ? value.verse : null,
    progress: Number.isFinite(value.progress) ? Math.min(100, Math.max(0, Math.round(value.progress))) : 0,
    updatedAt: Number.isFinite(value.updatedAt) && value.updatedAt > 0 ? value.updatedAt : null,
  }
}

function uniqueChapters(readings) {
  const seen = new Set()
  return readings.filter((reading) => {
    if (!reading?.updatedAt) return false
    const key = `${reading.book}:${reading.chapter}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 3)
}

function readStored(key) {
  try { return JSON.parse(window.localStorage.getItem(key)) }
  catch { return null }
}

export function readReadingState() {
  const storedLastRead = normalizeReading(readStored(READING_KEY))
  const storedHistory = readStored(RECENT_READINGS_KEY)
  const candidates = [storedLastRead, ...(Array.isArray(storedHistory) ? storedHistory.map(normalizeReading) : [])]
    .filter((reading) => reading?.updatedAt)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const recentReadings = uniqueChapters(candidates)
  return { lastRead: recentReadings[0] ?? storedLastRead ?? { ...defaultReading }, recentReadings }
}

export function advanceReading(current, reference, updatedAt = Date.now()) {
  const next = normalizeReading({
    ...current.lastRead,
    ...reference,
    progress: Number.isFinite(reference.progress) ? reference.progress : current.lastRead.progress,
    updatedAt,
  })
  if (!next) return current
  return { lastRead: next, recentReadings: uniqueChapters([next, ...current.recentReadings]) }
}
