import { describe, expect, it } from 'vitest'
import { getThematicChapterNumbers, selectThematicVerses } from './topicPassage'
import { resolveThematicReference } from './topicReference'

describe('thematic passage reading', () => {
  it('loads every chapter in a full chapter range', () => {
    const reference = resolveThematicReference('Job 1-2')
    expect(getThematicChapterNumbers(reference)).toEqual([1, 2])
  })

  it('keeps only the requested verses from a verse range', () => {
    const reference = resolveThematicReference('Mateo 6:25-27')
    const verses = selectThematicVerses([
      { chapter: 6, verses: [{ verse: 24 }, { verse: 25 }, { verse: 26 }, { verse: 27 }, { verse: 28 }] },
    ], reference)
    expect(verses.map((verse) => verse.verse)).toEqual([25, 26, 27])
  })

  it('shows all verses when the topic references a chapter', () => {
    const reference = resolveThematicReference('Salmo 27')
    const verses = selectThematicVerses([
      { chapter: 27, verses: [{ verse: 1 }, { verse: 2 }] },
    ], reference)
    expect(verses).toHaveLength(2)
  })
})
