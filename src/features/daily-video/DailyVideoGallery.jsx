import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { formatVideoDate, isVideoId, normalizeVideoDate } from './dailyVideoModel.js'
import styles from './DailyVideoGallery.module.css'

function VideoThumbnail({ videoId }) {
  const [failed, setFailed] = useState(false)

  return (
    <span aria-hidden="true" className={`${styles.thumbnail}${!isVideoId(videoId) || failed ? ` ${styles.thumbnailPlaceholder}` : ''}`}>
      {isVideoId(videoId) && !failed && (
        <img
          alt=""
          decoding="async"
          height="360"
          loading="lazy"
          onError={() => setFailed(true)}
          referrerPolicy="strict-origin-when-cross-origin"
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          width="480"
        />
      )}
      <span className={styles.thumbnailIcon}><Icon name="play" size={32} strokeWidth={1.4} /></span>
    </span>
  )
}

export function DailyVideoGallery({ date, previous = [], historyStatus, loadPrevious, featured = false, selectedDate = date, onSelect }) {
  const { locale, t } = useI18n()
  const galleryRef = useRef(null)
  const trackRef = useRef(null)
  const requestedDate = useRef(null)
  const trackId = useId()
  const [edges, setEdges] = useState({ start: true, end: true })
  const Heading = featured ? 'h3' : 'h2'
  const loading = historyStatus === 'idle' || historyStatus === 'loading'
  const episodes = previous.filter((entry) => {
    const entryDate = normalizeVideoDate(entry.contentDate)
    return entryDate && entryDate < date
  }).slice(0, 7)
  const hasEpisodes = historyStatus === 'ready' && episodes.length > 0

  useEffect(() => {
    if (!date || historyStatus !== 'idle' || requestedDate.current === date) return undefined
    const load = () => {
      if (requestedDate.current === date) return
      requestedDate.current = date
      loadPrevious()
    }

    if (typeof IntersectionObserver !== 'function') {
      load()
      return undefined
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        load()
        observer.disconnect()
      }
    }, { rootMargin: '240px 0px', threshold: 0 })
    const gallery = galleryRef.current
    if (gallery) observer.observe(gallery)
    return () => observer.disconnect()
  }, [date, historyStatus, loadPrevious])

  const updateEdges = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const end = Math.max(0, track.scrollWidth - track.clientWidth)
    const next = { start: track.scrollLeft <= 2, end: track.scrollLeft >= end - 2 }
    setEdges((current) => current.start === next.start && current.end === next.end ? current : next)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined
    const initialCheck = window.setTimeout(updateEdges, 0)
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(updateEdges) : null
    observer?.observe(track)
    window.addEventListener('resize', updateEdges)
    return () => {
      window.clearTimeout(initialCheck)
      observer?.disconnect()
      window.removeEventListener('resize', updateEdges)
    }
  }, [date, episodes.length, historyStatus, updateEdges])

  function scroll(direction) {
    const track = trackRef.current
    if (!track) return
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    track.scrollBy({ left: direction * track.clientWidth * .8, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <section aria-label={t('dailyVideo.galleryLabel')} className={styles.gallery} ref={galleryRef}>
      <Heading className={styles.srOnly}>{t('dailyVideo.previous')}</Heading>

      <div className={styles.row}>
        <ol aria-busy={loading} aria-hidden={!loading && !hasEpisodes || undefined} className={`${styles.track}${!loading && !hasEpisodes ? ` ${styles.reservedTrack}` : ''}`} id={trackId} onScroll={updateEdges} ref={trackRef}>
          {!hasEpisodes ? Array.from({ length: 7 }, (_, index) => (
            <li aria-hidden="true" className={styles.skeleton} key={index}>
              <span className={styles.thumbnail} />
              <span className={styles.cardCopy}><i /><i /><i /></span>
            </li>
          )) : episodes.map((entry) => {
            const selected = entry.contentDate === selectedDate
            return (
              <li key={entry.contentDate}>
                <button
                  aria-label={`${formatVideoDate(entry.contentDate, locale)} · ${entry.title}`}
                  aria-pressed={selected}
                  className={`${styles.card}${selected ? ` ${styles.selected}` : ''}`}
                  onClick={() => onSelect(entry)}
                  title={entry.title}
                  type="button"
                >
                  <VideoThumbnail key={entry.videoId ?? 'unavailable'} videoId={entry.videoId} />
                  <span className={styles.cardCopy}>
                    <time className={styles.cardDate} dateTime={entry.contentDate}>{formatVideoDate(entry.contentDate, locale, { compact: true })}</time>
                    <strong className={styles.cardTitle} lang="es">{entry.title}</strong>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <div className={styles.controls}>
          <button aria-controls={trackId} aria-label={t('dailyVideo.galleryPrevious')} disabled={!hasEpisodes || edges.start} onClick={() => scroll(-1)} type="button"><Icon name="arrowLeft" size={20} /></button>
          <button aria-controls={trackId} aria-label={t('dailyVideo.galleryNext')} disabled={!hasEpisodes || edges.end} onClick={() => scroll(1)} type="button"><Icon name="arrowRight" size={20} /></button>
        </div>
        {loading && <p className={styles.srOnly} role="status">{t('dailyVideo.loading')}</p>}
        {historyStatus === 'ready' && episodes.length === 0 && <p className={styles.emptyState}>{t('dailyVideo.previousEmpty')}</p>}
        {historyStatus === 'error' && (
          <div className={styles.emptyState}>
            <p role="status">{t('dailyVideo.historyError')}</p>
            <button className={styles.retryButton} onClick={loadPrevious} type="button">{t('dailyVideo.retry')}</button>
          </div>
        )}
      </div>
    </section>
  )
}
