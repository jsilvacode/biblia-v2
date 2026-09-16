import { describe, expect, it } from 'vitest'
import library from './data/topics.es.json'
import {
  createCompanionId,
  createTopicDetailPath,
  createTopicsIndexPath,
  findTopicSituationByLegacyHash,
  resolveTopicCompanion,
} from './topicRoutes'

describe('topicRoutes', () => {
  it('keeps index filters when a situation gets its own URL', () => {
    expect(createTopicDetailPath({
      categoryId: 'temor-ansiedad-y-paz',
      situationId: 'tengo-miedo',
      searchParams: 'category=temor-ansiedad-y-paz&q=miedo',
    })).toBe('/topics/temor-ansiedad-y-paz/tengo-miedo?category=temor-ansiedad-y-paz&q=miedo')
    expect(createTopicsIndexPath('category=temor-ansiedad-y-paz&q=miedo&reading=companion-1'))
      .toBe('/topics?category=temor-ansiedad-y-paz&q=miedo')
  })

  it('uses stable editorial companion identifiers and rejects invalid ones', () => {
    expect(createCompanionId(0)).toBe('companion-1')
    expect(resolveTopicCompanion('companion-2', ['A', 'B', 'C'])).toEqual({ index: 1, isValid: true })
    expect(resolveTopicCompanion('companion-9', ['A'])).toEqual({ index: null, isValid: false })
    expect(resolveTopicCompanion('2', ['A'])).toEqual({ index: null, isValid: false })
    expect(resolveTopicCompanion(null, ['A'])).toEqual({ index: null, isValid: true })
  })

  it('migrates legacy hashes through exact known IDs without splitting hyphens', () => {
    expect(findTopicSituationByLegacyHash(library, '#topic-temor-ansiedad-y-paz-tengo-miedo-del-futuro'))
      .toMatchObject({ categoryId: 'temor-ansiedad-y-paz', id: 'tengo-miedo-del-futuro' })
    expect(findTopicSituationByLegacyHash(library, '#topic-temor-ansiedad-y-paz-no-existe')).toBeNull()
    expect(findTopicSituationByLegacyHash(library, '#topic-%E0%A4%A')).toBeNull()
  })
})
