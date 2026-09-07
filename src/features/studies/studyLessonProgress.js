import { useCallback, useMemo } from 'react'
import manifest from '../../content/la-fe-de-jesus/manifest.json'
import { completeLessonProgress } from './studyAccess'
import {
  mergeStudyProgress,
  normalizeStudyProgress,
  readStudyProgress,
  useStudyProgress,
  writeStudyProgress,
} from './studyProgress'

const studyCatalog = manifest.map((lesson) => ({ order: lesson.id, slug: lesson.slug }))
const validLessonSlugs = new Set(studyCatalog.map((lesson) => lesson.slug))

function sameProgress(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function useStudyLessonProgress(storage) {
  const state = useStudyProgress(storage)
  const { progress } = state

  const commit = useCallback((createNextProgress) => {
    const currentProgress = mergeStudyProgress(progress, readStudyProgress(storage))
    const nextProgress = normalizeStudyProgress(createNextProgress(currentProgress))
    if (sameProgress(currentProgress, nextProgress)) return currentProgress
    return writeStudyProgress(nextProgress, storage)
  }, [progress, storage])

  const recordPosition = useCallback((slug, questionId) => {
    const lessonSlug = typeof slug === 'string' && validLessonSlugs.has(slug.trim()) ? slug.trim() : null
    const normalizedQuestionId = typeof questionId === 'string' && questionId.trim() ? questionId.trim() : null
    if (!lessonSlug) return progress
    return commit((currentProgress) => (
      currentProgress.lastLessonSlug === lessonSlug
        && currentProgress.lastQuestionId === normalizedQuestionId
        ? currentProgress
        : {
          ...currentProgress,
          lastLessonSlug: lessonSlug,
          lastQuestionId: normalizedQuestionId,
          updatedAt: Date.now(),
        }
    ))
  }, [commit, progress])

  const setReadingConfirmed = useCallback((slug, readingConfirmed, assessmentRevision = 1) => {
    const lessonSlug = typeof slug === 'string' && validLessonSlugs.has(slug.trim()) ? slug.trim() : null
    if (!lessonSlug) return progress
    return commit((currentProgress) => {
      const current = currentProgress.lessonProgress[lessonSlug]
      if (current?.readingConfirmed === Boolean(readingConfirmed)
        && current.assessmentRevision === assessmentRevision) return currentProgress
      return {
        ...currentProgress,
        lessonProgress: {
          ...currentProgress.lessonProgress,
          [lessonSlug]: {
            assessmentRevision,
            correctAnswers: current?.assessmentRevision === assessmentRevision
              ? current.correctAnswers
              : {},
            readingConfirmed: Boolean(readingConfirmed),
          },
        },
        updatedAt: Date.now(),
      }
    })
  }, [commit, progress])

  const recordCorrectAnswer = useCallback((lesson, questionId, optionId) => commit((currentProgress) => {
    const checkpoint = lesson.checkpoints?.find((candidate) => candidate.id === questionId)
    if (!checkpoint || checkpoint.correctOptionId !== optionId) return currentProgress
    const current = currentProgress.lessonProgress[lesson.slug]
    const correctAnswers = current?.assessmentRevision === lesson.assessmentRevision
      ? current.correctAnswers
      : {}
    if (correctAnswers[questionId] === optionId) return currentProgress
    return {
      ...currentProgress,
      lessonProgress: {
        ...currentProgress.lessonProgress,
        [lesson.slug]: {
          assessmentRevision: lesson.assessmentRevision,
          correctAnswers: { ...correctAnswers, [questionId]: optionId },
          readingConfirmed: Boolean(current?.readingConfirmed),
        },
      },
      updatedAt: Date.now(),
    }
  }), [commit])

  const completeLesson = useCallback((lesson) => commit((currentProgress) => (
    completeLessonProgress(lesson, currentProgress, studyCatalog)
  )), [commit])

  return useMemo(() => ({
    ...state,
    completeLesson,
    recordCorrectAnswer,
    recordPosition,
    setReadingConfirmed,
  }), [completeLesson, recordCorrectAnswer, recordPosition, setReadingConfirmed, state])
}
