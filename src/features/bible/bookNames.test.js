import { getBook } from './catalog'
import { getLocalizedBookName } from './bookNames'

describe('localized book names', () => {
  it('keeps a canonical id while presenting the reader locale', () => {
    const john = getBook(43)

    expect(getLocalizedBookName(john, 'es')).toBe('Juan')
    expect(getLocalizedBookName(john, 'en')).toBe('John')
    expect(getLocalizedBookName(john, 'pt-BR')).toBe('João')
  })
})
