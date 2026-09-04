import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { bookmarkId, createSavedStorage } from './savedStorage'

let databaseSequence = 0

function uniqueDatabaseName() {
  databaseSequence += 1
  return `saved-storage-test-${databaseSequence}`
}

describe('saved storage', () => {
  it('builds a stable identity for each Bible reference', () => {
    expect(bookmarkId({ version: 'nbla', book: 43, chapter: 3, verse: 16 }))
      .toBe('nbla:43:3:16')
  })

  it('starts clean and persists only this product saved data', async () => {
    const storage = createSavedStorage(uniqueDatabaseName())
    await expect(storage.read()).resolves.toEqual({ bookmarks: [], highlights: [] })

    const bookmarks = [{ createdAt: 1, id: 'nbla:43:3:16', version: 'nbla', book: 43, chapter: 3, verse: 16 }]
    const highlights = [{ createdAt: 2, id: 'rva2015:19:23:1', version: 'rva2015', book: 19, chapter: 23, verse: 1 }]
    await storage.writeBookmarks(bookmarks)
    await storage.writeHighlights(highlights)

    await expect(storage.read()).resolves.toEqual({ bookmarks, highlights })
  })

  it('discards malformed or foreign records instead of breaking the saved view', async () => {
    const storage = createSavedStorage(uniqueDatabaseName())
    await storage.writeBookmarks([
      { book: 43, chapter: 3, verse: 16, version: 'nbla' },
      { book: 999, chapter: 1, verse: 1, version: 'nbla' },
      { book: 43, chapter: 3, verse: 16, version: 'unknown' },
    ])

    await expect(storage.read()).resolves.toEqual({
      bookmarks: [{
        book: 43,
        chapter: 3,
        createdAt: 0,
        id: 'nbla:43:3:16',
        verse: 16,
        version: 'nbla',
      }],
      highlights: [],
    })
  })
})
