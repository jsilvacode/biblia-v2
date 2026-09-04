import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { TopicPassage } from '../topics/TopicPassage.jsx'
import { getStudyLesson } from './studyContent'
import { useStudyProgress } from './studyProgress'
import styles from './Studies.module.css'

const COURSE_PATH = '/studies/la-fe-de-jesus'

function StudyQuestion({ initialOpen, lesson, question, recordPosition, sectionTitle }) {
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
        </div>
      )}
    </details>
  )
}

export default function StudyLessonPage() {
  const { lessonSlug } = useParams()
  const location = useLocation()
  const { locale, t } = useI18n()
  const { progress, recordPosition, toggleLessonComplete } = useStudyProgress()
  const lesson = getStudyLesson(lessonSlug)
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

  if (!lesson) return <Navigate replace to={COURSE_PATH} />

  const isCompleted = progress.completedLessonSlugs.includes(lesson.slug)
  const previousLesson = getStudyLesson(lesson.previous)
  const nextLesson = getStudyLesson(lesson.next)

  return (
    <div className={`page ${styles.studyLessonPage}`}>
      <Link className={styles.backLink} to={COURSE_PATH}>
        <Icon name="arrowLeft" size={17} />
        <span>{t('studies.backToCourse')}</span>
      </Link>

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
                    initialOpen={question.id === initialQuestionId}
                    key={question.id}
                    lesson={lesson}
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
            <strong>{isCompleted ? t('studies.lessonCompleted') : t('studies.lessonNumber', { number: lesson.order })}</strong>
            <button onClick={() => toggleLessonComplete(lesson.slug)} type="button">
              {isCompleted ? t('studies.markIncomplete') : t('studies.markComplete')}
            </button>
          </div>
        </section>
      </article>

      <nav aria-label={t('studies.lessons')} className={styles.lessonNavigation}>
        {previousLesson ? (
          <Link to={`${COURSE_PATH}/${previousLesson.slug}`}>
            <Icon name="arrowLeft" size={17} />
            <span><small>{t('studies.previousLesson')}</small><strong>{previousLesson.title}</strong></span>
          </Link>
        ) : <span />}
        {nextLesson ? (
          <Link to={`${COURSE_PATH}/${nextLesson.slug}`}>
            <span><small>{t('studies.nextLesson')}</small><strong>{nextLesson.title}</strong></span>
            <Icon name="arrowRight" size={17} />
          </Link>
        ) : <Link to={COURSE_PATH}><span><small>{t('common.back')}</small><strong>{t('studies.title')}</strong></span><Icon name="arrowRight" size={17} /></Link>}
      </nav>
    </div>
  )
}
