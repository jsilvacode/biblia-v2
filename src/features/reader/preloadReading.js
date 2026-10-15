import { getBook, getVersion } from '../bible/catalog'

let readerPageRequest

export function loadReaderPage() {
  readerPageRequest ??= import('./ReaderPage').catch((error) => {
    readerPageRequest = null
    throw error
  })
  return readerPageRequest
}

export function preloadReading(reference, versionId) {
  const book = getBook(reference?.book)
  if (!book || !Number.isInteger(reference.chapter) || reference.chapter < 1 || reference.chapter > book.chapters) return

  // Both downloads start together; the chapter is shared with the mounted
  // reader through the repository's existing in-flight request/cache.
  void loadReaderPage().catch(() => undefined)
  void import('../bible/bibleRepository')
    .then(({ loadChapter }) => loadChapter({
      bookId: book.id,
      chapter: reference.chapter,
      versionId: getVersion(versionId).id,
    }))
    .catch(() => undefined)
}

export function preloadInitialReading(location, versionId) {
  const match = /^\/read\/(\d+)\/(\d+)(?:\/\d+)?\/?$/.exec(location.pathname)
  if (!match) return
  const sharedVersionId = new URLSearchParams(location.search).get('v')
  const sharedVersion = sharedVersionId && getVersion(sharedVersionId).id === sharedVersionId
    ? sharedVersionId
    : versionId
  preloadReading({ book: Number(match[1]), chapter: Number(match[2]) }, sharedVersion)
}
