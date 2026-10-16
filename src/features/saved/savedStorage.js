import { createStore, getMany, set } from 'idb-keyval'
import { bibleVersions, getBook } from '../bible/catalog'

export const SAVED_DATABASE_NAME = 'santa_biblia_saved_data'

const STORE_NAME = 'saved'
const BOOKMARKS_KEY = 'bookmarks'
const HIGHLIGHTS_KEY = 'highlights'

export class SavedStorageError extends Error {
  constructor(operation, cause) {
    super(`Saved verses ${operation} failed`, { cause })
    this.name = 'SavedStorageError'
    this.code = operation === 'read' ? 'saved-read-failed' : 'saved-write-failed'
  }
}

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
  let store

  async function withStore(operation, action) {
    let currentStore
    try {
      currentStore = store ??= createStore(databaseName, STORE_NAME)
      return await action(currentStore)
    } catch (cause) {
      // createStore retains its opening promise. Discard a failed connection
      // so a later retry can open the database again.
      if (store === currentStore) store = undefined
      throw new SavedStorageError(operation, cause)
    }
  }

  function toggle(key, reference) {
    return withStore('write', (currentStore) => currentStore('readwrite', (objectStore) => new Promise((resolve, reject) => {
      const transaction = objectStore.transaction
      let entries
      let active
      transaction.oncomplete = () => resolve({ entries, active })
      transaction.onerror = transaction.onabort = () => reject(transaction.error ?? new Error('Saved transaction aborted'))
      const request = objectStore.get(key)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        try {
          const entry = normalizeSavedEntries([{ ...reference, createdAt: Date.now() }])[0]
          if (!entry) throw new Error('Invalid saved reference')
          const current = normalizeSavedEntries(request.result)
          active = !current.some(({ id }) => id === entry.id)
          entries = active ? [entry, ...current] : current.filter(({ id }) => id !== entry.id)
          objectStore.put(entries, key)
        } catch (error) {
          reject(error)
          transaction.abort()
        }
      }
    })))
  }

  return {
    read() {
      return withStore('read', async (currentStore) => {
        const [bookmarks, highlights] = await getMany([BOOKMARKS_KEY, HIGHLIGHTS_KEY], currentStore)
        return { bookmarks: normalizeSavedEntries(bookmarks), highlights: normalizeSavedEntries(highlights) }
      })
    },
    writeBookmarks(bookmarks) {
      return withStore('write', (currentStore) => set(BOOKMARKS_KEY, bookmarks, currentStore))
    },
    writeHighlights(highlights) {
      return withStore('write', (currentStore) => set(HIGHLIGHTS_KEY, highlights, currentStore))
    },
    toggleBookmark: (reference) => toggle(BOOKMARKS_KEY, reference),
    toggleHighlight: (reference) => toggle(HIGHLIGHTS_KEY, reference),
  }
}

export const savedStorage = createSavedStorage()
