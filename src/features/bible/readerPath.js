import { getBook, getBookRouteSlug } from './catalog'

export function getReaderPath(reference) {
  const book = getBook(reference?.book)
  if (!book) return '/biblia'

  const chapter = Number(reference.chapter)
  const verse = Number(reference.verse)
  const path = `/biblia/${getBookRouteSlug(book)}/${chapter}`
  return Number.isInteger(verse) && verse > 0 ? `${path}/${verse}` : path
}
