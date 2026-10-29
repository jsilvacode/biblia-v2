import { loadChapter } from '../bible/bibleRepository'
import { formatThematicReference, resolveThematicReference } from './topicReference'

export function getThematicChapterNumbers(reference) {
  if (!reference) return []
  return Array.from(
    { length: reference.chapterEnd - reference.chapterStart + 1 },
    (_, index) => reference.chapterStart + index,
  )
}

export function selectThematicVerses(chapters, reference) {
  if (!reference) return []
  return chapters.flatMap(({ chapter, verses }) => verses
    .filter((verse) => {
      if (chapter < reference.chapterStart || chapter > reference.chapterEnd) return false
      if (reference.verseStart === null || reference.verseStart === undefined) return true
      if (chapter === reference.chapterStart && verse.verse < reference.verseStart) return false
      if (chapter === reference.chapterEnd && verse.verse > reference.verseEnd) return false
      return true
    })
    .map((verse) => ({ ...verse, chapter })))
}

export async function loadThematicPassage(value, { versionId, signal } = {}) {
  const reference = resolveThematicReference(value)
  if (!reference) throw new Error(`Unknown thematic reference: ${typeof value === 'string' ? value : value?.label}`)

  const chapters = await Promise.all(getThematicChapterNumbers(reference).map(async (chapter) => ({
    chapter,
    verses: await loadChapter({ versionId, bookId: reference.book, chapter, signal }),
  })))

  return {
    reference,
    label: formatThematicReference(reference),
    verses: selectThematicVerses(chapters, reference),
  }
}
