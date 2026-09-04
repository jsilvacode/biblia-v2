import en from './en'
import es from './es'
import ptBR from './pt-BR'

function flatten(value, prefix = '', result = {}) {
  Object.entries(value).forEach(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (entry && typeof entry === 'object') flatten(entry, path, result)
    else result[path] = entry
  })
  return result
}

describe('interface copy', () => {
  it('keeps the same complete key contract in every interface language', () => {
    const catalogs = [es, en, ptBR].map((locale) => flatten(locale))
    const expectedKeys = Object.keys(catalogs[0]).sort()

    catalogs.forEach((catalog) => {
      expect(Object.keys(catalog).sort()).toEqual(expectedKeys)
    })
  })

  it('contains no empty, padded, corrupted or obviously duplicated strings', () => {
    const catalogs = [es, en, ptBR].map((locale) => flatten(locale))

    catalogs.forEach((catalog) => {
      Object.values(catalog).forEach((copy) => {
        expect(typeof copy).toBe('string')
        expect(copy).toBe(copy.trim())
        expect(copy).not.toMatch(/\uFFFD|\p{Cc}/u)
        expect(copy).not.toMatch(/\b([\p{L}]+)\s+\1\b/iu)
      })
    })
  })
})
