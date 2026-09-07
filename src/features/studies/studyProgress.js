import { useEffect, useMemo, useRef, useState } from 'react'
import manifest from '../../content/la-fe-de-jesus/manifest.json'

const STORAGE_KEY = 'santa-biblia-v2:study:la-fe-de-jesus:v1'
const STUDY_PROGRESS_VERSION = 2
const validLessonSlugs = new Set(manifest.map((lesson) => lesson.slug))
const studyCatalog = manifest.map((lesson) => ({ order: lesson.id, slug: lesson.slug }))
const progressListeners = new Set()
const memoryByStorage = new WeakMap()
const nonPersistentStorages = new WeakSet()
let fallbackMemory = null

export function createEmptyStudyProgress() {
  return {
    version: STUDY_PROGRESS_VERSION,
    lastLessonSlug: null,
    lastQuestionId: null,
    completedLessonSlugs: [],
    courseCompletedAt: null,
    lessonProgress: {},
    updatedAt: null,
  }
}

function normalizeSlug(value) {
  if (typeof value !== 'string') return null
  const slug = value.trim()
  return validLessonSlugs.has(slug) ? slug : null
}

function normalizeQuestionId(value) {
  if (typeof value !== 'string') return null
  const questionId = value.trim()
  return questionId || null
}

function normalizeTimestamp(value) {
  return Number.isFinite(value) && value >= 0 ? value : null
}

function normalizeLessonProgress(progress) {
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) return {}
  return Object.fromEntries(Object.entries(progress).flatMap(([slug, value]) => {
    if (!validLessonSlugs.has(slug) || !value || typeof value !== 'object' || Array.isArray(value)) return []
    const assessmentRevision = Number.isInteger(value.assessmentRevision) && value.assessmentRevision > 0
      ? value.assessmentRevision
      : 1
    const correctAnswers = value.correctAnswers && typeof value.correctAnswers === 'object'
      && !Array.isArray(value.correctAnswers)
      ? Object.fromEntries(Object.entries(value.correctAnswers).filter(([questionId, optionId]) => (
        typeof questionId === 'string' && questionId && typeof optionId === 'string' && optionId
      )))
      : {}
    return [[slug, {
      assessmentRevision,
      correctAnswers,
      readingConfirmed: Boolean(value.readingConfirmed),
    }]]
  }))
}

export function normalizeStudyProgress(progress, now = Date.now()) {
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) {
    return createEmptyStudyProgress()
  }

  const lastLessonSlug = normalizeSlug(progress.lastLessonSlug)
  const completedLessonSlugs = Array.isArray(progress.completedLessonSlugs)
    ? [...new Set(progress.completedLessonSlugs.map(normalizeSlug).filter(Boolean))]
    : []
  const allCompleted = studyCatalog.every((lesson) => completedLessonSlugs.includes(lesson.slug))

  return {
    version: STUDY_PROGRESS_VERSION,
    lastLessonSlug,
    lastQuestionId: lastLessonSlug ? normalizeQuestionId(progress.lastQuestionId) : null,
    completedLessonSlugs,
    courseCompletedAt: normalizeTimestamp(progress.courseCompletedAt)
      ?? (allCompleted ? normalizeTimestamp(progress.updatedAt) ?? now : null),
    lessonProgress: normalizeLessonProgress(progress.lessonProgress),
    updatedAt: normalizeTimestamp(progress.updatedAt),
  }
}

function resolveStorage(storage) {
  if (storage !== undefined) return storage
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function getMemoryProgress(storage) {
  return storage && typeof storage === 'object' ? memoryByStorage.get(storage) : fallbackMemory
}

function setMemoryProgress(storage, progress) {
  if (storage && typeof storage === 'object') memoryByStorage.set(storage, progress)
  else fallbackMemory = progress
}

function emitProgress(progress, storage, persistent = true) {
  progressListeners.forEach((listener) => {
    try {
      listener(progress, storage, persistent)
    } catch {
      // A failed subscriber must not prevent the remaining instances from syncing.
    }
  })
}

function subscribeToProgress(listener) {
  progressListeners.add(listener)
  return () => progressListeners.delete(listener)
}

export function readStudyProgress(storage) {
  const targetStorage = resolveStorage(storage)
  try {
    const storedProgress = targetStorage?.getItem(STORAGE_KEY)
    const storedOrEmpty = storedProgress
      ? normalizeStudyProgress(JSON.parse(storedProgress))
      : createEmptyStudyProgress()
    const memoryProgress = getMemoryProgress(targetStorage)
    const progress = targetStorage && nonPersistentStorages.has(targetStorage) && memoryProgress
      ? mergeStudyProgress(storedOrEmpty, memoryProgress)
      : storedProgress ? storedOrEmpty : memoryProgress ?? storedOrEmpty
    setMemoryProgress(targetStorage, progress)
    return progress
  } catch {
    if (targetStorage && typeof targetStorage === 'object') nonPersistentStorages.add(targetStorage)
    return getMemoryProgress(targetStorage) ?? createEmptyStudyProgress()
  }
}

export function mergeStudyProgress(left, right) {
  const first = normalizeStudyProgress(left)
  const second = normalizeStudyProgress(right)
  const latest = (second.updatedAt ?? -1) >= (first.updatedAt ?? -1) ? second : first
  const completedLessonSlugs = [...new Set([
    ...first.completedLessonSlugs,
    ...second.completedLessonSlugs,
  ])]
  const lessonProgress = { ...first.lessonProgress }
  const secondIsLatest = latest === second

  for (const [slug, incoming] of Object.entries(second.lessonProgress)) {
    const current = lessonProgress[slug]
    if (!current || current.assessmentRevision !== incoming.assessmentRevision) {
      if (!current) lessonProgress[slug] = incoming
      else {
        const newerRevision = incoming.assessmentRevision > current.assessmentRevision
          ? incoming
          : current
        lessonProgress[slug] = {
          ...newerRevision,
          readingConfirmed: current.readingConfirmed || incoming.readingConfirmed,
        }
      }
      continue
    }
    lessonProgress[slug] = {
      assessmentRevision: current.assessmentRevision,
      correctAnswers: { ...current.correctAnswers, ...incoming.correctAnswers },
      readingConfirmed: secondIsLatest ? incoming.readingConfirmed : current.readingConfirmed,
    }
  }

  return normalizeStudyProgress({
    ...latest,
    completedLessonSlugs,
    courseCompletedAt: first.courseCompletedAt ?? second.courseCompletedAt,
    lessonProgress,
    updatedAt: Math.max(first.updatedAt ?? 0, second.updatedAt ?? 0) || null,
  })
}

export function writeStudyProgress(progress, storage) {
  const targetStorage = resolveStorage(storage)
  let normalizedProgress = normalizeStudyProgress(progress)
  let persistent = Boolean(targetStorage)

  try {
    const storedProgress = targetStorage?.getItem(STORAGE_KEY)
    if (storedProgress) normalizedProgress = mergeStudyProgress(JSON.parse(storedProgress), normalizedProgress)
    targetStorage?.setItem(STORAGE_KEY, JSON.stringify(normalizedProgress))
    if (targetStorage && typeof targetStorage === 'object') nonPersistentStorages.delete(targetStorage)
  } catch {
    persistent = false
    if (targetStorage && typeof targetStorage === 'object') nonPersistentStorages.add(targetStorage)
  }

  setMemoryProgress(targetStorage, normalizedProgress)
  emitProgress(normalizedProgress, targetStorage, persistent)
  return normalizedProgress
}

export function getStudyProgressSummary(progress, totalLessons = studyCatalog.length) {
  const normalizedProgress = normalizeStudyProgress(progress)
  const normalizedTotal = Number.isFinite(totalLessons)
    ? Math.max(0, Math.trunc(totalLessons))
    : studyCatalog.length
  const completedLessons = Math.min(normalizedProgress.completedLessonSlugs.length, normalizedTotal)

  return {
    completedLessons,
    totalLessons: normalizedTotal,
    percent: normalizedTotal ? Math.round((completedLessons / normalizedTotal) * 100) : 0,
    resumeSlug: normalizedProgress.lastLessonSlug,
    hasStarted: Boolean(normalizedProgress.lastLessonSlug || completedLessons),
    isComplete: normalizedTotal > 0 && Boolean(normalizedProgress.courseCompletedAt),
  }
}

function areProgressValuesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function useStudyProgress(storage) {
  const targetStorage = useMemo(() => resolveStorage(storage), [storage])
  const [progress, setProgress] = useState(() => readStudyProgress(targetStorage))
  const [isPersistent, setIsPersistent] = useState(Boolean(
    targetStorage && !nonPersistentStorages.has(targetStorage),
  ))
  const progressRef = useRef(progress)

  useEffect(() => subscribeToProgress((nextProgress, eventStorage, persistent) => {
    if (eventStorage !== targetStorage) return
    const normalizedProgress = normalizeStudyProgress(nextProgress)
    setIsPersistent(persistent)
    if (areProgressValuesEqual(progressRef.current, normalizedProgress)) return
    progressRef.current = normalizedProgress
    setProgress(normalizedProgress)
  }), [targetStorage])

  useEffect(() => {
    if (typeof window === 'undefined' || targetStorage !== window.localStorage) return undefined
    function handleStorage(event) {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const nextProgress = mergeStudyProgress(progressRef.current, JSON.parse(event.newValue))
        if (areProgressValuesEqual(progressRef.current, nextProgress)) return
        progressRef.current = nextProgress
        setProgress(nextProgress)
      } catch {
        // Ignore corrupt writes from another tab.
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [targetStorage])

  const summary = useMemo(() => getStudyProgressSummary(progress), [progress])

  return useMemo(() => ({ isPersistent, progress, summary }), [isPersistent, progress, summary])
}
