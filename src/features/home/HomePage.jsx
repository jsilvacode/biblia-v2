import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { formatReference, getBook, getVersion } from '../bible/catalog'
import { InstallInvitation } from '../install/InstallInvitation'
import { getRpspPlanState } from '../plans/rpsp2026'
import { useReading } from '../reading/ReadingProvider'
import { QuickNavigationSheet } from '../reader/QuickNavigationSheet'
import { createVerseShareData, createVerseShareUrl, shareVerse } from '../reader/shareVerse'
import { useSettings } from '../settings/SettingsProvider'
import { useStudyProgress } from '../studies/studyProgress'
import { formatPromiseReference } from './dailyPromise'
import { HomeHeader } from './HomeHeader'
import { useDailyPromise } from './useDailyPromise'
import styles from './HomePage.module.css'

const warmedReferences = new Set()

const interestLinks = [
  {
    descriptionKey: 'home.interestSabbathSchoolDescription',
    icon: 'bookOpen',
    label: 'Escuela Sabática',
    url: 'https://escuelasabatica.cl/',
  },
  {
    descriptionKey: 'home.interestBibleDialogueDescription',
    icon: 'play',
    label: 'Diálogo Bíblico',
    url: 'https://www.youtube.com/playlist?list=PLn19CCwh0uJwsZM3-89oEGdorLikq9hFS',
  },
  {
    descriptionKey: 'home.interestNewTimeDescription',
    icon: 'radio',
    label: 'Nuevo Tiempo',
    url: 'https://nuevotiempo.cl/',
  },
  {
    descriptionKey: 'home.interestAdraDescription',
    icon: 'heartHandshake',
    label: 'ADRA',
    url: 'https://adra.cl/',
  },
]

function getReaderPath(reference) {
  return `/read/${reference.book}/${reference.chapter}${reference.verse ? `/${reference.verse}` : ''}`
}

export default function HomePage() {
  const { locale, t } = useI18n()
  const { lastRead } = useReading()
  const { settings } = useSettings()
  const { summary: studySummary } = useStudyProgress()
  const navigate = useNavigate()
  const { promise, status: promiseStatus, text: promiseText } = useDailyPromise(settings.bibleVersion)
  const [isQuickNavigationOpen, setIsQuickNavigationOpen] = useState(false)
  const [promiseFeedback, setPromiseFeedback] = useState('')
  const quickNavigationTriggerRef = useRef(null)
  const hasReadingHistory = Boolean(lastRead.updatedAt)
  const version = getVersion(settings.bibleVersion)
  const lastReference = formatReference(lastRead, locale)
  const dailyPlan = getRpspPlanState(new Date())
  const dailyReference = formatReference(dailyPlan.reading, locale)
  const promiseReference = formatPromiseReference(promise, locale)
  const promisePath = promise ? getReaderPath({
    book: promise.reference.book,
    chapter: promise.reference.chapter,
    verse: promise.reference.verseStart,
  }) : '/bible'
  const previousReading = hasReadingHistory ? lastRead : null
  const quickNavigationBook = previousReading ? getBook(previousReading.book) : null
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
      onPointerEnter: () => preloadReading(reference),
    }
  }

  function goToReading(book, chapter) {
    const reference = { book, chapter, verse: null }
    setIsQuickNavigationOpen(false)
    preloadReading(reference)
    navigate(getReaderPath(reference))
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

  return (
    <div className={`home-page ${styles.homePage}`}>
      <section aria-busy={promiseStatus === 'loading'} aria-label={t('home.promiseOfDay')} className={styles.hero}>
        <div className={styles.heroInner}>
          <HomeHeader />
          <div className={styles.heroCopy}>
            <p className={styles.heroKicker}>{t('home.promiseKicker')}</p>
            <h1 className={heroQuoteClassName}>{visiblePromiseText}</h1>
            <p className={styles.promiseReference}>{promiseReference}</p>
            <div className={styles.heroActions}>
              <Link className={styles.heroPrimaryAction} state={{ attentionVerse: true }} to={promisePath} {...(promise ? readingIntentProps(promise.reference) : {})}>
                <Icon name="bookOpen" size={18} />
                <span>{t('home.readInContext')}</span>
              </Link>
              <button aria-label={t('home.sharePromise')} className={styles.heroSecondaryAction} disabled={!promise || promiseStatus !== 'ready' || !promiseText} onClick={handlePromiseShare} type="button">
                <Icon name="share" size={18} />
                <span>{t('common.share')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <InstallInvitation />

      <section aria-label={t('home.primaryActions')} className={styles.homeFeed}>
        {previousReading ? (
          <Link
            aria-label={`${t('home.continueReading')}: ${lastReference}`}
            className={styles.readingCard}
            to={getReaderPath(previousReading)}
            {...readingIntentProps(previousReading)}
          >
            <span aria-hidden="true" className={styles.cardIcon}><Icon name="bookOpen" size={21} /></span>
            <span className={styles.cardCopy}>
              <span className={styles.eyebrow}>{t('home.continueReading')}</span>
              <strong>{lastReference}</strong>
              <small className={styles.cardMeta}>{t('home.continueHint')}</small>
            </span>
            <span aria-hidden="true" className={styles.cardArrow}><Icon name="arrowRight" size={19} /></span>
          </Link>
        ) : (
          <button
            aria-expanded={isQuickNavigationOpen}
            aria-haspopup="dialog"
            className={styles.readingCard}
            onClick={() => setIsQuickNavigationOpen(true)}
            ref={quickNavigationTriggerRef}
            type="button"
          >
            <span aria-hidden="true" className={styles.cardIcon}><Icon name="bookOpen" size={21} /></span>
            <span className={styles.cardCopy}>
              <span className={styles.eyebrow}>{t('home.startReading')}</span>
              <strong>{t('home.chooseReading')}</strong>
              <small className={styles.cardMeta}>{t('home.startReadingDescription')}</small>
            </span>
            <span aria-hidden="true" className={styles.cardArrow}><Icon name="arrowRight" size={19} /></span>
          </button>
        )}

        <div className={styles.secondaryCards}>
          <Link className={styles.dailyCard} to={getReaderPath(dailyPlan.reading)} {...readingIntentProps(dailyPlan.reading)}>
            <span className={styles.cardHeading}>
              <span aria-hidden="true" className={styles.cardIcon}><Icon name="calendar" size={18} /></span>
              <span className={styles.eyebrow}>{t('plans.featured')}</span>
            </span>
            <span className={styles.cardCopy}>
              <strong>{dailyReference}</strong>
              <small className={styles.cardMeta}>{t(`plans.${dailyPlan.status}`)}</small>
            </span>
            <span aria-hidden="true" className={styles.cardArrow}><Icon name="arrowRight" size={19} /></span>
          </Link>

          <Link className={styles.promisesCard} to="/topics">
            <span className={styles.cardHeading}>
              <span aria-hidden="true" className={styles.cardIcon}><Icon name="library" size={18} /></span>
              <span className={styles.eyebrow}>{t('home.promisesGuide')}</span>
            </span>
            <span className={styles.cardCopy}>
              <strong>{t('home.thematicTitle')}</strong>
              <small className={styles.cardMeta}>{t('home.thematicGuide')}</small>
            </span>
            <span aria-hidden="true" className={styles.cardArrow}><Icon name="arrowRight" size={19} /></span>
          </Link>

          <Link className={styles.studyCard} to="/studies/la-fe-de-jesus">
            <span className={styles.cardHeading}>
              <span aria-hidden="true" className={styles.cardIcon}><Icon name="graduation" size={19} /></span>
              <span className={styles.eyebrow}>{t('home.studyEyebrow')}</span>
            </span>
            <span className={styles.cardCopy}>
              <strong>{t('home.studyTitle')}</strong>
              <small className={styles.cardMeta}>
                {studySummary.hasStarted
                  ? t('home.studyProgress', { completed: studySummary.completedLessons, total: studySummary.totalLessons })
                  : t('home.studyDescription')}
              </small>
              {studySummary.hasStarted && (
                <span aria-hidden="true" className={styles.studyProgress}>
                  <span style={{ width: `${studySummary.percent}%` }} />
                </span>
              )}
            </span>
            <span aria-hidden="true" className={styles.cardArrow}><Icon name="arrowRight" size={19} /></span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="interest-links-title" className={styles.interestSection}>
        <header className={styles.interestHeading}>
          <p className={styles.eyebrow}>{t('home.interestEyebrow')}</p>
          <h2 id="interest-links-title">{t('home.interestTitle')}</h2>
          <p>{t('home.interestDescription')}</p>
        </header>
        <div className={styles.interestGrid}>
          {interestLinks.map((item) => (
            <a
              aria-label={`${item.label}: ${t(item.descriptionKey)}. ${t('home.opensExternal')}`}
              className={styles.interestCard}
              href={item.url}
              key={item.label}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span aria-hidden="true" className={styles.interestIcon}><Icon name={item.icon} size={19} /></span>
              <span>
                <strong>{item.label}</strong>
                <small>{t(item.descriptionKey)}</small>
              </span>
              <Icon name="externalLink" size={15} />
            </a>
          ))}
        </div>
      </section>

      {isQuickNavigationOpen && (
        <QuickNavigationSheet
          anchorRef={quickNavigationTriggerRef}
          book={quickNavigationBook}
          chapter={previousReading?.chapter ?? null}
          isOpen
          onClose={() => setIsQuickNavigationOpen(false)}
          onGoToChapter={goToReading}
          returnFocusRef={quickNavigationTriggerRef}
        />
      )}
      {promiseFeedback && <p aria-live="polite" className={styles.promiseFeedback} role="status">{promiseFeedback}</p>}
    </div>
  )
}
