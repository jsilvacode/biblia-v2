import { createStore, get, set } from 'idb-keyval'
import { bibleVersions, getBook } from '../bible/catalog'

export const SAVED_DATABASE_NAME = 'santa_biblia_saved_data'

const STORE_NAME = 'saved'
const BOOKMARKS_KEY = 'bookmarks'
const HIGHLIGHTS_KEY = 'highlights'

export function bookmarkId(reference) {
  return [reference.version, reference.book, reference.chapter, reference.verse].join(':')
}

function normalizeSavedEntries(value) {
  if (!Array.isArray(value)) return []

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const book = getBook(entry.book)
    const chapter = Number(entry.chapter)
    const verse = Number(entry.verse)
    const version = bibleVersions.find((candidate) => candidate.id === entry.version)
    if (!book || !version || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) return []
    if (!Number.isInteger(verse) || verse < 1) return []

    const reference = {
      book: book.id,
      chapter,
      createdAt: Number.isFinite(entry.createdAt) ? entry.createdAt : 0,
      verse,
      version: version.id,
    }
    return [{ ...reference, id: bookmarkId(reference) }]
  })
}

export function createSavedStorage(databaseName = SAVED_DATABASE_NAME) {
  const store = createStore(databaseName, STORE_NAME)

  return {
    async read() {
      const [bookmarksResult, highlightsResult] = await Promise.allSettled([
        get(BOOKMARKS_KEY, store),
        get(HIGHLIGHTS_KEY, store),
      ])
      const bookmarks = bookmarksResult.status === 'fulfilled'
        ? normalizeSavedEntries(bookmarksResult.value)
        : []
      const highlights = highlightsResult.status === 'fulfilled'
        ? normalizeSavedEntries(highlightsResult.value)
        : []

      return { bookmarks, highlights }
    },
    writeBookmarks(bookmarks) {
      return set(BOOKMARKS_KEY, bookmarks, store)
    },
    writeHighlights(highlights) {
      return set(HIGHLIGHTS_KEY, highlights, store)
    },
  }
}

export const savedStorage = createSavedStorage()
