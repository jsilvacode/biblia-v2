import { getAllLocalizedBookNames } from './bookNames'
import { bibleBooks, normalizeText } from './catalog'

const searchableBooks = bibleBooks.map((book) => ({
  book,
  names: [...getAllLocalizedBookNames(book), book.abbrev, book.slug].filter(Boolean).map(normalizeText),
}))

export function findMatchingBooks(query, { exact = false } = {}) {
  const normalized = normalizeText(query)
  if (!normalized) return []
  return searchableBooks.filter(({ names }) => names.some((name) => exact ? name === normalized : name.includes(normalized)))
    .map(({ book }) => book)
}
