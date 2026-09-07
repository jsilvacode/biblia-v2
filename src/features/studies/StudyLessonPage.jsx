import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { TopicPassage } from '../topics/TopicPassage.jsx'
import { getLessonAccess, getLessonRequirements, getNextPendingLesson } from './studyAccess'
import { getStudyLesson, loadStudyLesson, studyLessons } from './studyContent'
import { useStudyLessonProgress } from './studyLessonProgress'
import { StudyQuestionCheck } from './StudyQuestionCheck.jsx'
import styles from './Studies.module.css'

const COURSE_PATH = '/studies/la-fe-de-jesus'

function StudyQuestion({ checkpoint, initialCorrectOptionId, initialOpen, lesson, onCorrect, question, recordPosition, sectionTitle }) {
  const { t } = useI18n()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [hasOpened, setHasOpened] = useState(initialOpen)
  const returnTo = `${location.pathname}#${question.id}`

  function handleToggle(event) {
    const nextOpen = event.currentTarget.open
    setIsOpen(nextOpen)
    if (!nextOpen) return
    setHasOpened(true)
    recordPosition(lesson.slug, question.id)
    if (window.location.hash !== `#${question.id}`) {
      window.history.replaceState(window.history.state, '', returnTo)
    }
  }

  return (
    <details className={styles.question} id={question.id} onToggle={handleToggle} open={isOpen}>
      <summary>
        <span aria-hidden="true" className={styles.questionNumber}>{question.number}</span>
        <span>
          <small>{t('studies.question', { number: question.number })}</small>
          <strong>{question.prompt}</strong>
        </span>
        <Icon className={styles.questionChevron} name="chevronDown" size={18} />
      </summary>
      {hasOpened && (
        <div className={styles.questionReadings}>
          {question.references.map((reference) => (
            <TopicPassage
              key={reference}
              label={reference}
              returnSource="study"
              returnTo={returnTo}
              title={`${lesson.title} · ${sectionTitle}`}
            />
          ))}
          {checkpoint && (
            <StudyQuestionCheck
              checkpoint={checkpoint}
              initialCorrectOptionId={initialCorrectOptionId}
              onCorrect={onCorrect}
            />
          )}
        </div>
      )}
    </details>
  )
}

function LessonShell({ children, t }) {
  return (
    <div className={`page ${styles.studyLessonPage}`}>
      <Link className={styles.backLink} to={COURSE_PATH}>
        <Icon name="arrowLeft" size={17} />
        <span>{t('studies.backToCourse')}</span>
      </Link>
      {children}
    </div>
  )
}

export default function StudyLessonPage() {
  const { lessonSlug } = useParams()
  const location = useLocation()
  const { locale, t } = useI18n()
  const {
    completeLesson,
    isPersistent,
    progress,
    recordCorrectAnswer,
    recordPosition,
    setReadingConfirmed,
  } = useStudyLessonProgress()
  const lessonSummary = getStudyLesson(lessonSlug)
  const access = getLessonAccess(lessonSlug, progress, studyLessons)
  const [lessonResult, setLessonResult] = useState({ slug: null, lesson: null, status: 'loading' })
  const [loadAttempt, setLoadAttempt] = useState(0)
  const lesson = lessonResult.slug === lessonSlug ? lessonResult.lesson : null
  const lessonStatus = lessonResult.slug === lessonSlug ? lessonResult.status : 'loading'
  const requestedQuestionId = location.hash ? decodeURIComponent(location.hash.slice(1)) : null
  const knownQuestionIds = useMemo(() => new Set(
    lesson?.sections.flatMap((section) => section.questions.map((question) => question.id)) ?? [],
  ), [lesson])
  const initialQuestionId = requestedQuestionId && knownQuestionIds.has(requestedQuestionId)
    ? requestedQuestionId
    : progress.lastLessonSlug === lessonSlug && knownQuestionIds.has(progress.lastQuestionId)
      ? progress.lastQuestionId
      : null

  useEffect(() => {
    if (!lessonSummary || !access.accessible) return undefined
    let active = true
    loadStudyLesson(lessonSlug)
      .then((loadedLesson) => {
        if (active) setLessonResult({ slug: lessonSlug, lesson: loadedLesson, status: 'ready' })
      })
      .catch(() => {
        if (active) setLessonResult({ slug: lessonSlug, lesson: null, status: 'error' })
      })
    return () => { active = false }
  }, [access.accessible, lessonSlug, lessonSummary, loadAttempt])

  useEffect(() => {
    if (!lesson) return
    recordPosition(lesson.slug, initialQuestionId)
  }, [initialQuestionId, lesson, recordPosition])

  useEffect(() => {
    if (!initialQuestionId) return undefined
    let delayedFrame
    const frame = window.requestAnimationFrame(() => {
      delayedFrame = window.requestAnimationFrame(() => {
        document.getElementById(initialQuestionId)?.scrollIntoView({ block: 'center' })
      })
    })
    return () => {
      window.cancelAnimationFrame(frame)
      if (delayedFrame) window.cancelAnimationFrame(delayedFrame)
    }
  }, [initialQuestionId])

  if (!lessonSummary) return <Navigate replace to={COURSE_PATH} />

  if (!access.accessible) {
    const resumeLesson = getNextPendingLesson(progress, studyLessons) ?? studyLessons[0]
    return (
      <LessonShell t={t}>
        <article className={styles.lockedLesson}>
          <Icon name="lock" size={28} />
          <p className={styles.progressEyebrow}>{t('studies.lessonLocked')}</p>
          <h1>{lessonSummary.title}</h1>
          <p>{t('studies.completeFirst', { number: access.blockingLesson?.order })}</p>
          <Link className={styles.primaryAction} to={`${COURSE_PATH}/${resumeLesson.slug}`}>
            {t('studies.continueStudy')} <Icon name="arrowRight" size={17} />
          </Link>
        </article>
      </LessonShell>
    )
  }

  if (!lesson) {
    return (
      <LessonShell t={t}>
        <article aria-busy={lessonStatus === 'loading'}>
          <header className={styles.lessonHeader}>
            <div className={styles.lessonMeta}><span>{t('studies.lessonNumber', { number: lessonSummary.order })}</span></div>
            <h1>{lessonSummary.title}</h1>
            <p aria-live="polite">{t(lessonStatus === 'error' ? 'studies.loadError' : 'studies.loading')}</p>
            {lessonStatus === 'error' && (
              <button className={styles.retryButton} onClick={() => {
                setLessonResult({ slug: lessonSlug, lesson: null, status: 'loading' })
                setLoadAttempt((attempt) => attempt + 1)
              }} type="button">
                {t('studies.retry')}
              </button>
            )}
          </header>
        </article>
      </LessonShell>
    )
  }

  const isCompleted = progress.completedLessonSlugs.includes(lesson.slug)
  const previousLesson = getStudyLesson(lesson.previous)
  const nextLesson = getStudyLesson(lesson.next)
  const previousAccess = previousLesson
    ? getLessonAccess(previousLesson.slug, progress, studyLessons)
    : null
  const nextAccess = nextLesson ? getLessonAccess(nextLesson.slug, progress, studyLessons) : null
  const checkpointsById = new Map(lesson.checkpoints.map((checkpoint) => [checkpoint.id, checkpoint]))
  const currentLessonProgress = progress.lessonProgress[lesson.slug]
  const correctAnswers = currentLessonProgress?.assessmentRevision === lesson.assessmentRevision
    ? currentLessonProgress.correctAnswers
    : {}
  const requirements = getLessonRequirements(lesson, progress)
  const canComplete = requirements.readingConfirmed && requirements.correctCount === requirements.totalQuestions

  function focusNextPendingQuestion() {
    const pending = lesson.checkpoints.find((checkpoint) => correctAnswers[checkpoint.id] !== checkpoint.correctOptionId)
    if (!pending) return
    const details = document.getElementById(pending.id)
    if (details && !details.open) details.open = true
    recordPosition(lesson.slug, pending.id)
    window.history.replaceState(window.history.state, '', `${location.pathname}#${pending.id}`)
    window.requestAnimationFrame(() => {
      document.querySelector(`#check-${pending.id} legend`)?.focus()
    })
  }

  return (
    <LessonShell t={t}>
      <article>
        <header className={styles.lessonHeader}>
          <div className={styles.lessonMeta}>
            <span>{t('studies.lessonNumber', { number: lesson.order })}</span>
            {locale !== 'es' && <span><Icon name="language" size={13} /> {t('studies.contentLanguage')}</span>}
          </div>
          <h1>{lesson.title}</h1>
          <p>{lesson.summary}</p>
        </header>

        <div className={styles.lessonSections}>
          {lesson.sections.map((section) => (
            <section aria-labelledby={`${section.id}-title`} className={styles.lessonSection} key={section.id}>
              <h2 id={`${section.id}-title`}>{section.title}</h2>
              <div className={styles.questionList}>
                {section.questions.map((question) => (
                  <StudyQuestion
                    checkpoint={checkpointsById.get(question.id)}
                    initialCorrectOptionId={correctAnswers[question.id]}
                    initialOpen={question.id === initialQuestionId}
                    key={question.id}
                    lesson={lesson}
                    onCorrect={(questionId, optionId) => recordCorrectAnswer(lesson, questionId, optionId)}
                    question={question}
                    recordPosition={recordPosition}
                    sectionTitle={section.title}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className={`${styles.completionPanel}${isCompleted ? ` ${styles.isCompleted}` : ''}`}>
          <span aria-hidden="true"><Icon name={isCompleted ? 'checkCircle' : 'graduation'} size={22} /></span>
          <div>
            <strong>{isCompleted ? t('studies.lessonCompleted') : t('studies.finishLesson')}</strong>
            {isCompleted ? (
              <p>{t('studies.reviewKeepsProgress')}</p>
            ) : (
              <>
                <p aria-live="polite">
                  {t('studies.answersCompleted', { completed: requirements.correctCount, total: requirements.totalQuestions })}
                </p>
                {requirements.correctCount < requirements.totalQuestions && (
                  <button className={styles.pendingQuestionButton} onClick={focusNextPendingQuestion} type="button">
                    {t('studies.nextPendingQuestion')}
                  </button>
                )}
                <label className={styles.readingConfirmation}>
                  <input
                    checked={requirements.readingConfirmed}
                    onChange={(event) => setReadingConfirmed(lesson.slug, event.target.checked, lesson.assessmentRevision)}
                    type="checkbox"
                  />
                  <span>{t('studies.readingConfirmation')}</span>
                </label>
                <p className={styles.requirementsMessage}>
                  {canComplete ? t('studies.readyToComplete') : t('studies.missingRequirements')}
                </p>
                <button className={styles.completeButton} disabled={!canComplete} onClick={() => completeLesson(lesson)} type="button">
                  {t('studies.markComplete')}
                </button>
              </>
            )}
          </div>
        </section>
        {!isPersistent && <p className={styles.storageWarning} role="status"><Icon name="circleAlert" size={16} /> {t('studies.storageWarning')}</p>}
      </article>

      <nav aria-label={t('studies.lessons')} className={styles.lessonNavigation}>
        {previousLesson && previousAccess?.accessible ? (
          <Link to={`${COURSE_PATH}/${previousLesson.slug}`}>
            <Icon name="arrowLeft" size={17} />
            <span><small>{t('studies.previousLesson')}</small><strong>{previousLesson.title}</strong></span>
          </Link>
        ) : <span />}
        {nextLesson ? nextAccess?.accessible ? (
          <Link to={`${COURSE_PATH}/${nextLesson.slug}`}>
            <span><small>{t('studies.nextLesson')}</small><strong>{nextLesson.title}</strong></span>
            <Icon name="arrowRight" size={17} />
          </Link>
        ) : (
          <div className={styles.lockedNavigation}>
            <span><small>{t('studies.nextLesson')}</small><strong>{t('studies.completeCurrentFirst')}</strong></span>
            <Icon name="lock" size={17} />
          </div>
        ) : (
          <Link to={COURSE_PATH}>
            <span><small>{t('common.back')}</small><strong>{progress.courseCompletedAt ? t('studies.courseCompleted') : t('studies.title')}</strong></span>
            <Icon name="arrowRight" size={17} />
          </Link>
        )}
      </nav>
    </LessonShell>
  )
}
