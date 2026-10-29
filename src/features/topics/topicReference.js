import { getBook, getLocalizedBookName } from '../bible/catalog'
import { parseReference } from '../bible/reference'

function normalizeReferenceLabel(label) {
  return String(label ?? '')
    .trim()
    .replace(/^Salmo\s+/iu, 'Salmos ')
}

function validateReference(reference) {
  const book = getBook(reference.bookId ?? reference.book)
  const { chapterStart, chapterEnd = chapterStart, verseStart = null, verseEnd = verseStart } = reference
  if (!book || !Number.isInteger(chapterStart) || !Number.isInteger(chapterEnd)
    || chapterStart < 1 || chapterEnd < chapterStart || chapterEnd > book.chapters) return null
  if (verseStart === null) {
    if (verseEnd !== null) return null
  } else if (!Number.isInteger(verseStart) || !Number.isInteger(verseEnd)
    || verseStart < 1 || verseEnd < 1
    || (chapterStart === chapterEnd && verseEnd < verseStart)) return null
  return { book: book.id, chapterStart, chapterEnd, verseStart, verseEnd }
}

export function resolveThematicReference(value) {
  if (value && typeof value === 'object') return validateReference(value)
  const normalized = normalizeReferenceLabel(value)
  const match = normalized.match(/^(.+?)\s+(\d+)(?::(\d+))?(?:-(\d+)(?::(\d+))?)?$/u)
  if (!match) return null

  const [, bookName, rawStart, rawVerseStart, rawEnd, rawVerseEnd] = match
  const parsed = parseReference(`${bookName} ${rawStart}`)
    ?? parseReference(`${bookName} 1`)
  const book = getBook(parsed?.book)
  if (!book || (!rawVerseStart && rawVerseEnd)) return null

  const start = Number(rawStart)
  const end = Number(rawEnd ?? rawStart)

  // In a single-chapter book, “Judas 20” and “Judas 20-21” mean verses rather than chapters.
  if (!rawVerseStart && book.chapters === 1 && start > 1) {
    return validateReference({ book: book.id, chapterStart: 1, verseStart: start, verseEnd: end })
  }

  return validateReference({
    book: book.id,
    chapterStart: start,
    chapterEnd: rawVerseStart && !rawVerseEnd ? start : end,
    verseStart: rawVerseStart ? Number(rawVerseStart) : null,
    verseEnd: rawVerseEnd ? Number(rawVerseEnd) : rawVerseStart ? Number(rawEnd ?? rawVerseStart) : null,
  })
}

export function formatThematicReference(reference, locale = 'es') {
  const resolved = resolveThematicReference(reference)
  if (!resolved) return ''
  const book = getBook(resolved.book)
  const bookName = getLocalizedBookName(book, locale)
  const chapterLabel = resolved.chapterStart === resolved.chapterEnd
    ? `${resolved.chapterStart}`
    : `${resolved.chapterStart}-${resolved.chapterEnd}`
  if (resolved.verseStart === null) return `${bookName} ${chapterLabel}`
  if (resolved.chapterStart !== resolved.chapterEnd) {
    return `${bookName} ${resolved.chapterStart}:${resolved.verseStart}-${resolved.chapterEnd}:${resolved.verseEnd}`
  }
  const verseLabel = resolved.verseStart === resolved.verseEnd
    ? `${resolved.verseStart}`
    : `${resolved.verseStart}-${resolved.verseEnd}`
  return `${bookName} ${resolved.chapterStart}:${verseLabel}`
}
