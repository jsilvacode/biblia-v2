import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { EditorialIllustration } from '../../components/ui/EditorialIllustration'
import { useI18n } from '../../i18n'
import { formatReference, getVersion } from '../bible/catalog'
import { InstallInvitation } from '../install/InstallInvitation'
import { getRpspPlanState } from '../plans/rpsp2026'
import { getLocalRpspDate } from '../plans/rpspDate'
import { readRpspProgressForReading } from '../plans/rpspProgress'
import { useReadingState } from '../reading/ReadingProvider'
import { createVerseShareData, createVerseShareUrl, shareVerse } from '../reader/shareVerse'
import { useSettings } from '../settings/SettingsProvider'
import { useStudyProgressSummary } from '../studies/useStudyProgressSummary'
import { preloadReading } from '../reader/preloadReading'
import { formatPromiseReference } from './dailyPromise'
import { HomeHeader } from './HomeHeader'
import { HomeDailyVideo } from './HomeDailyVideo'
import { HomeLandscape } from './HomeLandscape'
import { HomePassagePicker } from './HomePassagePicker'
import { HomeQuickSearch } from './HomeQuickSearch'
import { useDailyPromise } from './useDailyPromise'
import styles from './HomePage.module.css'

const interestLinks = [
  {
    descriptionKey: 'home.interestDailyVideoDescription',
    image: 'este-dia-con-dios.png',
    label: 'Este Día con Dios',
    url: 'https://estediacondios.com/',
  },
  {
    descriptionKey: 'home.interestBibleStudyDescription',
    image: 'estudie-la-biblia.svg',
    label: 'Estudie la Biblia',
    url: 'https://estudielabiblia.com/',
  },
  {
    descriptionKey: 'home.interestSabbathSchoolDescription',
    image: 'escuela-sabatica.svg',
    label: 'Escuela Sabática',
    url: 'https://escuelasabatica.cl/',
  },
  {
    descriptionKey: 'home.interestBibleDialogueDescription',
    image: 'dialogo-biblico.png',
    label: 'Diálogo Bíblico',
    url: 'https://www.youtube.com/playlist?list=PLn19CCwh0uJwsZM3-89oEGdorLikq9hFS',
  },
]

function getReaderPath(reference) {
  return `/read/${reference.book}/${reference.chapter}${reference.verse ? `/${reference.verse}` : ''}`
}

export default function HomePage() {
  const { locale, t } = useI18n()
  const { lastRead, recentReadings } = useReadingState()
  const { settings } = useSettings()
  const studySummary = useStudyProgressSummary()
  const navigate = useNavigate()
  const { promise, status: promiseStatus, text: promiseText } = useDailyPromise(settings.bibleVersion)
  const [promiseFeedback, setPromiseFeedback] = useState('')
  const hasReadingHistory = Boolean(lastRead.updatedAt)
  const version = getVersion(settings.bibleVersion)
  const dailyPlan = getRpspPlanState(new Date())
  const dailyReference = formatReference(dailyPlan.reading, locale)
  const dailyProgress = dailyPlan.status === 'active'
    ? readRpspProgressForReading({ date: getLocalRpspDate(), reference: dailyPlan.reading })
    : null
  const promiseReference = formatPromiseReference(promise, locale)
  const promisePath = promise ? getReaderPath({
    book: promise.reference.book,
    chapter: promise.reference.chapter,
    verse: promise.reference.verseStart,
  }) : '/bible'
  const visiblePromiseText = promiseText || (promiseStatus === 'error' ? t('home.promiseUnavailable') : t('home.promiseLoading'))
  const heroQuoteClassName = visiblePromiseText.length > 220 ? styles.heroQuoteExtended
    : visiblePromiseText.length > 170 ? styles.heroQuoteLong : undefined

  useEffect(() => {
    if (!promiseFeedback) return undefined
    const timeout = window.setTimeout(() => setPromiseFeedback(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [promiseFeedback])

  function readingIntentProps(reference) {
    return {
      onFocus: () => preloadReading(reference, settings.bibleVersion),
      onPointerDown: () => preloadReading(reference, settings.bibleVersion),
    }
  }

  function goToReading(book, chapter, verse = null) {
    const reference = { book, chapter, verse }
    preloadReading(reference, settings.bibleVersion)
    navigate(getReaderPath(reference), { state: verse ? { attentionVerse: true } : undefined })
  }

  async function handlePromiseShare() {
    if (!promise || promiseStatus !== 'ready' || !promiseText) return
    const data = createVerseShareData({
      reference: promiseReference,
      text: promiseText,
      url: createVerseShareUrl({
        book: promise.reference.book,
        chapter: promise.reference.chapter,
        locale,
        origin: window.location.origin,
        verse: promise.reference.verseStart,
        verseEnd: promise.reference.verseEnd,
        versionId: version.id,
      }),
      version: version.short,
    })
    const result = await shareVerse(data)
    if (result === 'shared') setPromiseFeedback(t('reader.shared'))
    if (result === 'copied') setPromiseFeedback(t('reader.copied'))
    if (result === 'unavailable') setPromiseFeedback(t('reader.shareUnavailable'))
  }

  const entries = [
    {
      title: t('plans.featured'),
      detail: `${dailyProgress ? t('plans.resumeToday') : t(`plans.${dailyPlan.status}`)} · ${dailyReference}`,
      action: t('home.readListen'),
      image: '/assets/editorial/daily-reading-v1.webp',
      href: '/reavivados',
    },
    {
      title: t('home.thematicTitle'),
      detail: t('home.guideSummary'),
      action: t('home.consultTopic'),
      image: '/assets/editorial/guidance-v1.webp',
      href: '/topics',
    },
    {
      title: t('home.studyTitle'),
      detail: studySummary.hasStarted
        ? t('home.studyProgress', { completed: studySummary.completedLessons, total: studySummary.totalLessons })
        : t('home.courseSummary'),
      action: t('home.viewCourse'),
      image: '/assets/editorial/faith-v1.webp',
      href: '/studies/la-fe-de-jesus',
    },
    {
      title: t('home.beliefsTitle'),
      detail: t('home.beliefsSummary'),
      action: t('home.exploreBeliefs'),
      image: '/assets/editorial/bible-library-v1.webp',
      href: '/beliefs',
    },
  ]

  return (
    <div className={`home-page ${styles.homePage}`}>
      <div className={styles.opening} data-testid="home-opening">
        <HomeLandscape />
        <div className={styles.openingInner}>
          <HomeHeader />
          <div className={styles.openingGrid}>
            <section aria-busy={promiseStatus === 'loading'} aria-label={t('home.promiseOfDay')} className={styles.hero}>
              <div className={styles.heroCopy}>
                <p className={styles.heroKicker}>{t('home.promiseKicker')}</p>
                <div className={styles.heroQuote}><h1 className={heroQuoteClassName}>{visiblePromiseText}</h1></div>
                <p className={styles.promiseReference}>{promiseReference}{promiseReference && ` · ${version.short}`}</p>
                <div className={styles.heroActions}>
                  <Link aria-label={`${t('home.readInContext')}: ${promiseReference}`} className={styles.heroPrimaryAction} state={{ attentionVerse: true }} to={promisePath} {...(promise ? readingIntentProps(promise.reference) : {})}>
                    <Icon name="bookOpen" size={18} />
                    <span>{t('home.readInContext')}</span>
                  </Link>
                  <button aria-label={t('home.sharePromise')} className={styles.heroSecondaryAction} disabled={!promise || promiseStatus !== 'ready' || !promiseText} onClick={handlePromiseShare} type="button">
                    <Icon name="share" size={18} />
                    <span>{t('common.share')}</span>
                  </button>
                </div>
              </div>
            </section>
            <div className={styles.glassMantle}>
              <section aria-label={t('home.primaryActions')}>
                <article aria-labelledby="home-bible-heading" className={styles.readingPanel} data-testid="home-reading-panel">
                  <div className={styles.readingLayout}>
                    <div className={styles.readingHeading}>
                      <h2 id="home-bible-heading">{t('home.readBible')}</h2>
                      <p>{t('home.chooseBookChapter')}</p>
                    </div>
                    <div className={styles.readingTools}>
                      {recentReadings.length > 0 && (
                        <section aria-labelledby="home-recent-heading" className={styles.recentReadings}>
                          <h3 id="home-recent-heading"><Icon name="history" size={14} /><span className={styles.recentDesktopLabel}>{t('home.recentReadings')}</span><span className={styles.recentMobileLabel}>{t('home.lastReading')}</span></h3>
                          <ol className={styles.recentList}>
                            {recentReadings.map((reading, index) => (
                              <li key={`${reading.book}:${reading.chapter}`}>
                                <Link
                                  aria-label={`${t(index === 0 ? 'home.continueReading' : 'home.resumeReading')}: ${formatReference(reading, locale)}`}
                                  className={styles.recentLink}
                                  state={{ attentionVerse: true }}
                                  to={getReaderPath(reading)}
                                  {...readingIntentProps(reading)}
                                >
                                  <span className={styles.recentReference}>{formatReference(reading, locale)}</span>
                                  {index === 0 && <span className={styles.recentContinue}>{t('common.continue')}</span>}
                                </Link>
                              </li>
                            ))}
                          </ol>
                        </section>
                      )}
                      <HomePassagePicker onGoToChapter={goToReading} />
                      <HomeQuickSearch currentBookId={hasReadingHistory ? lastRead.book : null} currentChapter={hasReadingHistory ? lastRead.chapter : null} onGoToChapter={goToReading} />
                    </div>
                  </div>
                </article>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.homeFeed}>
        <HomeDailyVideo />
        {hasReadingHistory && <InstallInvitation />}

        <section aria-labelledby="home-editorial-heading" className={styles.editorialSection}>
          <h2 className={styles.sectionTitle} id="home-editorial-heading">{t('home.alsoIn')}</h2>
          <div className={styles.editorialList}>
            {entries.map((entry, index) => (
              <Link className={styles.editorialEntry} key={entry.href} to={entry.href}>
                <span aria-hidden="true" className={`${styles.entryImage} editorial-art`}>
                  <EditorialIllustration alt="" decoding="async" height="1024" loading="lazy" src={entry.image} width="1536" />
                </span>
                <div className={styles.entryCopy}>
                  <div className={styles.entryHeading}>
                    <span aria-hidden="true" className={styles.entryNumber}>{String(index + 1).padStart(2, '0')}</span>
                    <h3 className={styles.entryTitle}>{entry.title}</h3>
                  </div>
                  <p className={styles.entryDetail}>{entry.detail}</p>
                  <span className={styles.entryAction}>{entry.action}<Icon name="arrowRight" size={17} /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="interest-links-title" className={styles.interestSection}>
          <h2 className={styles.eyebrow} id="interest-links-title">{t('home.interestTitle')} · {t('home.externalSites')}</h2>
          <div className={styles.interestGrid}>
            {interestLinks.map((item) => (
              <a aria-label={`${item.label}: ${t(item.descriptionKey)}. ${t('home.opensExternal')}`} className={styles.interestCard} href={item.url} key={item.label} rel="noopener noreferrer" target="_blank">
                <span aria-hidden="true" className={styles.interestIcon}><img alt="" decoding="async" height="26" loading="lazy" src={`/assets/home-links/${item.image}`} width="26" /></span>
                <span className={styles.interestCopy}>
                  <strong>{item.label}</strong>
                  <small>{t(item.descriptionKey)}</small>
                </span>
                <Icon name="externalLink" size={12} />
              </a>
            ))}
          </div>
        </section>
      </div>

      {promiseFeedback && <p aria-live="polite" className={styles.promiseFeedback} role="status">{promiseFeedback}</p>}
    </div>
  )
}
