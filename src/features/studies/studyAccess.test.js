import {
  canCompleteLesson,
  completeLessonProgress,
  getLessonAccess,
  getNextPendingLesson,
} from './studyAccess'

const catalog = [
  { order: 1, slug: 'uno' },
  { order: 2, slug: 'dos' },
  { order: 3, slug: 'tres' },
]
const lesson = {
  ...catalog[0],
  assessmentRevision: 1,
  checkpoints: ['q1', 'q2', 'q3'].map((id) => ({ correctOptionId: 'b', id })),
}

function progress(overrides = {}) {
  return {
    completedLessonSlugs: [],
    courseCompletedAt: null,
    lessonProgress: {},
    ...overrides,
  }
}

describe('study access rules', () => {
  it('only opens the first pending lesson while completed lessons remain accessible', () => {
    const empty = progress()
    expect(getNextPendingLesson(empty, catalog)).toBe(catalog[0])
    expect(getLessonAccess('uno', empty, catalog).accessible).toBe(true)
    expect(getLessonAccess('dos', empty, catalog)).toMatchObject({
      accessible: false,
      blockingLesson: catalog[0],
      status: 'locked',
    })

    const withGap = progress({ completedLessonSlugs: ['dos'] })
    expect(getLessonAccess('dos', withGap, catalog).accessible).toBe(true)
    expect(getLessonAccess('tres', withGap, catalog).accessible).toBe(false)
  })

  it('requires reading and the three real correct answers before completing', () => {
    const incomplete = progress({
      lessonProgress: {
        uno: {
          assessmentRevision: 1,
          readingConfirmed: true,
          correctAnswers: { q1: 'b', q2: 'b', invented: 'b' },
        },
      },
    })
    expect(canCompleteLesson(lesson, incomplete, catalog)).toBe(false)
    expect(completeLessonProgress(lesson, incomplete, catalog, 10)).toBe(incomplete)

    const ready = progress({
      lessonProgress: {
        uno: {
          assessmentRevision: 1,
          readingConfirmed: true,
          correctAnswers: { q1: 'b', q2: 'b', q3: 'b' },
        },
      },
    })
    const completed = completeLessonProgress(lesson, ready, catalog, 10)
    expect(completed).toMatchObject({ completedLessonSlugs: ['uno'], updatedAt: 10 })
    expect(completeLessonProgress(lesson, completed, catalog, 20)).toBe(completed)
  })

  it('keeps permanent access after completing the course', () => {
    const finished = progress({ courseCompletedAt: 42 })
    expect(catalog.every(({ slug }) => getLessonAccess(slug, finished, catalog).accessible)).toBe(true)
  })

  it('records the permanent milestone when the final pending lesson is completed', () => {
    const finalLesson = { ...lesson, order: 3, slug: 'tres' }
    const ready = progress({
      completedLessonSlugs: ['uno', 'dos'],
      lessonProgress: {
        tres: {
          assessmentRevision: 1,
          readingConfirmed: true,
          correctAnswers: { q1: 'b', q2: 'b', q3: 'b' },
        },
      },
    })
    expect(completeLessonProgress(finalLesson, ready, catalog, 77)).toMatchObject({
      completedLessonSlugs: ['uno', 'dos', 'tres'],
      courseCompletedAt: 77,
    })
  })
})
