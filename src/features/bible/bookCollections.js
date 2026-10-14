import { bibleBooks } from './catalog'

// Familiar literary divisions, in the same canonical order as the catalogue.
const divisions = [
  ['pentateuch', 'OT', 1, 5],
  ['history', 'OT', 6, 17],
  ['wisdom', 'OT', 18, 22],
  ['majorProphets', 'OT', 23, 27],
  ['minorProphets', 'OT', 28, 39],
  ['gospels', 'NT', 40, 43],
  ['history', 'NT', 44, 44],
  ['paulineLetters', 'NT', 45, 57],
  ['generalLetters', 'NT', 58, 65],
  ['prophecy', 'NT', 66, 66],
]

export const bookCollections = divisions.map(([key, testament, first, last]) => ({
  id: `${testament}-${key}`,
  key,
  testament,
  books: bibleBooks.filter((book) => book.id >= first && book.id <= last),
}))
