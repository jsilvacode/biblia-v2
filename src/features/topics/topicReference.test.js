import { formatThematicReference, resolveThematicReference } from './topicReference'
import library from './data/topics.es.json'

describe('thematic reference links', () => {
  it.each([
    ['Salmo 27', { book: 19, chapterStart: 27, chapterEnd: 27, verseStart: null, verseEnd: null }],
    ['Mateo 6:25-34', { book: 40, chapterStart: 6, chapterEnd: 6, verseStart: 25, verseEnd: 34 }],
    ['Job 1-2', { book: 18, chapterStart: 1, chapterEnd: 2, verseStart: null, verseEnd: null }],
    ['Génesis 18:1-19:22', { book: 1, chapterStart: 18, chapterEnd: 19, verseStart: 1, verseEnd: 22 }],
    ['Gálatas 3:26-4:7', { book: 48, chapterStart: 3, chapterEnd: 4, verseStart: 26, verseEnd: 7 }],
    ['Romanos 11:36-12:2', { book: 45, chapterStart: 11, chapterEnd: 12, verseStart: 36, verseEnd: 2 }],
    ['Éxodo 24:9-31:18', { book: 2, chapterStart: 24, chapterEnd: 31, verseStart: 9, verseEnd: 18 }],
    ['1 Corintios 3:21-4:2', { book: 46, chapterStart: 3, chapterEnd: 4, verseStart: 21, verseEnd: 2 }],
    ['Judas 20-21', { book: 65, chapterStart: 1, chapterEnd: 1, verseStart: 20, verseEnd: 21 }],
    ['3 Juan 2', { book: 64, chapterStart: 1, chapterEnd: 1, verseStart: 2, verseEnd: 2 }],
  ])('opens the first location in %s', (label, expected) => {
    expect(resolveThematicReference(label)).toEqual(expected)
  })

  it('rejects unknown references', () => {
    expect(resolveThematicReference('Referencia desconocida')).toBeNull()
  })

  it.each(['Mateo 6:27-25', 'Gálatas 4:7-3:26', 'Mateo 6:0', 'Mateo 6-7:2'])(
    'rejects an invalid range in %s',
    (label) => expect(resolveThematicReference(label)).toBeNull(),
  )

  it('uses structured belief coordinates without interpreting their display label', () => {
    const reference = { bookId: 48, book: 'Gálatas', chapterStart: 3, chapterEnd: 4, verseStart: 26, verseEnd: 7, label: 'Gál. 3:26–4:7' }
    expect(resolveThematicReference(reference)).toEqual({ book: 48, chapterStart: 3, chapterEnd: 4, verseStart: 26, verseEnd: 7 })
    expect(formatThematicReference(reference, 'en')).toBe('Galatians 3:26-4:7')
  })

  it('formats localized chapter and verse ranges', () => {
    expect(formatThematicReference('Mateo 6:25-34', 'en')).toBe('Matthew 6:25-34')
    expect(formatThematicReference('Job 1-2', 'es')).toBe('Job 1-2')
    expect(formatThematicReference('Gálatas 3:26-4:7', 'en')).toBe('Galatians 3:26-4:7')
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
