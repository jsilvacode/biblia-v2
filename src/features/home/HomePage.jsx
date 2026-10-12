import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
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
import { formatPromiseReference } from './dailyPromise'
import { HomeHeader } from './HomeHeader'
import { HomePassagePicker } from './HomePassagePicker'
import { useDailyPromise } from './useDailyPromise'
import styles from './HomePage.module.css'

const warmedReferences = new Set()

const interestLinks = [
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
  {
    descriptionKey: 'home.interestNewTimeDescription',
    image: 'nuevo-tiempo.png',
    label: 'Nuevo Tiempo',
    url: 'https://nuevotiempo.cl/',
  },
  {
    descriptionKey: 'home.interestAdraDescription',
    image: 'adra.png',
    label: 'ADRA',
    url: 'https://adra.cl/',
  },
]

function getReaderPath(reference) {
  return `/read/${reference.book}/${reference.chapter}${reference.verse ? `/${reference.verse}` : ''}`
}

export default function HomePage() {
  const { locale, t } = useI18n()
  const { lastRead } = useReadingState()
  const { settings } = useSettings()
  const studySummary = useStudyProgressSummary()
  const navigate = useNavigate()
  const { promise, status: promiseStatus, text: promiseText } = useDailyPromise(settings.bibleVersion)
  const [promiseFeedback, setPromiseFeedback] = useState('')
  const hasReadingHistory = Boolean(lastRead.updatedAt)
  const version = getVersion(settings.bibleVersion)
  const lastReference = formatReference(lastRead, locale)
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
  const previousReading = hasReadingHistory ? lastRead : null
  const visiblePromiseText = promiseText || (promiseStatus === 'error' ? t('home.promiseUnavailable') : t('home.promiseLoading'))
  const heroQuoteClassName = visiblePromiseText.length > 480
    ? styles.heroQuoteExtended
    : visiblePromiseText.length > 260
      ? styles.heroQuoteVeryLong
      : visiblePromiseText.length > 150
        ? styles.heroQuoteLong
        : visiblePromiseText.length > 92
          ? styles.heroQuoteMedium
          : undefined

  useEffect(() => {
    if (!promiseFeedback) return undefined
    const timeout = window.setTimeout(() => setPromiseFeedback(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [promiseFeedback])

  function preloadReading(reference) {
    const key = `${settings.bibleVersion}:${reference.book}:${reference.chapter}`
    if (warmedReferences.has(key)) return
    warmedReferences.add(key)

    void import('../reader/ReaderPage')
    void import('../bible/bibleRepository')
      .then(({ loadChapter }) => loadChapter({
        bookId: reference.book,
        chapter: reference.chapter,
        versionId: settings.bibleVersion,
      }))
      .catch(() => {
        warmedReferences.delete(key)
      })
  }

  function readingIntentProps(reference) {
    return {
      onFocus: () => preloadReading(reference),
      onPointerDown: () => preloadReading(reference),
    }
  }

  function goToReading(book, chapter, verse = null) {
    const reference = { book, chapter, verse }
    preloadReading(reference)
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
      image: '/assets/home-rpsp-landscape-v1.webp',
      href: '/reavivados',
    },
    {
      title: t('home.thematicTitle'),
      detail: t('home.guideSummary'),
      action: t('home.consultTopic'),
      image: '/assets/home-guide-editorial-v2.webp',
      href: '/topics',
    },
    {
      title: t('home.studyTitle'),
      detail: studySummary.hasStarted
        ? t('home.studyProgress', { completed: studySummary.completedLessons, total: studySummary.totalLessons })
        : t('home.courseSummary'),
      action: t('home.viewCourse'),
      image: '/assets/home-study-invitation-v1.webp',
      href: '/studies/la-fe-de-jesus',
    },
  ]

  return (
    <div className={`home-page ${styles.homePage}`}>
      <section aria-busy={promiseStatus === 'loading'} aria-label={t('home.promiseOfDay')} className={styles.hero}>
        <div className={styles.heroInner}>
          <HomeHeader />
          <div className={styles.heroCopy}>
            <p className={styles.heroKicker}>{t('home.promiseKicker')}</p>
            <h1 className={heroQuoteClassName}>{visiblePromiseText}</h1>
            <p className={styles.promiseReference}>{promiseReference}{promiseReference && ` · ${version.short}`}</p>
            <div className={styles.heroActions}>
              <Link aria-label={`${t('home.readInContext')}: ${promiseReference}`} className={styles.heroPrimaryAction} state={{ attentionVerse: true }} to={promisePath} {...(promise ? readingIntentProps(promise.reference) : {})}>
                <Icon name="bookOpen" size={18} />
                <span>{promise ? t('home.readPassage', { reference: formatReference({ book: promise.reference.book, chapter: promise.reference.chapter }, locale) }) : t('home.readInContext')}</span>
              </Link>
              <button aria-label={t('home.sharePromise')} className={styles.heroSecondaryAction} disabled={!promise || promiseStatus !== 'ready' || !promiseText} onClick={handlePromiseShare} type="button">
                <Icon name="share" size={18} />
                <span>{t('common.share')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.homeFeed}>
        <div className={styles.glassMantle}>
          <section aria-label={t('home.primaryActions')}>
            <article aria-labelledby="home-bible-heading" className={styles.readingPanel} data-testid="home-reading-panel">
              <div className={styles.readingLayout}>
                <div className={styles.readingHeading}>
                  <h2 id="home-bible-heading">{t('home.readBible')}</h2>
                  <p>{t('home.chooseBookChapter')}</p>
                </div>
                <div>
                  <HomePassagePicker onGoToChapter={goToReading} />
                  {previousReading && (
                    <div className={styles.lastReading}>
                      <span>{t('home.lastReading')}</span>
                      <span className={styles.lastReference}>{lastReference}</span>
                      <Link aria-label={`${t('home.continueReading')}: ${lastReference}`} className={styles.continueLink} to={getReaderPath(previousReading)} {...readingIntentProps(previousReading)}>
                        <span>{t('common.continue')}</span><Icon name="arrowRight" size={15} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </article>
          </section>

          {hasReadingHistory && <InstallInvitation />}

          <section aria-labelledby="home-editorial-heading" className={styles.editorialSection}>
            <h2 className={styles.eyebrow} id="home-editorial-heading">{t('home.alsoIn')}</h2>
            <div className={styles.editorialList}>
              {entries.map((entry, index) => (
                <Link className={styles.editorialEntry} key={entry.href} to={entry.href}>
                  <span aria-hidden="true" className={styles.entryNumber}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={styles.entryCopy}>
                    <h3 className={styles.entryTitle}>{entry.title}</h3>
                    <span className={styles.entryDetail}>{entry.detail}</span>
                    <span className={styles.entryAction}>{entry.action}<Icon name="arrowRight" size={17} /></span>
                  </span>
                  <span aria-hidden="true" className={styles.entryImage}>
                    <img alt="" decoding="async" height="720" loading="lazy" src={entry.image} width="1440" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

        </div>
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
