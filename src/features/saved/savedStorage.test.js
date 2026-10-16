import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { bookmarkId, createSavedStorage } from './savedStorage'

let databaseSequence = 0

function uniqueDatabaseName() {
  databaseSequence += 1
  return `saved-storage-test-${databaseSequence}`
}

describe('saved storage', () => {
  afterEach(() => vi.restoreAllMocks())

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

  it('opens lazily and recovers after an opening failure', async () => {
    const open = vi.spyOn(indexedDB, 'open').mockImplementationOnce(() => {
      throw new DOMException('Storage unavailable', 'SecurityError')
    })
    const storage = createSavedStorage(uniqueDatabaseName())
    expect(open).not.toHaveBeenCalled()
    await expect(storage.read()).rejects.toMatchObject({ code: 'saved-read-failed' })
    await expect(storage.read()).resolves.toEqual({ bookmarks: [], highlights: [] })
    expect(open).toHaveBeenCalledTimes(2)
  })

  it('rejects an aborted read and retries without replacing the saved records', async () => {
    const storage = createSavedStorage(uniqueDatabaseName())
    await storage.toggleBookmark({ version: 'nbla', book: 43, chapter: 3, verse: 16 })
    const before = await storage.read()
    const originalGet = IDBObjectStore.prototype.get
    vi.spyOn(IDBObjectStore.prototype, 'get').mockImplementationOnce(function (key) {
      const request = originalGet.call(this, key)
      queueMicrotask(() => this.transaction.abort())
      return request
    })
    await expect(storage.read()).rejects.toMatchObject({ code: 'saved-read-failed' })
    await expect(storage.read()).resolves.toEqual(before)
  })

  it('rolls back an aborted mutation and allows the next attempt to commit', async () => {
    const storage = createSavedStorage(uniqueDatabaseName())
    const reference = { version: 'nbla', book: 43, chapter: 3, verse: 16 }
    const originalPut = IDBObjectStore.prototype.put
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(function (...args) {
      const request = originalPut.apply(this, args)
      queueMicrotask(() => this.transaction.abort())
      return request
    })
    await expect(storage.toggleBookmark(reference)).rejects.toMatchObject({ code: 'saved-write-failed' })
    await expect(storage.read()).resolves.toEqual({ bookmarks: [], highlights: [] })
    await expect(storage.toggleBookmark(reference)).resolves.toMatchObject({ active: true, entries: [{ ...reference, id: bookmarkId(reference) }] })
    expect((await storage.read()).bookmarks).toHaveLength(1)
  })

  it('rejects a failed transaction read rather than leaving a mutation pending', async () => {
    const storage = createSavedStorage(uniqueDatabaseName())
    const originalGet = IDBObjectStore.prototype.get
    vi.spyOn(IDBObjectStore.prototype, 'get').mockImplementationOnce(function (key) {
      const request = originalGet.call(this, key)
      queueMicrotask(() => this.transaction.abort())
      return request
    })
    await expect(storage.toggleHighlight({ version: 'nbla', book: 43, chapter: 3, verse: 16 })).rejects.toMatchObject({ code: 'saved-write-failed' })
    await expect(storage.read()).resolves.toEqual({ bookmarks: [], highlights: [] })
  })

  it('preserves concurrent mutations from separate connections to the same database', async () => {
    const name = uniqueDatabaseName()
    const first = createSavedStorage(name)
    const second = createSavedStorage(name)
    const john = { version: 'nbla', book: 43, chapter: 3, verse: 16 }
    const psalm = { version: 'nbla', book: 19, chapter: 23, verse: 1 }
    const genesis = { version: 'rva2015', book: 1, chapter: 1, verse: 1 }
    await Promise.all([first.toggleBookmark(john), second.toggleBookmark(psalm)])
    expect((await first.read()).bookmarks.map(({ id }) => id).sort()).toEqual([bookmarkId(john), bookmarkId(psalm)].sort())
    await Promise.all([first.toggleBookmark(john), second.toggleBookmark(genesis)])
    expect((await second.read()).bookmarks.map(({ id }) => id).sort()).toEqual([bookmarkId(psalm), bookmarkId(genesis)].sort())
  })
})
