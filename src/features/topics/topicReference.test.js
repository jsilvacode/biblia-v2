import { formatThematicReference, resolveThematicReference } from './topicReference'
import library from './data/topics.es.json'

describe('thematic reference links', () => {
  it.each([
    ['Salmo 27', { book: 19, chapterStart: 27, chapterEnd: 27, verseStart: null, verseEnd: null }],
    ['Mateo 6:25-34', { book: 40, chapterStart: 6, chapterEnd: 6, verseStart: 25, verseEnd: 34 }],
    ['Job 1-2', { book: 18, chapterStart: 1, chapterEnd: 2, verseStart: null, verseEnd: null }],
    ['Judas 20-21', { book: 65, chapterStart: 1, chapterEnd: 1, verseStart: 20, verseEnd: 21 }],
    ['3 Juan 2', { book: 64, chapterStart: 1, chapterEnd: 1, verseStart: 2, verseEnd: 2 }],
  ])('opens the first location in %s', (label, expected) => {
    expect(resolveThematicReference(label)).toEqual(expected)
  })

  it('rejects unknown references', () => {
    expect(resolveThematicReference('Referencia desconocida')).toBeNull()
  })

  it('formats localized chapter and verse ranges', () => {
    expect(formatThematicReference('Mateo 6:25-34', 'en')).toBe('Matthew 6:25-34')
    expect(formatThematicReference('Job 1-2', 'es')).toBe('Job 1-2')
  })

  it('resolves every reference in the editorial library', () => {
    const unresolved = library.categories.flatMap((category) => category.situations.flatMap((situation) => (
      [situation.central, ...situation.companions]
        .filter((label) => !resolveThematicReference(label))
        .map((label) => `${situation.title}: ${label}`)
    )))

    expect(unresolved).toEqual([])
  })
})
