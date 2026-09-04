import { getBook, getLocalizedBookName } from '../bible/catalog'
import { parseReference } from '../bible/reference'

function normalizeReferenceLabel(label) {
  return String(label ?? '')
    .trim()
    .replace(/^Salmo\s+/iu, 'Salmos ')
}

export function resolveThematicReference(label) {
  const normalized = normalizeReferenceLabel(label)
  const match = normalized.match(/^(.+?)\s+(\d+)(?:-(\d+))?(?::(\d+)(?:-(\d+))?)?$/u)
  if (!match) return null

  const [, bookName, rawChapterStart, rawChapterEnd, rawVerseStart, rawVerseEnd] = match
  const parsed = parseReference(`${bookName} ${rawChapterStart}`)
    ?? parseReference(`${bookName} 1`)
  const book = getBook(parsed?.book)
  if (!book) return null

  const chapterStart = Number(rawChapterStart)
  const chapterEnd = Number(rawChapterEnd ?? rawChapterStart)

  // In a single-chapter book, “Judas 20” and “Judas 20-21” mean verses rather than chapters.
  if (!rawVerseStart && book.chapters === 1 && chapterStart > 1) {
    return {
      book: book.id,
      chapterStart: 1,
      chapterEnd: 1,
      verseStart: chapterStart,
      verseEnd: chapterEnd,
    }
  }

  if (chapterStart < 1 || chapterEnd < chapterStart || chapterEnd > book.chapters) return null

  return {
    book: book.id,
    chapterStart,
    chapterEnd,
    verseStart: rawVerseStart ? Number(rawVerseStart) : null,
    verseEnd: rawVerseEnd ? Number(rawVerseEnd) : rawVerseStart ? Number(rawVerseStart) : null,
  }
}

export function getThematicReferenceLocation(reference) {
  const resolved = typeof reference === 'string' ? resolveThematicReference(reference) : reference
  if (!resolved) return null
  return {
    book: resolved.book,
    chapter: resolved.chapterStart,
    verse: resolved.verseStart,
  }
}

export function formatThematicReference(reference, locale = 'es') {
  const resolved = typeof reference === 'string' ? resolveThematicReference(reference) : reference
  if (!resolved) return ''
  const book = getBook(resolved.book)
  const bookName = getLocalizedBookName(book, locale)
  const chapterLabel = resolved.chapterStart === resolved.chapterEnd
    ? `${resolved.chapterStart}`
    : `${resolved.chapterStart}-${resolved.chapterEnd}`
  if (resolved.verseStart === null || resolved.verseStart === undefined) return `${bookName} ${chapterLabel}`
  const verseLabel = resolved.verseStart === resolved.verseEnd
    ? `${resolved.verseStart}`
    : `${resolved.verseStart}-${resolved.verseEnd}`
  return `${bookName} ${resolved.chapterStart}:${verseLabel}`
}

export function getThematicReferencePath(label) {
  const reference = getThematicReferenceLocation(label)
  if (!reference) return null
  return `/read/${reference.book}/${reference.chapter}${reference.verse ? `/${reference.verse}` : ''}`
}
