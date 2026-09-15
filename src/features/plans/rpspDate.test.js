import { getLocalRpspDate, getRpspReadingForDate, parseRpspDate } from './rpspDate'

describe('civil RPSP dates', () => {
  it('accepts only real, strict calendar dates', () => {
    expect(parseRpspDate('2026-09-10')).toMatchObject({ year: 2026, month: 9, day: 10 })
    expect(parseRpspDate('2026-9-10')).toBeNull()
    expect(parseRpspDate('2026-02-29')).toBeNull()
    expect(parseRpspDate('2026-09-10T00:00:00Z')).toBeNull()
  })

  it('derives Salmos 34 from the requested civil day without serializing a Date', () => {
    expect(getRpspReadingForDate('2026-09-10')).toMatchObject({
      status: 'active',
      date: '2026-09-10',
      reference: { book: 19, chapter: 34 },
      reading: { day: 253 },
    })
  })

  it('keeps valid dates outside the installed calendar explicit', () => {
    expect(getRpspReadingForDate('2027-01-01')).toEqual({
      status: 'out_of_calendar',
      date: '2027-01-01',
      reference: null,
      reading: null,
    })
  })

  it('formats the browser date from local components', () => {
    expect(getLocalRpspDate(new Date(2026, 8, 10, 0, 5))).toBe('2026-09-10')
  })
})
