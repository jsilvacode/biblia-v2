import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPickerPositionScheduler } from './pickerPosition'

let frames
let nextFrame
function flushFrame() {
  const callbacks = [...frames.values()]
  frames.clear()
  callbacks.forEach((callback) => callback(0))
}

beforeEach(() => {
  frames = new Map()
  nextFrame = 0
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
    frames.set(++nextFrame, callback)
    return nextFrame
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn((frame) => frames.delete(frame)))
})
afterEach(() => vi.unstubAllGlobals())

describe('picker position scheduling', () => {
  it('combines scroll and resize bursts into one measurement per frame', () => {
    const measure = vi.fn()
    const scheduler = createPickerPositionScheduler(measure)
    scheduler.request()
    scheduler.request()
    scheduler.request()
    expect(measure).not.toHaveBeenCalled()
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1)
    flushFrame()
    expect(measure).toHaveBeenCalledTimes(1)
    scheduler.request()
    flushFrame()
    expect(measure).toHaveBeenCalledTimes(2)
  })

  it('cancels pending layout work when a menu closes and can be reused', () => {
    const measure = vi.fn()
    const scheduler = createPickerPositionScheduler(measure)
    scheduler.request()
    scheduler.cancel()
    flushFrame()
    expect(measure).not.toHaveBeenCalled()
    scheduler.request()
    flushFrame()
    expect(measure).toHaveBeenCalledTimes(1)
  })
})
