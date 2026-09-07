import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createEmptyStudyProgress,
  getStudyProgressSummary,
  normalizeStudyProgress,
  mergeStudyProgress,
  readStudyProgress,
  writeStudyProgress,
} from './studyProgress'
import { useStudyLessonProgress } from './studyLessonProgress'

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
      version: 2,
      lastLessonSlug: 'la-santa-biblia',
      lastQuestionId: 'pregunta-2',
      completedLessonSlugs: ['quien-es-dios', 'la-santa-biblia'],
      courseCompletedAt: null,
      lessonProgress: {},
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

  it('migrates a completed v1 course and ignores unknown lesson slugs', () => {
    const completedLessonSlugs = [
      'quien-es-dios', 'la-santa-biblia', 'la-oracion-y-la-fe', 'el-regreso-de-cristo',
      'senales-del-regreso-de-cristo', 'el-origen-del-pecado', 'la-salvacion',
      'el-perdon-de-los-pecados', 'el-juicio', 'la-ley-de-dios', 'el-dia-de-descanso',
      'como-se-debe-guardar-el-sabado', 'que-es-la-muerte', 'la-iglesia-de-cristo',
      'el-don-de-profecia', 'las-normas-cristianas', 'el-bautismo', 'socios-de-dios',
      'la-vida-cristiana', 'dios-nos-llama', 'slug-inventado',
    ]
    const migrated = normalizeStudyProgress({ version: 1, completedLessonSlugs, updatedAt: 123 }, 999)

    expect(migrated).toMatchObject({ version: 2, courseCompletedAt: 123 })
    expect(migrated.completedLessonSlugs).toHaveLength(20)
    expect(migrated.completedLessonSlugs).not.toContain('slug-inventado')
  })
})

describe('getStudyProgressSummary', () => {
  it('reports bounded, integer completion and resume information', () => {
    const progress = {
      ...createEmptyStudyProgress(),
      lastLessonSlug: 'la-oracion-y-la-fe',
      completedLessonSlugs: ['quien-es-dios', 'la-santa-biblia', 'la-oracion-y-la-fe'],
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
      isComplete: false,
    })
    expect(getStudyProgressSummary(null, 0)).toMatchObject({
      completedLessons: 0,
      percent: 0,
      hasStarted: false,
      isComplete: false,
    })
  })
})

describe('useStudyLessonProgress', () => {
  it('records reading and only valid correct answers without duplicates', () => {
    const storage = createMemoryStorage()
    const { result } = renderHook(() => useStudyLessonProgress(storage))
    const lesson = {
      slug: 'quien-es-dios',
      assessmentRevision: 1,
      checkpoints: [{ id: 'q-01-01', correctOptionId: 'b' }],
    }

    act(() => result.current.setReadingConfirmed(lesson.slug, true, 1))
    act(() => result.current.recordCorrectAnswer(lesson, 'q-01-01', 'a'))
    act(() => result.current.recordCorrectAnswer(lesson, 'q-01-01', 'b'))
    expect(result.current.progress.lessonProgress[lesson.slug]).toEqual({
      assessmentRevision: 1,
      correctAnswers: { 'q-01-01': 'b' },
      readingConfirmed: true,
    })
    expect(storage.setItem).toHaveBeenCalledTimes(2)
  })

  it('does not write when the recorded position has not changed', () => {
    const storage = createMemoryStorage()
    const { result } = renderHook(() => useStudyLessonProgress(storage))

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
    const first = renderHook(() => useStudyLessonProgress(storage))
    const second = renderHook(() => useStudyLessonProgress(storage))

    act(() => first.result.current.setReadingConfirmed('la-santa-biblia', true, 1))

    expect(second.result.current.progress.lessonProgress['la-santa-biblia'].readingConfirmed).toBe(true)
  })

  it('keeps session progress across remounts when storage can read but cannot write', () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => { throw new Error('Quota exceeded') }),
    }
    const first = renderHook(() => useStudyLessonProgress(storage))
    act(() => first.result.current.setReadingConfirmed('quien-es-dios', true, 1))
    expect(first.result.current.isPersistent).toBe(false)
    first.unmount()

    const second = renderHook(() => useStudyLessonProgress(storage))
    expect(second.result.current.progress.lessonProgress['quien-es-dios'].readingConfirmed).toBe(true)
  })
})

describe('mergeStudyProgress', () => {
  it('preserves the union of achievements and uses the latest reading choice', () => {
    const first = normalizeStudyProgress({
      completedLessonSlugs: ['quien-es-dios'],
      lessonProgress: { 'la-santa-biblia': { assessmentRevision: 1, readingConfirmed: true, correctAnswers: { q1: 'a' } } },
      updatedAt: 10,
    })
    const second = normalizeStudyProgress({
      completedLessonSlugs: ['la-santa-biblia'],
      lessonProgress: { 'la-santa-biblia': { assessmentRevision: 1, readingConfirmed: false, correctAnswers: { q2: 'b' } } },
      updatedAt: 20,
    })

    expect(mergeStudyProgress(first, second)).toMatchObject({
      completedLessonSlugs: ['quien-es-dios', 'la-santa-biblia'],
      lessonProgress: { 'la-santa-biblia': { readingConfirmed: false, correctAnswers: { q1: 'a', q2: 'b' } } },
    })
  })

  it('keeps the newest assessment revision while preserving reading confirmation', () => {
    const oldRevision = normalizeStudyProgress({
      lessonProgress: { 'quien-es-dios': { assessmentRevision: 1, readingConfirmed: true, correctAnswers: { q1: 'a' } } },
      updatedAt: 30,
    })
    const newRevision = normalizeStudyProgress({
      lessonProgress: { 'quien-es-dios': { assessmentRevision: 2, readingConfirmed: false, correctAnswers: {} } },
      updatedAt: 20,
    })

    expect(mergeStudyProgress(oldRevision, newRevision).lessonProgress['quien-es-dios']).toEqual({
      assessmentRevision: 2,
      correctAnswers: {},
      readingConfirmed: true,
    })
  })
})
