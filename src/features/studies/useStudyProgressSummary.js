import { useEffect, useState } from 'react'
import manifest from '../../content/la-fe-de-jesus/manifest.json'

const STORAGE_KEY = 'santa-biblia-v2:study:la-fe-de-jesus:v1'
const validSlugs = new Set(manifest.map((lesson) => lesson.slug))

export function readStudyProgressSummary(storage = window.localStorage) {
  let stored
  try {
    stored = JSON.parse(storage.getItem(STORAGE_KEY) || '{}')
  } catch {
    stored = {}
  }
  const completedLessons = new Set(
    Array.isArray(stored.completedLessonSlugs)
      ? stored.completedLessonSlugs.filter((slug) => validSlugs.has(slug))
      : [],
  ).size
  const totalLessons = manifest.length
  return {
    completedLessons,
    hasStarted: completedLessons > 0 || validSlugs.has(stored.lastLessonSlug),
    percent: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
    totalLessons,
  }
}

export function useStudyProgressSummary() {
  const [summary, setSummary] = useState(readStudyProgressSummary)

  useEffect(() => {
    function handleStorage(event) {
      if (event.key === STORAGE_KEY) setSummary(readStudyProgressSummary())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return summary
}
