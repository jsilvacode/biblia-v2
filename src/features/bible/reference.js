import { bibleBooks, normalizeText } from './catalog'
import { getAllLocalizedBookNames } from './bookNames'

const aliases = {
  juan: 43,
  john: 43,
  joao: 43,
  'joão': 43,
  jn: 43,
  genesis: 1,
  genesis_en: 1,
  'gênesis': 1,
  salmos: 19,
  psalms: 19,
  salmos_pt: 19,
  romanos: 45,
  romans: 45,
}

function resolveBook(name) {
  const normalized = normalizeText(name)
  const alias = aliases[normalized]
  if (alias) return bibleBooks.find((book) => book.id === alias)
  return bibleBooks.find((book) => {
    return [...getAllLocalizedBookNames(book), book.abbrev, book.slug].some((value) => normalizeText(value) === normalized)
  })
}

export function parseReference(input) {
  const match = String(input ?? '').trim().match(/^(.+?)\s+(\d+)(?::(\d+))?$/u)
  if (!match) return null

  const [, rawBook, rawChapter, rawVerse] = match
  const book = resolveBook(rawBook)
  const chapter = Number(rawChapter)
  const verse = rawVerse ? Number(rawVerse) : null

  if (!book || chapter < 1 || chapter > book.chapters || (verse !== null && verse < 1)) return null
  return { book: book.id, chapter, verse }
}
