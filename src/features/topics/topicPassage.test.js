import { afterEach, describe, expect, it, vi } from 'vitest'
import * as bibleRepository from '../bible/bibleRepository'
import { getThematicChapterNumbers, loadThematicPassage, selectThematicVerses } from './topicPassage'
import { resolveThematicReference } from './topicReference'

describe('thematic passage reading', () => {
  afterEach(() => vi.restoreAllMocks())
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

  it('includes the tail, intermediate chapters and head of a cross-chapter verse range', () => {
    const reference = resolveThematicReference('Éxodo 24:9-26:3')
    const verses = selectThematicVerses([
      { chapter: 23, verses: [{ verse: 10 }] },
      { chapter: 24, verses: [{ verse: 8 }, { verse: 9 }, { verse: 10 }] },
      { chapter: 25, verses: [{ verse: 1 }, { verse: 10 }, { verse: 20 }] },
      { chapter: 26, verses: [{ verse: 1 }, { verse: 2 }, { verse: 3 }, { verse: 4 }] },
      { chapter: 27, verses: [{ verse: 1 }] },
    ], reference)
    expect(verses.map(({ chapter, verse }) => `${chapter}:${verse}`)).toEqual([
      '24:9', '24:10', '25:1', '25:10', '25:20', '26:1', '26:2', '26:3',
    ])
  })

  it('loads a structured cross-chapter reference and passes cancellation to each chapter', async () => {
    const loadChapter = vi.spyOn(bibleRepository, 'loadChapter').mockImplementation(async ({ chapter }) => (
      chapter === 3 ? [{ verse: 25 }, { verse: 26 }, { verse: 27 }] : [{ verse: 1 }, { verse: 7 }, { verse: 8 }]
    ))
    const controller = new AbortController()
    const passage = await loadThematicPassage({
      bookId: 48, book: 'Gálatas', chapterStart: 3, chapterEnd: 4,
      verseStart: 26, verseEnd: 7, label: 'Gál. 3:26–4:7',
    }, { versionId: 'rva2015', signal: controller.signal })
    expect(loadChapter.mock.calls.map(([request]) => request)).toEqual([
      { versionId: 'rva2015', bookId: 48, chapter: 3, signal: controller.signal },
      { versionId: 'rva2015', bookId: 48, chapter: 4, signal: controller.signal },
    ])
    expect(passage.label).toBe('Gálatas 3:26-4:7')
    expect(passage.verses.map(({ chapter, verse }) => `${chapter}:${verse}`)).toEqual(['3:26', '3:27', '4:1', '4:7'])
  })

  it('shows all verses when the topic references a chapter', () => {
    const reference = resolveThematicReference('Salmo 27')
    const verses = selectThematicVerses([
      { chapter: 27, verses: [{ verse: 1 }, { verse: 2 }] },
    ], reference)
    expect(verses).toHaveLength(2)
  })
})
