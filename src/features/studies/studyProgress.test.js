import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createEmptyStudyProgress,
  getStudyProgressSummary,
  normalizeStudyProgress,
  readStudyProgress,
  useStudyProgress,
  writeStudyProgress,
} from './studyProgress'

const STORAGE_KEY = 'santa-biblia-v2:study:la-fe-de-jesus:v1'

function createMemoryStorage(initialValue = null) {
  let value = initialValue
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((key, nextValue) => {
      if (key === STORAGE_KEY) value = String(nextValue)
    }),
  }
}

afterEach(() => {
  cleanup()
})

describe('study progress persistence', () => {
  it('returns a fresh empty state when stored JSON is corrupt or storage throws', () => {
    const corruptStorage = createMemoryStorage('{not-json')
    const unavailableStorage = {
      getItem() {
        throw new Error('Storage is disabled')
      },
    }

    expect(readStudyProgress(corruptStorage)).toEqual(createEmptyStudyProgress())
    expect(readStudyProgress(unavailableStorage)).toEqual(createEmptyStudyProgress())
    expect(readStudyProgress(corruptStorage).completedLessonSlugs)
      .not.toBe(readStudyProgress(corruptStorage).completedLessonSlugs)
  })

  it('normalizes malformed values and deduplicates completed lesson slugs', () => {
    expect(normalizeStudyProgress({
      version: 99,
      lastLessonSlug: '  la-santa-biblia  ',
      lastQuestionId: '  pregunta-2  ',
      completedLessonSlugs: [
        'quien-es-dios',
        ' quien-es-dios ',
        '',
        null,
        'la-santa-biblia',
      ],
      updatedAt: Number.POSITIVE_INFINITY,
    })).toEqual({
      version: 1,
      lastLessonSlug: 'la-santa-biblia',
      lastQuestionId: 'pregunta-2',
      completedLessonSlugs: ['quien-es-dios', 'la-santa-biblia'],
      updatedAt: null,
    })
  })

  it('swallows write failures while returning the state that remains usable in memory', () => {
    const unavailableStorage = {
      setItem() {
        throw new Error('Quota exceeded')
      },
    }
    const progress = {
      ...createEmptyStudyProgress(),
      lastLessonSlug: 'quien-es-dios',
    }

    expect(() => writeStudyProgress(progress, unavailableStorage)).not.toThrow()
    expect(writeStudyProgress(progress, unavailableStorage)).toEqual(progress)
  })
})

describe('getStudyProgressSummary', () => {
  it('reports bounded, integer completion and resume information', () => {
    const progress = {
      ...createEmptyStudyProgress(),
      lastLessonSlug: 'la-oracion-y-la-fe',
      completedLessonSlugs: ['uno', 'dos', 'dos', 'tres'],
    }

    expect(getStudyProgressSummary(progress, 8)).toEqual({
      completedLessons: 3,
      totalLessons: 8,
      percent: 38,
      resumeSlug: 'la-oracion-y-la-fe',
      hasStarted: true,
      isComplete: false,
    })
    expect(getStudyProgressSummary(progress, 2)).toMatchObject({
      completedLessons: 2,
      percent: 100,
      isComplete: true,
    })
    expect(getStudyProgressSummary(null, 0)).toMatchObject({
      completedLessons: 0,
      percent: 0,
      hasStarted: false,
      isComplete: false,
    })
  })
})

describe('useStudyProgress', () => {
  it('completes and uncompletes a lesson without creating duplicates', () => {
    const storage = createMemoryStorage()
    const { result } = renderHook(() => useStudyProgress(storage))

    act(() => result.current.toggleLessonComplete('quien-es-dios'))
    expect(result.current.progress.completedLessonSlugs).toEqual(['quien-es-dios'])
    expect(result.current.isLessonComplete('quien-es-dios')).toBe(true)

    act(() => result.current.toggleLessonComplete('quien-es-dios'))
    expect(result.current.progress.completedLessonSlugs).toEqual([])
    expect(result.current.isLessonComplete('quien-es-dios')).toBe(false)
    expect(storage.setItem).toHaveBeenCalledTimes(2)
  })

  it('does not write when the recorded position has not changed', () => {
    const storage = createMemoryStorage()
    const { result } = renderHook(() => useStudyProgress(storage))

    act(() => result.current.recordPosition('quien-es-dios', 'pregunta-1'))
    act(() => result.current.recordPosition('quien-es-dios', 'pregunta-1'))

    expect(result.current.progress).toMatchObject({
      lastLessonSlug: 'quien-es-dios',
      lastQuestionId: 'pregunta-1',
    })
    expect(storage.setItem).toHaveBeenCalledTimes(1)
  })

  it('synchronizes hook instances through the internal progress event', () => {
    const storage = createMemoryStorage()
    const first = renderHook(() => useStudyProgress(storage))
    const second = renderHook(() => useStudyProgress(storage))

    act(() => first.result.current.toggleLessonComplete('la-santa-biblia'))

    expect(second.result.current.progress.completedLessonSlugs).toEqual(['la-santa-biblia'])
    expect(second.result.current.isLessonComplete('la-santa-biblia')).toBe(true)
  })
})
