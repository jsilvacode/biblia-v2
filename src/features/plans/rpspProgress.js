export const RPSP_PROGRESS_STORAGE_KEY = 'santa_biblia_v2_rpsp'

function sameReference(first, second) {
  return first?.book === second?.book && first?.chapter === second?.chapter
}

function isProgress(value) {
  return value
    && value.schemaVersion === 1
    && typeof value.date === 'string'
    && Number.isInteger(value.reference?.book)
    && Number.isInteger(value.reference?.chapter)
    && (value.verse === null || Number.isInteger(value.verse))
    && Number.isFinite(value.scrollProgress)
    && Number.isFinite(value.audioPosition)
    && Number.isFinite(value.updatedAt)
}

export function readRpspProgress() {
  try {
    const value = JSON.parse(window.localStorage.getItem(RPSP_PROGRESS_STORAGE_KEY) ?? 'null')
    return isProgress(value) ? value : null
  } catch {
    return null
  }
}

export function readRpspProgressForReading({ date, reference }) {
  const progress = readRpspProgress()
  return progress?.date === date && sameReference(progress.reference, reference) ? progress : null
}

export function saveRpspProgress({ date, reference, verse = null, scrollProgress = 0, audioPosition = 0 }) {
  if (typeof window === 'undefined' || !date || !Number.isInteger(reference?.book) || !Number.isInteger(reference?.chapter)) return null

  const previous = readRpspProgressForReading({ date, reference })
  const next = {
    schemaVersion: 1,
    date,
    reference: { book: reference.book, chapter: reference.chapter },
    verse: Number.isInteger(verse) ? verse : previous?.verse ?? null,
    scrollProgress: Math.max(0, Math.min(100, Math.round(Number(scrollProgress) || 0))),
    audioPosition: Math.max(0, Math.round(Number(audioPosition) || 0)),
    updatedAt: Date.now(),
  }

  try {
    window.localStorage.setItem(RPSP_PROGRESS_STORAGE_KEY, JSON.stringify(next))
    return next
  } catch {
    return null
  }
}
