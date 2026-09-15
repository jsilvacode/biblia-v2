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
    expect(searchEntries(entries, 'Dios mundo')).toMatchObject({
      results: [expect.objectContaining({ book: 43, chapter: 3, verse: 16 })],
      total: 1,
    })
  })

  it('matches complete normalized words instead of substrings', () => {
    const result = searchEntries([
      [3, 5, 2, 'Todo animal inmundo será apartado.'],
      [43, 3, 16, 'Porque de tal manera amó Dios al mundo.'],
    ], 'mundo')

    expect(result).toMatchObject({
      results: [expect.objectContaining({ book: 43, chapter: 3, verse: 16 })],
      total: 1,
    })
  })

  it('finds every word in a phrase even when the words are separated', () => {
    const result = searchEntries([
      [43, 3, 16, 'Porque de tal manera amó Dios al mundo.'],
      [41, 1, 27, 'Los espíritus inmundos le obedecen.'],
    ], 'tal mundo manera')

    expect(result).toMatchObject({
      results: [expect.objectContaining({ book: 43, chapter: 3, verse: 16 })],
      total: 1,
    })
  })

  it('returns paginated result sets with the real total beyond one hundred results', () => {
    const manyEntries = Array.from({ length: 125 }, (_, index) => [
      1,
      Math.floor(index / 31) + 1,
      (index % 31) + 1,
      `Dios está presente en la lectura ${index + 1}.`,
    ])
    const firstPage = searchEntries(manyEntries, 'dios', { limit: 50 })
    const secondPage = searchEntries(manyEntries, 'dios', { limit: 50, offset: 50 })
    const finalPage = searchEntries(manyEntries, 'dios', { limit: 50, offset: 100 })
    const resultIds = [firstPage, secondPage, finalPage]
      .flatMap((page) => page.results.map((result) => `${result.chapter}:${result.verse}`))

    expect(firstPage).toMatchObject({ total: 125, hasMore: true })
    expect(secondPage).toMatchObject({ total: 125, hasMore: true })
    expect(finalPage).toMatchObject({ total: 125, hasMore: false })
    expect(resultIds).toHaveLength(125)
    expect(new Set(resultIds).size).toBe(125)
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
