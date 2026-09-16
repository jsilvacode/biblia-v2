/* eslint-disable react-hooks/set-state-in-effect -- These effects synchronize route-local date, storage, and asynchronous resources. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { formatReference, getBook, getLocalizedBookName, getVersion } from '../bible/catalog'
import { loadChapter } from '../bible/bibleRepository'
import { useSettings } from '../settings/SettingsProvider'
import { useReaderImmersion } from '../reader/useReaderImmersion'
import { DailyAudioPlayer } from './DailyAudioPlayer'
import { DailyChapterText } from './DailyChapterText'
import { getRpspReadingForDate } from './rpspDate'
import { readRpspProgressForReading, saveRpspProgress } from './rpspProgress'
import { loadRpspMetadata } from './rpspRepository'
import { useRpspLocalDate } from './useRpspLocalDate'
import styles from './DailyReadingPage.module.css'

function readingKey(reading) {
  return reading ? `${reading.book}:${reading.chapter}` : null
}

function metadataMatchesReading(metadata, reading) {
  return metadata?.reference?.book === reading?.book && metadata?.reference?.chapter === reading?.chapter
}

function scrollSnapshot(verse) {
  const height = document.documentElement.scrollHeight - window.innerHeight
  return {
    verse,
    scrollProgress: height > 0 ? (window.scrollY / height) * 100 : 0,
  }
}

export default function DailyReadingPage() {
  const { locale, t } = useI18n()
  const { settings } = useSettings()
  const localDate = useRpspLocalDate()
  const [sessionDate, setSessionDate] = useState(() => localDate)
  const [pendingDate, setPendingDate] = useState(null)
  const [audioSessionActive, setAudioSessionActive] = useState(false)
  const [metadataRetry, setMetadataRetry] = useState(0)
  const [chapterRetry, setChapterRetry] = useState(0)
  const [metadataResult, setMetadataResult] = useState({ key: null, status: 'loading', value: null })
  const [chapterResult, setChapterResult] = useState({ key: null, status: 'loading', data: [] })
  const [restoreProgress, setRestoreProgress] = useState(null)
  const visibleVerseRef = useRef(null)
  const savedProgressRef = useRef(null)

  const sessionPlan = useMemo(() => getRpspReadingForDate(sessionDate), [sessionDate])
  const reading = sessionPlan.reading
  const version = getVersion(settings.bibleVersion)
  const book = getBook(reading?.book)
  const metadataKey = sessionDate && reading ? `${sessionDate}:${readingKey(reading)}:${metadataRetry}` : null
  const chapterKey = sessionDate && reading ? `${sessionDate}:${version.id}:${readingKey(reading)}` : null
  const metadataStatus = metadataResult.key === metadataKey ? metadataResult.status : 'loading'
  const receivedMetadata = metadataResult.key === metadataKey ? metadataResult.value : null
  const metadata = metadataMatchesReading(receivedMetadata, reading) ? receivedMetadata : null
  const episode = metadata?.episode ?? null
  const chapterStatus = chapterResult.key === chapterKey ? chapterResult.status : 'loading'
  const chapter = useMemo(
    () => chapterResult.key === chapterKey ? chapterResult.data : [],
    [chapterKey, chapterResult],
  )
  const referenceLabel = reading ? formatReference(reading, locale) : ''
  const dateLabel = sessionDate
    ? new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${sessionDate}T12:00:00`))
    : ''
  const {
    isImmersive,
    onPointerDown,
    onPointerUp,
  } = useReaderImmersion({ chapterKey, enabled: chapterStatus === 'ready', isOverlayOpen: false })

  useEffect(() => {
    const root = document.documentElement
    if (isImmersive) root.dataset.rpspImmersive = 'true'
    else delete root.dataset.rpspImmersive
    return () => delete root.dataset.rpspImmersive
  }, [isImmersive])

  useEffect(() => {
    if (!localDate || localDate === sessionDate) return
    if (audioSessionActive) {
      setPendingDate(localDate)
      return
    }
    setSessionDate(localDate)
    setPendingDate(null)
  }, [audioSessionActive, localDate, sessionDate])

  useEffect(() => {
    if (!sessionDate || !reading || !metadataKey) return undefined
    const controller = new AbortController()
    loadRpspMetadata({ date: sessionDate, signal: controller.signal })
      .then((value) => {
        const isMatching = metadataMatchesReading(value, reading)
        setMetadataResult({
          key: metadataKey,
          status: isMatching ? value.status : 'unavailable',
          value: isMatching ? value : null,
        })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setMetadataResult({ key: metadataKey, status: 'unavailable', value: null })
      })
    return () => controller.abort()
  }, [metadataKey, reading, sessionDate])

  useEffect(() => {
    if (!chapterKey || !reading) return undefined
    const controller = new AbortController()
    loadChapter({ versionId: version.id, bookId: reading.book, chapter: reading.chapter, signal: controller.signal })
      .then((data) => setChapterResult({ key: chapterKey, status: 'ready', data }))
      .catch((error) => {
        if (error.name !== 'AbortError') setChapterResult({ key: chapterKey, status: 'error', data: [] })
      })
    return () => controller.abort()
  }, [chapterKey, chapterRetry, reading, version.id])

  useEffect(() => {
    if (!sessionDate || !reading) return
    const progress = readRpspProgressForReading({ date: sessionDate, reference: reading })
    savedProgressRef.current = progress
    setRestoreProgress(progress)
    visibleVerseRef.current = null
  }, [reading, sessionDate])

  const persistProgress = useCallback((partial = {}) => {
    if (!sessionDate || !reading) return
    const next = saveRpspProgress({
      date: sessionDate,
      reference: reading,
      verse: partial.verse ?? visibleVerseRef.current,
      scrollProgress: partial.scrollProgress ?? savedProgressRef.current?.scrollProgress ?? 0,
      audioPosition: partial.audioPosition ?? savedProgressRef.current?.audioPosition ?? 0,
    })
    if (next) {
      savedProgressRef.current = next
    }
  }, [reading, sessionDate])

  useEffect(() => {
    if (chapterStatus !== 'ready' || !reading) return undefined
    let frame = 0
    const update = () => {
      frame = 0
      const nodes = [...document.querySelectorAll('[data-rpsp-verse]')]
      const active = nodes.find((node) => node.getBoundingClientRect().bottom > 112)
      const verse = Number(active?.dataset.rpspVerse) || visibleVerseRef.current || chapter[0]?.verse || null
      if (!verse) return
      visibleVerseRef.current = verse
      persistProgress(scrollSnapshot(verse))
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    frame = window.requestAnimationFrame(update)
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [chapter, chapterStatus, persistProgress, reading])

  const handleAudioPosition = useCallback((audioPosition) => {
    persistProgress({ audioPosition })
  }, [persistProgress])

  function useTodayReading() {
    if (!pendingDate) return
    setAudioSessionActive(false)
    setSessionDate(pendingDate)
    setPendingDate(null)
  }

  if (sessionPlan.status !== 'active' || !reading || !book) {
    return (
      <div className={`page ${styles.dailyPage}`}>
        <section className={styles.unavailable}>
          <p className={styles.kicker}>Reavivados por su Palabra</p>
          <h1>El calendario de esta experiencia está disponible durante 2026.</h1>
          <p>La Biblia completa sigue disponible para que elijas cualquier libro y capítulo.</p>
        </section>
      </div>
    )
  }

  return (
    <div className={`${styles.dailyPage}${settings.fontFamily === 'sans' ? ` ${styles.fontSans}` : ''}`} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <section aria-label="Reavivados por su Palabra" className={styles.hero}>
        <div aria-hidden="true" className={styles.heroImage} />
        <div className={styles.heroInner}>
          <p className={styles.kicker}>Reavivados por su Palabra</p>
          <h1>{referenceLabel}</h1>
          <p className={styles.date}>{dateLabel}</p>
        </div>
      </section>

      <div className={styles.readingFlow}>
        {pendingDate && (
          <aside className={styles.dayChange} role="status">
            <span>Ya está disponible la lectura de hoy.</span>
            <button onClick={useTodayReading} type="button">Cambiar a la lectura de hoy</button>
          </aside>
        )}

        <header className={styles.audioContext}>
          <div>
            <p className={styles.audioKicker}><Icon name="headphones" size="sm" /> Reflexión del día</p>
            <h2>Reavivados por su Palabra</h2>
            <p>Nuevo Tiempo</p>
          </div>
          {episode?.sourcePageUrl && (
            <a className={styles.audioSourceLink} href={episode.sourcePageUrl} rel="noreferrer" target="_blank">
              Ver fuente <Icon name="externalLink" size="sm" />
            </a>
          )}
        </header>

        <DailyAudioPlayer
          episode={episode}
          key={sessionDate}
          metadataStatus={metadataStatus}
          onPositionChange={handleAudioPosition}
          onRetry={() => setMetadataRetry((value) => value + 1)}
          onSessionChange={setAudioSessionActive}
        />

        <article aria-busy={chapterStatus === 'loading'} className={styles.chapter}>
          <header className={styles.chapterHeader}>
            <p className={styles.chapterKicker}><Icon name="bookOpen" size="sm" /> Lectura bíblica</p>
            <h2>{getLocalizedBookName(book, locale)} {reading.chapter}</h2>
            <p>{version.name}</p>
          </header>

          {chapterStatus === 'loading' && <div aria-label="Cargando capítulo" className={styles.skeleton}><i /><i /><i /><i /><i /></div>}
          {chapterStatus === 'error' && (
            <div className={styles.chapterError}>
              <p>{t('reader.loadError')}</p>
              <button onClick={() => setChapterRetry((value) => value + 1)} type="button">{t('reader.retry')}</button>
            </div>
          )}
          {chapterStatus === 'ready' && (
            <DailyChapterText
              chapter={chapter}
              onVerseVisible={(element, verse) => {
                if (element.getBoundingClientRect().bottom > 112) visibleVerseRef.current = verse
              }}
              restoredVerse={restoreProgress?.verse ?? null}
            />
          )}
        </article>
      </div>
    </div>
  )
}
