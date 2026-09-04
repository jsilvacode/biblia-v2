import { normalizeSearchText, searchEntries } from './searchEngine'

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
})
