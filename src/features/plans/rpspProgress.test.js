import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  readRpspProgress,
  readRpspProgressForReading,
  RPSP_PROGRESS_STORAGE_KEY,
  saveRpspProgress,
} from './rpspProgress'

const date = '2026-09-15'
const reference = { book: 19, chapter: 39 }

function createStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  }
}

describe('rpspProgress', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: createStorage() })
    vi.spyOn(Date, 'now').mockReturnValue(1_789_999_000_000)
  })

  afterEach(() => vi.restoreAllMocks())

  it('stores the daily capsule separately from ordinary Bible reading', () => {
    const progress = saveRpspProgress({
      audioPosition: 83,
      date,
      reference,
      scrollProgress: 46.4,
      verse: 8,
    })

    expect(progress).toEqual({
      audioPosition: 83,
      date,
      reference,
      schemaVersion: 1,
      scrollProgress: 46,
      updatedAt: 1_789_999_000_000,
      verse: 8,
    })
    expect(JSON.parse(window.localStorage.getItem(RPSP_PROGRESS_STORAGE_KEY))).toEqual(progress)
    expect(window.localStorage.getItem('santa_biblia_v2_reading')).toBeNull()
  })

  it('only restores a checkpoint from the same civil day and chapter', () => {
    saveRpspProgress({ date, reference, verse: 5 })

    expect(readRpspProgressForReading({ date, reference })?.verse).toBe(5)
    expect(readRpspProgressForReading({ date: '2026-09-16', reference })).toBeNull()
    expect(readRpspProgressForReading({ date, reference: { book: 19, chapter: 40 } })).toBeNull()
  })

  it('rejects malformed local data without affecting the page', () => {
    window.localStorage.setItem(RPSP_PROGRESS_STORAGE_KEY, '{not-json')
    expect(readRpspProgress()).toBeNull()
  })
})
