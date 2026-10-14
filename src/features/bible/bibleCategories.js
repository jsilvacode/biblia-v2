import { bibleBooks } from './catalog'

// Each entry is an independent filter over the full catalogue. Historical
// books span both testaments; the requested letter grouping includes Hebrews
// with the fourteen Pauline letters.
const categories = [
  ['all', 'allBooks', 'library', [[1, 66]]],
  ['OT', 'oldTestament', 'bookOpen', [[1, 39]]],
  ['NT', 'newTestament', 'bookOpen', [[40, 66]]],
  ['pentateuch', 'collections.pentateuch', 'scroll', [[1, 5]]],
  ['history', 'collections.history', 'landmark', [[6, 17], [44, 44]]],
  ['wisdom', 'collections.wisdom', 'feather', [[18, 22]]],
  ['majorProphets', 'collections.majorProphets', 'megaphone', [[23, 27]]],
  ['minorProphets', 'collections.minorProphets', 'megaphone', [[28, 39]]],
  ['gospels', 'collections.gospels', 'cross', [[40, 43]]],
  ['letters', 'collections.letters', 'mail', [[45, 65]]],
  ['paulineLetters', 'collections.paulineLetters', 'mail', [[45, 58]]],
  ['generalLetters', 'collections.generalLetters', 'mail', [[59, 65]]],
  ['prophecy', 'collections.prophecy', 'sparkles', [[66, 66]]],
]

export const bibleCategories = categories.map(([id, labelKey, icon, ranges]) => ({
  id,
  labelKey: `bible.${labelKey}`,
  icon,
  books: bibleBooks.filter((book) => ranges.some(([first, last]) => book.id >= first && book.id <= last)),
}))
