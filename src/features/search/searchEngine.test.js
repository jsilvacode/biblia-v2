import { normalizeSearchText, prepareSearchEntries, searchEntries } from './searchEngine'

describe('search engine', () => {
  const entries = [
    [43, 3, 16, 'Porque de tal manera amó Dios al mundo.'],
    [43, 3, 1, 'Había un hombre llamado Nicodemo.'],
  ]

  it('normalizes accents and punctuation', () => {
    expect(normalizeSearchText('João, 3:16')).toBe('joao 3 16')
  })

  it('finds all words in a verse', () => {
    expect(searchEntries(entries, 'Dios mundo')).toEqual([
      expect.objectContaining({ book: 43, chapter: 3, verse: 16 }),
    ])
  })

  it('prepares each active index once without changing search results', () => {
    const preparedEntries = prepareSearchEntries(entries)

    expect(preparedEntries[0]).toEqual([
      43,
      3,
      16,
      'Porque de tal manera amó Dios al mundo.',
      'porque de tal manera amo dios al mundo',
    ])
    expect(searchEntries(preparedEntries, 'Dios mundo'))
      .toEqual(searchEntries(entries, 'Dios mundo'))
  })
})
