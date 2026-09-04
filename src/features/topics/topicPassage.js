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
      if (reference.verseStart === null || reference.verseStart === undefined) return true
      if (chapter !== reference.chapterStart) return false
      return verse.verse >= reference.verseStart && verse.verse <= reference.verseEnd
    })
    .map((verse) => ({ ...verse, chapter })))
}

export async function loadThematicPassage(label, { versionId, signal } = {}) {
  const reference = resolveThematicReference(label)
  if (!reference) throw new Error(`Unknown thematic reference: ${label}`)

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
