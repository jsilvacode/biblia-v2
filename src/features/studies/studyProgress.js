import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEY = 'santa-biblia-v2:study:la-fe-de-jesus:v1'
const STUDY_PROGRESS_VERSION = 1
const progressListeners = new Set()

export function createEmptyStudyProgress() {
  return {
    version: STUDY_PROGRESS_VERSION,
    lastLessonSlug: null,
    lastQuestionId: null,
    completedLessonSlugs: [],
    updatedAt: null,
  }
}

function normalizeSlug(value) {
  if (typeof value !== 'string') return null
  const slug = value.trim()
  return slug || null
}

function normalizeQuestionId(value) {
  if (typeof value === 'string') {
    const questionId = value.trim()
    return questionId || null
  }
  return Number.isFinite(value) ? value : null
}

export function normalizeStudyProgress(progress) {
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) {
    return createEmptyStudyProgress()
  }

  const lastLessonSlug = normalizeSlug(progress.lastLessonSlug)
  const completedLessonSlugs = Array.isArray(progress.completedLessonSlugs)
    ? [...new Set(progress.completedLessonSlugs.map(normalizeSlug).filter(Boolean))]
    : []

  return {
    version: STUDY_PROGRESS_VERSION,
    lastLessonSlug,
    lastQuestionId: lastLessonSlug ? normalizeQuestionId(progress.lastQuestionId) : null,
    completedLessonSlugs,
    updatedAt: Number.isFinite(progress.updatedAt) && progress.updatedAt >= 0
      ? progress.updatedAt
      : null,
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

function emitProgress(progress, storage) {
  progressListeners.forEach((listener) => {
    try {
      listener(progress, storage)
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
  if (!targetStorage) return createEmptyStudyProgress()

  try {
    const storedProgress = targetStorage.getItem(STORAGE_KEY)
    return storedProgress
      ? normalizeStudyProgress(JSON.parse(storedProgress))
      : createEmptyStudyProgress()
  } catch {
    return createEmptyStudyProgress()
  }
}

export function writeStudyProgress(progress, storage) {
  const normalizedProgress = normalizeStudyProgress(progress)
  const targetStorage = resolveStorage(storage)

  try {
    targetStorage?.setItem(STORAGE_KEY, JSON.stringify(normalizedProgress))
  } catch {
    // Progress remains usable in memory when storage is unavailable or full.
  }

  emitProgress(normalizedProgress, targetStorage)
  return normalizedProgress
}

export function getStudyProgressSummary(progress, totalLessons = 20) {
  const normalizedProgress = normalizeStudyProgress(progress)
  const normalizedTotal = Number.isFinite(totalLessons)
    ? Math.max(0, Math.trunc(totalLessons))
    : 20
  const completedLessons = Math.min(
    normalizedProgress.completedLessonSlugs.length,
    normalizedTotal,
  )

  return {
    completedLessons,
    totalLessons: normalizedTotal,
    percent: normalizedTotal
      ? Math.round((completedLessons / normalizedTotal) * 100)
      : 0,
    resumeSlug: normalizedProgress.lastLessonSlug,
    hasStarted: Boolean(normalizedProgress.lastLessonSlug || completedLessons),
    isComplete: normalizedTotal > 0 && completedLessons === normalizedTotal,
  }
}

function areProgressValuesEqual(left, right) {
  return left.version === right.version
    && left.lastLessonSlug === right.lastLessonSlug
    && left.lastQuestionId === right.lastQuestionId
    && left.updatedAt === right.updatedAt
    && left.completedLessonSlugs.length === right.completedLessonSlugs.length
    && left.completedLessonSlugs.every((slug, index) => slug === right.completedLessonSlugs[index])
}

export function useStudyProgress(storage) {
  const targetStorage = useMemo(() => resolveStorage(storage), [storage])
  const [progress, setProgress] = useState(() => readStudyProgress(targetStorage))
  const progressRef = useRef(progress)

  useEffect(() => subscribeToProgress((nextProgress, eventStorage) => {
    if (eventStorage !== targetStorage) return
    const normalizedProgress = normalizeStudyProgress(nextProgress)
    if (areProgressValuesEqual(progressRef.current, normalizedProgress)) return
    progressRef.current = normalizedProgress
    setProgress(normalizedProgress)
  }), [targetStorage])

  const commit = useCallback((createNextProgress) => {
    const currentProgress = progressRef.current
    const nextProgress = createNextProgress(currentProgress)
    if (nextProgress === currentProgress || areProgressValuesEqual(currentProgress, nextProgress)) {
      return currentProgress
    }

    progressRef.current = nextProgress
    setProgress(nextProgress)
    writeStudyProgress(nextProgress, targetStorage)
    return nextProgress
  }, [targetStorage])

  const recordPosition = useCallback((slug, questionId) => {
    const lessonSlug = normalizeSlug(slug)
    const normalizedQuestionId = normalizeQuestionId(questionId)
    if (!lessonSlug) return progressRef.current

    return commit((currentProgress) => {
      if (
        currentProgress.lastLessonSlug === lessonSlug
        && currentProgress.lastQuestionId === normalizedQuestionId
      ) {
        return currentProgress
      }

      return {
        ...currentProgress,
        lastLessonSlug: lessonSlug,
        lastQuestionId: normalizedQuestionId,
        updatedAt: Date.now(),
      }
    })
  }, [commit])

  const toggleLessonComplete = useCallback((slug) => {
    const lessonSlug = normalizeSlug(slug)
    if (!lessonSlug) return progressRef.current

    return commit((currentProgress) => {
      const wasCompleted = currentProgress.completedLessonSlugs.includes(lessonSlug)
      return {
        ...currentProgress,
        completedLessonSlugs: wasCompleted
          ? currentProgress.completedLessonSlugs.filter((candidate) => candidate !== lessonSlug)
          : [...currentProgress.completedLessonSlugs, lessonSlug],
        updatedAt: Date.now(),
      }
    })
  }, [commit])

  const isLessonComplete = useCallback((slug) => {
    const lessonSlug = normalizeSlug(slug)
    return Boolean(lessonSlug && progressRef.current.completedLessonSlugs.includes(lessonSlug))
  }, [])

  const summary = useMemo(() => getStudyProgressSummary(progress), [progress])

  return useMemo(() => ({
    progress,
    summary,
    recordPosition,
    toggleLessonComplete,
    isLessonComplete,
  }), [isLessonComplete, progress, recordPosition, summary, toggleLessonComplete])
}
