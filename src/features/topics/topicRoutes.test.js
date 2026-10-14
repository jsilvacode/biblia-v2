import { describe, expect, it } from 'vitest'
import library from './data/topics.es.json'
import { findTopicSituationByLegacyHash } from './topicRoutes'

describe('topicRoutes', () => {
  it('migrates legacy hashes through exact known IDs without splitting hyphens', () => {
    expect(findTopicSituationByLegacyHash(library, '#topic-temor-ansiedad-y-paz-tengo-miedo-del-futuro'))
      .toMatchObject({ categoryId: 'temor-ansiedad-y-paz', id: 'tengo-miedo-del-futuro' })
    expect(findTopicSituationByLegacyHash(library, '#topic-temor-ansiedad-y-paz-no-existe')).toBeNull()
    expect(findTopicSituationByLegacyHash(library, '#topic-%E0%A4%A')).toBeNull()
  })
})
