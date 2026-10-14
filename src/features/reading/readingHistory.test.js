import { afterEach, beforeEach, vi } from 'vitest'
import { advanceReading, readReadingState, READING_KEY, RECENT_READINGS_KEY } from './readingHistory'

const passage = (book, chapter, verse, updatedAt) => ({ book, chapter, verse, progress: 25, updatedAt })

describe('recent reading history', () => {
  let storageDescriptor
  beforeEach(() => {
    storageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')
    const items = new Map()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key) => items.get(key) ?? null,
        setItem: (key, value) => items.set(key, String(value)),
      },
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    if (storageDescriptor) Object.defineProperty(window, 'localStorage', storageDescriptor)
    else delete window.localStorage
  })

  it('starts without invented reading history', () => {
    const state = readReadingState()
    expect(state.lastRead.updatedAt).toBeNull()
    expect(state.recentReadings).toEqual([])
  })

  it('migrates the existing last reading and keeps its exact verse', () => {
    const previous = passage(43, 3, 16, 100)
    window.localStorage.setItem(READING_KEY, JSON.stringify(previous))
    expect(readReadingState()).toEqual({ lastRead: previous, recentReadings: [previous] })
  })

  it('updates a chapter in place, promotes revisits and retains only three distinct chapters', () => {
    let state = readReadingState()
    state = advanceReading(state, { book: 43, chapter: 3, verse: 16 }, 100)
    state = advanceReading(state, { book: 43, chapter: 3, verse: 18, progress: 50 }, 101)
    expect(state.recentReadings).toHaveLength(1)
    state = advanceReading(state, { book: 19, chapter: 23, verse: 4 }, 102)
    state = advanceReading(state, { book: 1, chapter: 1, verse: 5 }, 103)
    state = advanceReading(state, { book: 43, chapter: 3, verse: 20 }, 104)
    expect(state.recentReadings.map(({ book }) => book)).toEqual([43, 1, 19])
    expect(state.recentReadings[0].verse).toBe(20)
    state = advanceReading(state, { book: 40, chapter: 5, verse: 3 }, 105)
    expect(state.recentReadings.map(({ book }) => book)).toEqual([40, 43, 1])
    expect(state.lastRead).toEqual(state.recentReadings[0])
  })

  it('merges both storage records, removes corrupt entries and restores newest chapters first', () => {
    window.localStorage.setItem(READING_KEY, JSON.stringify(passage(43, 3, 16, 200)))
    window.localStorage.setItem(RECENT_READINGS_KEY, JSON.stringify([
      passage(19, 23, 4, 300), passage(43, 3, 5, 100), passage(1, 1, 1, 50),
      passage(999, 1, 1, 400), passage(40, 999, 1, 401), null,
    ]))
    const state = readReadingState()
    expect(state.lastRead).toEqual(passage(19, 23, 4, 300))
    expect(state.recentReadings.map(({ book, verse }) => [book, verse])).toEqual([[19, 4], [43, 16], [1, 1]])
  })

  it('continues in memory when storage is malformed or unavailable', () => {
    window.localStorage.setItem(READING_KEY, 'not json')
    window.localStorage.setItem(RECENT_READINGS_KEY, '{}')
    expect(readReadingState().recentReadings).toEqual([])
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => { throw new Error('Unavailable storage') })
    const state = advanceReading(readReadingState(), { book: 43, chapter: 3, verse: 16 }, 100)
    expect(state.recentReadings[0].verse).toBe(16)
    expect(advanceReading(state, { book: 999, chapter: 1 }, 101)).toBe(state)
  })
})
