import { getBook, getBookBySlug, getVersion } from '../bible/catalog'

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
  const slugMatch = /^\/biblia\/([^/]+)\/(\d+)(?:\/\d+)?\/?$/u.exec(location.pathname)
  const legacyMatch = /^\/read\/(\d+)\/(\d+)(?:\/\d+)?\/?$/u.exec(location.pathname)
  if (!slugMatch && !legacyMatch) return
  const book = slugMatch ? getBookBySlug(slugMatch[1]) : getBook(legacyMatch[1])
  if (!book) return
  const sharedVersionId = new URLSearchParams(location.search).get('v')
  const sharedVersion = sharedVersionId && getVersion(sharedVersionId).id === sharedVersionId
    ? sharedVersionId
    : versionId
  const chapter = Number(slugMatch?.[2] ?? legacyMatch[2])
  preloadReading({ book: book.id, chapter }, sharedVersion)
}
