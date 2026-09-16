import { describe, expect, it } from 'vitest'
import library from './data/topics.es.json'
import { filterTopicSituations, getTopicSituations, matchesTopicQuery, tokenizeTopicQuery } from './topicSearch'

const situations = getTopicSituations(library)

describe('topicSearch', () => {
  it('keeps the 92 editorial situations in their original order', () => {
    expect(situations).toHaveLength(92)
    expect(situations[0]).toMatchObject({
      categoryId: 'temor-ansiedad-y-paz',
      id: 'tengo-miedo',
      title: 'Tengo miedo',
    })
  })

  it('normalizes accents and requires every term in a situation search', () => {
    expect(tokenizeTopicQuery('  corazón   quebrantado ')).toEqual(['corazon', 'quebrantado'])
    expect(filterTopicSituations(situations, { query: 'corazón quebrantado' }).map((item) => item.id))
      .toContain('siento-el-corazon-quebrantado')
    expect(matchesTopicQuery(situations[0], 'miedo futuro')).toBe(false)
  })

  it('finds references written with or without spacing and punctuation', () => {
    const peace = situations.find((item) => item.id === 'necesito-paz-interior')
    expect(matchesTopicQuery(peace, 'Juan14:25-27')).toBe(true)
    expect(matchesTopicQuery(peace, 'juan 14 25')).toBe(true)
  })

  it('combines an area filter with the current query', () => {
    const results = filterTopicSituations(situations, {
      categoryId: 'temor-ansiedad-y-paz',
      query: 'miedo',
    })
    expect(results.map((item) => item.id)).toEqual(['tengo-miedo', 'tengo-miedo-del-futuro'])
  })
})
