import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { DAILY_VIDEO_CHANNEL, DAILY_VIDEO_CREATOR, formatVideoDate, isVideoId, normalizeVideoDate } from './dailyVideoModel.js'
import { cacheDailyVideo, loadDailyVideo } from './dailyVideoRepository.js'
import { DailyVideoGallery } from './DailyVideoGallery'
import { shareDailyVideo } from './shareDailyVideo.js'
import { useDailyVideo } from './useDailyVideo'
import styles from './DailyVideoSection.module.css'

const OFFICIAL_SITE = 'https://estediacondios.com/'
const OFFICIAL_CHANNEL = 'https://www.youtube.com/@EsteDiaConDios'

function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine !== false)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return online
}

function VideoPlayer({ episode, onActivate, autoPlay = false, t }) {
  const [activated, setActivated] = useState(autoPlay)
  const playLabel = t('dailyVideo.play', { title: episode.title })

  return (
      <div className={styles.player}>
        {activated ? (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            height="405"
            referrerPolicy="strict-origin-when-cross-origin"
            src={`https://www.youtube-nocookie.com/embed/${episode.videoId}?autoplay=1&controls=1&playsinline=1&rel=0`}
            title={episode.title}
            width="720"
          />
        ) : (
          <button
            aria-label={playLabel}
            className={styles.poster}
            onClick={() => {
              setActivated(true)
              onActivate()
            }}
            type="button"
          >
            <img
              alt=""
              decoding="async"
              height="360"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              src={`https://i.ytimg.com/vi/${episode.videoId}/hqdefault.jpg`}
              width="480"
            />
            <span aria-hidden="true" className={styles.playIcon}><Icon name="play" size={62} strokeWidth={1.25} /></span>
          </button>
        )}
      </div>
  )
}

export function DailyVideoSection({ date, featured = false }) {
  const { locale, t } = useI18n()
  const headingId = useId()
  const online = useOnlineStatus()
  const [homePlayerActivated, setHomePlayerActivated] = useState(false)
  const [selection, setSelection] = useState(null)
  const selectionRequest = useRef(null)
  const {
    date: anchorDate,
    metadata,
    newerDate,
    status: baseStatus,
    episode: baseEpisode,
    retry: retryBase,
    loadPrevious,
    previous,
    historyStatus,
  } = useDailyVideo({ date, freezeDate: !date && homePlayerActivated })
  const currentSelection = selection?.anchorDate === anchorDate ? selection : null
  const resolvedDate = currentSelection ? currentSelection.date : anchorDate
  const status = currentSelection ? currentSelection.status : baseStatus
  const episode = currentSelection ? currentSelection.episode : baseEpisode
  const [feedback, setFeedback] = useState({ key: null, result: null })
  const [shareRequestKey, setShareRequestKey] = useState(null)
  const validDate = normalizeVideoDate(resolvedDate)
  const activeEpisode = status === 'ready'
    && episode?.contentDate === validDate
    && isVideoId(episode.videoId)
    ? episode
    : null
  const episodeKey = activeEpisode ? `${activeEpisode.contentDate}:${activeEpisode.videoId}` : null
  const dateLabel = validDate ? formatVideoDate(validDate, locale) : ''
  const Heading = featured ? 'h2' : 'h1'
  const EpisodeHeading = featured ? 'h3' : 'h2'
  const displayedStatus = status === 'ready' && !activeEpisode ? 'unavailable' : status
  const messageKey = !online && displayedStatus !== 'invalid_date'
    ? 'offline'
    : displayedStatus === 'invalid_date' ? 'invalidDate' : displayedStatus
  const feedbackKey = feedback.key === episodeKey && feedback.result
    ? { shared: 'shared', copied: 'copied', unavailable: 'shareUnavailable' }[feedback.result]
    : null

  useEffect(() => () => selectionRequest.current?.abort(), [])

  async function selectEpisode(entry) {
    selectionRequest.current?.abort()
    setHomePlayerActivated(true)
    const selected = { anchorDate, date: entry.contentDate, entry }
    if (isVideoId(entry.videoId)) {
      setSelection({ ...selected, status: 'ready', episode: {
        ...entry, creator: DAILY_VIDEO_CREATOR, channelUrl: DAILY_VIDEO_CHANNEL,
        language: 'es', presenter: entry.presenter ?? null,
      } })
      return
    }
    const controller = new AbortController()
    selectionRequest.current = controller
    setSelection({ ...selected, status: 'loading', episode: null })
    try {
      const result = await loadDailyVideo({ date: entry.contentDate, signal: controller.signal })
      if (!controller.signal.aborted) {
        cacheDailyVideo(result)
        setSelection({ ...selected, status: result.status, episode: result.episode })
      }
    } catch {
      if (!controller.signal.aborted) setSelection({ ...selected, status: 'unavailable', episode: null })
    }
  }

  function viewToday() {
    selectionRequest.current?.abort()
    setSelection(null)
    setHomePlayerActivated(false)
  }

  function retry() {
    if (currentSelection) selectEpisode(currentSelection.entry)
    else retryBase()
  }

  async function handleShare() {
    if (!activeEpisode) return
    const key = episodeKey
    setShareRequestKey(key)
    setFeedback({ key, result: null })
    try {
      const result = await shareDailyVideo({ episode: activeEpisode, locale, origin: window.location.origin })
      setFeedback({ key, result })
    } catch {
      setFeedback({ key, result: 'unavailable' })
    } finally {
      setShareRequestKey((current) => current === key ? null : current)
    }
  }

  return (
    <section aria-labelledby={headingId} className={`${styles.section}${featured ? ` ${styles.featured}` : ''}`}>
      <header className={styles.sectionHeader}>
        <Heading id={headingId}>{t('dailyVideo.title')}</Heading>
      </header>

      {!online && activeEpisode && <p className={styles.offlineNotice} role="status"><Icon name="info" size={16} /> {t('dailyVideo.offline')}</p>}
      {online && activeEpisode && !currentSelection && metadata?.sourceUnavailable && <p className={styles.offlineNotice} role="status"><Icon name="info" size={16} /> {t('dailyVideo.cachedNotice')}</p>}
      {(newerDate || currentSelection) && <button className={styles.todayButton} onClick={viewToday} type="button">{t(currentSelection && date ? 'dailyVideo.backToFeatured' : 'dailyVideo.viewToday')} <Icon name="arrowRight" size={16} /></button>}

      <div aria-busy={displayedStatus === 'loading'} className={styles.body}>
        <div className={styles.copy}>
          {validDate && <time aria-label={dateLabel} className={styles.date} dateTime={validDate} title={dateLabel}><Icon name="calendar" size={15} /> {formatVideoDate(validDate, locale, { compact: true })}</time>}

          {activeEpisode ? (
            <EpisodeHeading className={styles.episodeTitle} lang={activeEpisode.language}>{activeEpisode.title}</EpisodeHeading>
          ) : (
            <div aria-hidden="true" className={`${styles.copyPlaceholder}${displayedStatus === 'loading' ? ` ${styles.loadingPlaceholder}` : ''}`}>
              <div className={styles.titlePlaceholder} />
            </div>
          )}

          {locale !== 'es' && <p className={styles.language}><Icon name="language" size={14} /> {t('dailyVideo.contentLanguage')}</p>}

          <div className={styles.attribution}>
            <p className={styles.credit}>
              <span>{t('dailyVideo.credit')}</span>{' '}
              <a href={activeEpisode?.sourcePageUrl ?? OFFICIAL_SITE} rel="noopener noreferrer" target="_blank">{activeEpisode?.creator || t('dailyVideo.title')}</a>
              {activeEpisode?.presenter && activeEpisode.presenter !== activeEpisode.creator && <span> · {activeEpisode.presenter}</span>}
            </p>
            <div className={styles.sourceLinks}>
              <a href={activeEpisode?.sourcePageUrl ?? OFFICIAL_SITE} rel="noopener noreferrer" target="_blank">{t('dailyVideo.officialSite')} <Icon name="externalLink" size={13} /></a>
              <a href={activeEpisode?.channelUrl ?? OFFICIAL_CHANNEL} rel="noopener noreferrer" target="_blank">{t('dailyVideo.officialChannel')} <Icon name="externalLink" size={13} /></a>
              {activeEpisode && <a href={`https://www.youtube.com/watch?v=${activeEpisode.videoId}`} rel="noopener noreferrer" target="_blank">{t('dailyVideo.watchOnYoutube')} <Icon name="externalLink" size={13} /></a>}
            </div>
          </div>

          <div aria-hidden={!activeEpisode || undefined} className={styles.actions}>
            {activeEpisode ? (
              <button className={styles.shareButton} disabled={shareRequestKey === episodeKey} onClick={handleShare} type="button">
                <Icon name="share" size={17} /> {t('dailyVideo.share')}
              </button>
            ) : <span className={styles.actionPlaceholder} />}
          </div>
          {activeEpisode && <p aria-live="polite" className={styles.feedback} role="status">{feedbackKey ? t(`dailyVideo.${feedbackKey}`) : ''}</p>}
        </div>

        <div className={styles.mediaColumn}>
          {activeEpisode ? (
          <VideoPlayer autoPlay={Boolean(currentSelection)} episode={activeEpisode} key={episodeKey} onActivate={() => setHomePlayerActivated(true)} t={t} />
          ) : (
          <div className={styles.empty} role="status">
            <Icon name={displayedStatus === 'loading' ? 'play' : 'info'} size={30} />
            <p>{t(`dailyVideo.${messageKey}`)}</p>
            {displayedStatus !== 'invalid_date' && displayedStatus !== 'loading' && (
              <button className={styles.retryButton} onClick={retry} type="button"><Icon name="forward" size={15} /> {t('dailyVideo.retry')}</button>
            )}
          </div>
          )}
          {anchorDate && <DailyVideoGallery date={anchorDate} featured={featured} historyStatus={historyStatus} key={anchorDate} loadPrevious={loadPrevious} onSelect={selectEpisode} previous={previous} selectedDate={resolvedDate} />}
        </div>
      </div>
    </section>
  )
}
