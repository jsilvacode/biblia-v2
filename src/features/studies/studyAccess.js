function completedSet(progress) {
  return new Set(progress?.completedLessonSlugs ?? [])
}

export function getNextPendingLesson(progress, catalog) {
  const completed = completedSet(progress)
  return catalog.find((lesson) => !completed.has(lesson.slug)) ?? null
}

export function getLessonAccess(slug, progress, catalog) {
  const lesson = catalog.find((candidate) => candidate.slug === slug)
  if (!lesson) return { accessible: false, blockingLesson: null, lesson: null, status: 'missing' }

  const completed = completedSet(progress)
  if (progress?.courseCompletedAt || completed.has(slug)) {
    return { accessible: true, blockingLesson: null, lesson, status: 'completed' }
  }

  const firstPending = getNextPendingLesson(progress, catalog)
  if (firstPending?.slug === slug) {
    return { accessible: true, blockingLesson: null, lesson, status: 'available' }
  }

  return { accessible: false, blockingLesson: firstPending, lesson, status: 'locked' }
}

export function getLessonRequirements(lesson, progress) {
  const lessonProgress = progress?.lessonProgress?.[lesson.slug]
  const checkpoints = lesson.checkpoints ?? []
  const correctAnswers = lessonProgress?.assessmentRevision === lesson.assessmentRevision
    ? lessonProgress.correctAnswers ?? {}
    : {}
  const correctCount = checkpoints.filter((checkpoint) => (
    correctAnswers[checkpoint.id] === checkpoint.correctOptionId
  )).length

  return {
    correctCount,
    readingConfirmed: Boolean(lessonProgress?.readingConfirmed),
    totalQuestions: checkpoints.length,
  }
}

export function canCompleteLesson(lesson, progress, catalog) {
  if (completedSet(progress).has(lesson.slug)) return true
  if (!getLessonAccess(lesson.slug, progress, catalog).accessible) return false
  const requirements = getLessonRequirements(lesson, progress)
  return requirements.readingConfirmed
    && requirements.totalQuestions === 3
    && requirements.correctCount === requirements.totalQuestions
}

export function completeLessonProgress(lesson, progress, catalog, completedAt = Date.now()) {
  if (completedSet(progress).has(lesson.slug)) return progress
  if (!canCompleteLesson(lesson, progress, catalog)) return progress

  const completedLessonSlugs = [...new Set([...progress.completedLessonSlugs, lesson.slug])]
    .filter((slug) => catalog.some((candidate) => candidate.slug === slug))
  const allCompleted = catalog.every((candidate) => completedLessonSlugs.includes(candidate.slug))

  return {
    ...progress,
    completedLessonSlugs,
    courseCompletedAt: progress.courseCompletedAt ?? (allCompleted ? completedAt : null),
    updatedAt: completedAt,
  }
}
