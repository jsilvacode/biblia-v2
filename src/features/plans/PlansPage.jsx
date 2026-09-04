import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageIntro } from '../../components/ui/PageIntro'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { formatReference } from '../bible/catalog'
import { getRpspPlanState, getRpspReadingWindow } from './rpsp2026'
import styles from './PlansPage.module.css'

function formatReadingDate(date, locale) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(date)
}

export default function PlansPage() {
  const { locale, t } = useI18n()
  const planState = useMemo(() => getRpspPlanState(new Date()), [])
  const { reading, status } = planState
  const readingLabel = formatReference(reading, locale)
  const progress = status === 'upcoming' ? 0 : status === 'completed' ? 100 : Math.round((reading.day / reading.total) * 100)
  const readingWindow = getRpspReadingWindow(reading.day, 7)

  return (
    <div className={`page ${styles.plansPage}`}>
      <PageIntro title={t('plans.title')}>
        {t('plans.subtitle')}
      </PageIntro>

      <article className={styles.featuredPlan}>
        <div className={styles.planArt} aria-hidden="true"><Icon name="bookOpen" size={28} /></div>
        <div className={styles.planCopy}>
          <p className="eyebrow">{t(`plans.${status}`)}</p>
          <h2>{readingLabel}</h2>
          <div className={styles.progressMeta}>
            <span>{t('plans.day', { day: reading.day, total: reading.total })}</span>
            <span>{progress}%</span>
          </div>
          <div
            aria-label={t('plans.progressLabel', { progress })}
            aria-valuemax="100"
            aria-valuemin="0"
            aria-valuenow={progress}
            className={styles.progressTrack}
            role="progressbar"
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        <Link className="button" to={`/read/${reading.book}/${reading.chapter}`}>
          {t('plans.openReading')} <Icon name="arrowRight" size={18} />
        </Link>
      </article>

      <section className={styles.schedule} aria-labelledby="schedule-title">
        <div className={styles.sectionHeading}>
          <h2 id="schedule-title">{t('plans.nextReadings')}</h2>
          <span>2026</span>
        </div>
        <div className={styles.readingList}>
          {readingWindow.map((item, index) => (
            <Link className={`${styles.readingRow} ${index === 0 ? styles.currentReading : ''}`} key={item.day} to={`/read/${item.book}/${item.chapter}`}>
              <span className={styles.dayNumber}>{item.day}</span>
              <span>
                <strong>{formatReference(item, locale)}</strong>
                <small>{formatReadingDate(item.date, locale)}</small>
              </span>
              {index === 0 && status === 'active' ? <span className={styles.todayBadge}>{t('common.today')}</span> : <Icon name="chevronRight" size={18} />}
            </Link>
          ))}
        </div>
      </section>

      <p className={styles.sourceNote}>{t('plans.sourceNote')}</p>
    </div>
  )
}
