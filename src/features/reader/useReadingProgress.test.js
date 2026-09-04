import { describe, expect, it } from 'vitest'
import { getReadingProgress } from './useReadingProgress'

describe('getReadingProgress', () => {
  const chapter = [{ verse: 1 }, { verse: 4 }, { verse: 8 }, { verse: 12 }]

  it('calculates progress from the visible verse without assuming consecutive verse numbers', () => {
    expect(getReadingProgress(chapter, 1)).toBe(25)
    expect(getReadingProgress(chapter, 5)).toBe(75)
    expect(getReadingProgress(chapter, 12)).toBe(100)
  })

  it('returns zero for an empty chapter', () => {
    expect(getReadingProgress([], 1)).toBe(0)
  })
})
