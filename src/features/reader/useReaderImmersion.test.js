import { describe, expect, it } from 'vitest'
import { isNeutralReaderTap } from './useReaderImmersion'

function target(selector = null) {
  return { closest: (query) => selector && query.includes(selector) ? {} : null }
}

describe('isNeutralReaderTap', () => {
  it('accepts a short, still tap on a neutral reading surface', () => {
    expect(isNeutralReaderTap(
      { clientX: 20, clientY: 30, timeStamp: 100 },
      { clientX: 24, clientY: 35, timeStamp: 400 },
      target(),
    )).toBe(true)
  })

  it('rejects scroll gestures and interactive controls', () => {
    expect(isNeutralReaderTap(
      { clientX: 20, clientY: 30, timeStamp: 100 },
      { clientX: 20, clientY: 52, timeStamp: 180 },
      target(),
    )).toBe(false)
    expect(isNeutralReaderTap(
      { clientX: 20, clientY: 30, timeStamp: 100 },
      { clientX: 20, clientY: 30, timeStamp: 180 },
      target('button'),
    )).toBe(false)
  })
})
