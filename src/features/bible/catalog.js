import books from './data/books.json'
import versions from './data/versions.json'
import { getLocalizedBookName } from './bookNames'

export const bibleBooks = Object.freeze(books)
export const bibleVersions = Object.freeze(versions)

export function getBook(bookId) {
  return bibleBooks.find((book) => book.id === Number(bookId)) ?? null
}

export function getVersion(versionId) {
  return bibleVersions.find((version) => version.id === versionId) ?? bibleVersions[1]
}

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

export function getAdjacentReference(reference, direction) {
  const book = getBook(reference.book)
  if (!book) return null

  if (direction === 'next' && reference.chapter < book.chapters) {
    return { ...reference, chapter: reference.chapter + 1, verse: null }
  }

  if (direction === 'previous' && reference.chapter > 1) {
    return { ...reference, chapter: reference.chapter - 1, verse: null }
  }

  const index = bibleBooks.findIndex((item) => item.id === book.id)
  const adjacentBook = bibleBooks[index + (direction === 'next' ? 1 : -1)]
  if (!adjacentBook) return null

  return {
    book: adjacentBook.id,
    chapter: direction === 'next' ? 1 : adjacentBook.chapters,
    verse: null,
  }
}

export function formatReference(reference, locale = 'es') {
  const book = getBook(reference.book)
  if (!book) return ''
  return `${getLocalizedBookName(book, locale)} ${reference.chapter}${reference.verse ? `:${reference.verse}` : ''}`
}

export { getLocalizedBookName }
