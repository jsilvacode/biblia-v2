import { parseReference } from './reference'

describe('parseReference', () => {
  it.each([
    ['Juan 3:16', { book: 43, chapter: 3, verse: 16 }],
    ['John 3:16', { book: 43, chapter: 3, verse: 16 }],
    ['João 3:16', { book: 43, chapter: 3, verse: 16 }],
    ['Salmos 23', { book: 19, chapter: 23, verse: null }],
  ])('resolves %s', (input, expected) => {
    expect(parseReference(input)).toEqual(expected)
  })

  it('rejects references outside the canonical range', () => {
    expect(parseReference('Juan 99:1')).toBeNull()
  })
})
