import { describe, expect, it } from 'vitest'
import {
  adjustReaderFontScale,
  normalizeReaderFontScale,
  readerFontScalePercentage,
} from './readerFontScale'

describe('reader font scale', () => {
  it('keeps the stored value within the supported readable range', () => {
    expect(normalizeReaderFontScale(0.2)).toBe(0.85)
    expect(normalizeReaderFontScale(4)).toBe(1.3)
    expect(normalizeReaderFontScale('invalid')).toBe(1)
  })

  it('moves in predictable five-percent steps without floating point noise', () => {
    expect(adjustReaderFontScale(1, 1)).toBe(1.05)
    expect(adjustReaderFontScale(1, -1)).toBe(0.95)
    expect(readerFontScalePercentage(1.05)).toBe(105)
  })
})
