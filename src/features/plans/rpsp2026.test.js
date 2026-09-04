import { getRpspPlanState, getRpspReading, getRpspReadingByDay, getRpspReadingWindow } from './rpsp2026'

describe('Reavivados por su Palabra 2026', () => {
  it.each([
    [new Date(2026, 0, 1, 12), { book: 9, chapter: 24, day: 1 }],
    [new Date(2026, 1, 1, 12), { book: 10, chapter: 24, day: 32 }],
    [new Date(2026, 7, 8, 12), { book: 19, chapter: 1, day: 220 }],
    [new Date(2026, 7, 21, 12), { book: 19, chapter: 14, day: 233 }],
    [new Date(2026, 11, 31, 12), { book: 19, chapter: 146, day: 365 }],
  ])('maps %s to the verified calendar reading', (date, expected) => {
    expect(getRpspReading(date)).toMatchObject(expected)
  })

  it('keeps dates outside the supplied calendar explicit', () => {
    expect(getRpspReading(new Date(2025, 11, 31, 12))).toBeNull()
    expect(getRpspReading(new Date(2027, 0, 1, 12))).toBeNull()
    expect(getRpspPlanState(new Date(2025, 11, 31, 12)).status).toBe('upcoming')
    expect(getRpspPlanState(new Date(2027, 0, 1, 12)).status).toBe('completed')
  })

  it('returns bounded windows without inventing days', () => {
    expect(getRpspReadingWindow(363, 7)).toHaveLength(3)
    expect(getRpspReadingByDay(366)).toBeNull()
  })
})
