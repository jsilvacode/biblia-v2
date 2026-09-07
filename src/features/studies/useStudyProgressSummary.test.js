import { readStudyProgressSummary } from './useStudyProgressSummary'

const STORAGE_KEY = 'santa-biblia-v2:study:la-fe-de-jesus:v1'

function createStorage(value) {
  return {
    getItem(key) {
      return key === STORAGE_KEY ? value : null
    },
  }
}

describe('readStudyProgressSummary', () => {
  it('provides the complete lightweight summary consumed by Home', () => {
    const summary = readStudyProgressSummary(createStorage(JSON.stringify({
      lastLessonSlug: 'la-santa-biblia',
      completedLessonSlugs: ['quien-es-dios', 'quien-es-dios', 'slug-inventado'],
    })))

    expect(summary).toEqual({
      completedLessons: 1,
      hasStarted: true,
      percent: 5,
      totalLessons: 20,
    })
  })

  it('returns an untouched initial state for corrupt storage', () => {
    expect(readStudyProgressSummary(createStorage('{corrupto'))).toEqual({
      completedLessons: 0,
      hasStarted: false,
      percent: 0,
      totalLessons: 20,
    })
  })
})
