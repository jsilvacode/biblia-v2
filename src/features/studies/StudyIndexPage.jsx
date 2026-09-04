import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { PageIntro } from '../../components/ui/PageIntro'
import { useI18n } from '../../i18n'
import { getStudyLesson, studyLessons } from './studyContent'
import { useStudyProgress } from './studyProgress'
import styles from './Studies.module.css'

const COURSE_PATH = '/studies/la-fe-de-jesus'
const OFFICIAL_SOURCE = 'https://downloads.adventistas.org/es/ministerio-personal/estudios-biblicos/guia-interactiva-la-fe-de-jesus/'

function getLessonStatus(lesson, progress) {
  if (progress.completedLessonSlugs.includes(lesson.slug)) return 'completed'
  if (progress.lastLessonSlug === lesson.slug) return 'inProgress'
  return 'notStarted'
}

export default function StudyIndexPage() {
  const { locale, t } = useI18n()
  const { progress, summary } = useStudyProgress()
  const resumeLesson = getStudyLesson(summary.resumeSlug) ?? studyLessons[0]
  const resumeQuestion = progress.lastLessonSlug === resumeLesson.slug ? progress.lastQuestionId : null
  const resumePath = `${COURSE_PATH}/${resumeLesson.slug}${resumeQuestion ? `#${resumeQuestion}` : ''}`

  return (
    <div className={`page ${styles.studyIndexPage}`}>
      <PageIntro eyebrow={t('studies.eyebrow')} title={t('studies.title')}>
        {t('studies.subtitle')}
      </PageIntro>

      {locale !== 'es' && <p className={styles.languageNotice}><Icon name="language" size={15} /> {t('studies.contentLanguage')}</p>}

      <section aria-labelledby="study-progress-title" className={styles.courseProgress}>
        <div className={styles.progressCopy}>
          <span aria-hidden="true" className={styles.progressIcon}><Icon name="graduation" size={22} /></span>
          <span>
            <span className={styles.progressEyebrow} id="study-progress-title">{t('studies.progress')}</span>
            <strong>{t('studies.progressCount', { completed: summary.completedLessons, total: summary.totalLessons })}</strong>
          </span>
          <small>{t('studies.progressPercent', { percent: summary.percent })}</small>
        </div>
        <div
          aria-label={t('studies.progressPercent', { percent: summary.percent })}
          aria-valuemax="100"
          aria-valuemin="0"
          aria-valuenow={summary.percent}
          className={styles.progressTrack}
          role="progressbar"
        >
          <span style={{ width: `${summary.percent}%` }} />
        </div>
        <Link className={styles.primaryAction} to={resumePath}>
          <span>{summary.hasStarted ? t('studies.continueStudy') : t('studies.startStudy')}</span>
          <Icon name="arrowRight" size={17} />
        </Link>
      </section>

      <section aria-labelledby="study-lessons-title" className={styles.lessonIndex}>
        <div className={styles.sectionHeading}>
          <h2 id="study-lessons-title">{t('studies.lessons')}</h2>
          <span>{studyLessons.length}</span>
        </div>
        <ol className={styles.lessonList}>
          {studyLessons.map((lesson) => {
            const status = getLessonStatus(lesson, progress)
            const returnQuestion = progress.lastLessonSlug === lesson.slug ? progress.lastQuestionId : null
            const path = `${COURSE_PATH}/${lesson.slug}${returnQuestion ? `#${returnQuestion}` : ''}`
            return (
              <li key={lesson.slug}>
                <Link className={styles.lessonCard} to={path}>
                  <span aria-hidden="true" className={styles.lessonNumber}>{String(lesson.order).padStart(2, '0')}</span>
                  <span className={styles.lessonCopy}>
                    <strong>{lesson.title}</strong>
                    <small>{lesson.summary}</small>
                  </span>
                  <span className={`${styles.statusLabel} ${styles[status]}`}>
                    {status === 'completed' && <Icon name="checkCircle" size={14} />}
                    {t(`studies.${status}`)}
                  </span>
                  <Icon className={styles.lessonArrow} name="chevronRight" size={18} />
                </Link>
              </li>
            )
          })}
        </ol>
      </section>

      <aside className={styles.credits}>
        <span aria-hidden="true"><Icon name="info" size={18} /></span>
        <div>
          <p className={styles.progressEyebrow}>{t('studies.sourceEyebrow')}</p>
          <h2>{t('studies.sourceTitle')}</h2>
          <p>{t('studies.sourceNote')}</p>
          <a href={OFFICIAL_SOURCE} rel="noopener noreferrer" target="_blank">
            {t('studies.officialSource')} <Icon name="externalLink" size={14} />
          </a>
        </div>
      </aside>
    </div>
  )
}
