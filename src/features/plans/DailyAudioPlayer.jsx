import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import styles from './DailyAudioPlayer.module.css'

const activePlaybackStates = new Set(['loading', 'playing', 'paused', 'seeking', 'ended'])

function finiteDuration(value) {
  return Number.isFinite(value) && value > 0 ? value : null
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

export function formatAudioTime(value) {
  if (!Number.isFinite(value) || value < 0) return '—:—'
  const totalSeconds = Math.floor(value)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const paddedSeconds = String(seconds).padStart(2, '0')
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`
    : `${minutes}:${paddedSeconds}`
}

function playbackMessage(state) {
  const messages = {
    loading: 'Cargando audio…',
    playing: 'Reproduciendo reflexión.',
    paused: 'Reflexión en pausa.',
    seeking: 'Buscando posición…',
    ended: 'La reflexión ha terminado.',
    error: 'La fuente no permitió cargar el audio.',
  }
  return messages[state] ?? ''
}

function noAudioMessage(status) {
  if (status === 'loading') return 'Buscando la reflexión de hoy…'
  if (status === 'unavailable') return 'No pudimos cargar el audio. La lectura sigue disponible.'
  if (status === 'out_of_calendar') return 'No hay audio disponible para esta fecha.'
  return 'El audio de hoy aún no está disponible. Puedes comenzar con la lectura.'
}

function releaseAudio(audio) {
  if (!audio) return
  try {
    audio.pause()
  } catch {
    // A browser can reject pause while an element is being detached.
  }
  audio.removeAttribute('src')
  try {
    audio.load()
  } catch {
    // Releasing the source is sufficient when an older browser has no load().
  }
}

/**
 * A direct, single-element player for a verified Nuevo Tiempo episode.
 * The parent may offer a later episode through `episode`; an active session
 * remains on its current source until the reader explicitly chooses to switch.
 */
export function DailyAudioPlayer({
  episode = null,
  metadataStatus = episode ? 'ready' : 'pending',
  onPositionChange,
  onRetry,
  onSessionChange,
  onUseAvailableEpisode,
} = {}) {
  const audioRef = useRef(null)
  const activeEpisodeRef = useRef(episode)
  const sourceEpisodeIdRef = useRef(null)
  const positionRef = useRef(0)
  const mountedRef = useRef(false)
  const playbackStateRef = useRef('ready')
  const hasStartedRef = useRef(false)
  const onPositionChangeRef = useRef(onPositionChange)
  const [activeEpisode, setActiveEpisode] = useState(episode)
  const [availableEpisode, setAvailableEpisode] = useState(null)
  const [playbackState, setPlaybackState] = useState('ready')
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(null)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange
  }, [onPositionChange])

  const setState = useCallback((nextState) => {
    playbackStateRef.current = nextState
    if (mountedRef.current) setPlaybackState(nextState)
  }, [])

  const setStarted = useCallback((nextValue) => {
    hasStartedRef.current = nextValue
    if (mountedRef.current) setHasStarted(nextValue)
  }, [])

  const resetPlayback = useCallback(() => {
    sourceEpisodeIdRef.current = null
    positionRef.current = 0
    setStarted(false)
    setPosition(0)
    setDuration(null)
    setState('ready')
  }, [setStarted, setState])

  useEffect(() => {
    mountedRef.current = true
    const audio = audioRef.current
    if (!audio) return undefined

    const listeners = {
      loadedmetadata: () => setDuration(finiteDuration(audio.duration)),
      play: () => setState('loading'),
      waiting: () => setState('loading'),
      playing: () => {
        setStarted(true)
        setState('playing')
      },
      pause: () => {
        setStarted(false)
        if (audio.ended || playbackStateRef.current === 'ended') return
        setState('paused')
      },
      timeupdate: () => {
        positionRef.current = Math.max(0, Number(audio.currentTime) || 0)
        setPosition(positionRef.current)
        onPositionChangeRef.current?.(positionRef.current)
      },
      seeking: () => setState('seeking'),
      seeked: () => setState(audio.paused ? 'paused' : 'playing'),
      ended: () => {
        setStarted(false)
        positionRef.current = finiteDuration(audio.duration) ?? positionRef.current
        setPosition(positionRef.current)
        setState('ended')
      },
      error: () => {
        setStarted(false)
        setState('error')
      },
    }

    Object.entries(listeners).forEach(([event, listener]) => audio.addEventListener(event, listener))
    return () => {
      mountedRef.current = false
      Object.entries(listeners).forEach(([event, listener]) => audio.removeEventListener(event, listener))
      releaseAudio(audio)
      onSessionChange?.(false)
    }
  }, [onSessionChange, setStarted, setState])

  useEffect(() => {
    if (!episode || episode.id === activeEpisodeRef.current?.id) return

    if (sourceEpisodeIdRef.current || activePlaybackStates.has(playbackStateRef.current)) {
      setAvailableEpisode(episode)
      return
    }

    activeEpisodeRef.current = episode
    setActiveEpisode(episode)
    setAvailableEpisode(null)
    resetPlayback()
  }, [episode, resetPlayback])

  useEffect(() => {
    if (activeEpisode?.id !== activeEpisodeRef.current?.id) activeEpisodeRef.current = activeEpisode
  }, [activeEpisode])

  function useAvailableEpisode() {
    if (!availableEpisode) return
    releaseAudio(audioRef.current)
    activeEpisodeRef.current = availableEpisode
    setActiveEpisode(availableEpisode)
    setAvailableEpisode(null)
    resetPlayback()
    onUseAvailableEpisode?.(availableEpisode)
  }

  async function togglePlayback() {
    const audio = audioRef.current
    if (!audio || !activeEpisode) return

    if (hasStartedRef.current && playbackStateRef.current !== 'paused') {
      audio.pause()
      return
    }

    if (playbackStateRef.current === 'ended') {
      try {
        audio.currentTime = 0
      } catch {
        // The browser will report the actual position through timeupdate.
      }
      positionRef.current = 0
      setPosition(0)
    }

    if (sourceEpisodeIdRef.current !== activeEpisode.id) {
      audio.src = activeEpisode.audioUrl
      sourceEpisodeIdRef.current = activeEpisode.id
      onSessionChange?.(true)
      try {
        audio.load()
      } catch {
        // Calling play still gives the browser an opportunity to initialize it.
      }
    }

    setState('loading')
    try {
      await audio.play()
    } catch {
      setStarted(false)
      setState('error')
    }
  }

  function seek(nextPosition) {
    const audio = audioRef.current
    const max = finiteDuration(audio?.duration) ?? duration
    if (!audio || !max) return

    const clamped = clamp(nextPosition, 0, max)
    positionRef.current = clamped
    setPosition(clamped)
    try {
      audio.currentTime = clamped
      setState('seeking')
    } catch {
      setState('error')
    }
  }

  function retry() {
    releaseAudio(audioRef.current)
    resetPlayback()
    onSessionChange?.(false)
    onRetry?.()
  }

  const showControls = Boolean(activeEpisode)
  const activeDuration = duration
  const rangeMaximum = activeDuration ?? 0
  const displayedPosition = rangeMaximum ? clamp(position, 0, rangeMaximum) : 0
  const isPlaying = hasStarted && !['paused', 'ended', 'error'].includes(playbackState)
  const actionLabel = playbackState === 'ended'
    ? 'Reproducir de nuevo'
    : isPlaying ? 'Pausar reflexión' : 'Reproducir reflexión'

  return (
    <section
      aria-busy={metadataStatus === 'loading' || playbackState === 'loading'}
      aria-label="Reflexión del día"
      className={styles.player}
      data-playback-state={playbackState}
    >
      <audio aria-hidden="true" className={styles.media} preload="none" ref={audioRef} />

      {availableEpisode && (
        <aside className={styles.availableNotice} role="status">
          <span>Ya está disponible la lectura de hoy.</span>
          <button onClick={useAvailableEpisode} type="button">Cambiar a la lectura de hoy</button>
        </aside>
      )}

      {!showControls ? (
        <div className={styles.noAudio} role={metadataStatus === 'loading' ? 'status' : undefined}>
          <p>{noAudioMessage(metadataStatus)}</p>
          {metadataStatus === 'unavailable' && (
            <button onClick={retry} type="button">Volver a intentar</button>
          )}
        </div>
      ) : (
        <div className={styles.body}>
          <div className={styles.controls}>
            <button aria-label="Retroceder 15 segundos" className={styles.skipButton} disabled={!activeDuration} onClick={() => seek(displayedPosition - 15)} type="button">
              <span aria-hidden="true" className={styles.skipMark}>«</span>
            </button>
            <button aria-label={actionLabel} className={styles.playButton} onClick={togglePlayback} type="button">
              <Icon name={isPlaying ? 'pause' : 'play'} size={25} />
            </button>
            <button aria-label="Avanzar 15 segundos" className={styles.skipButton} disabled={!activeDuration} onClick={() => seek(displayedPosition + 15)} type="button">
              <span aria-hidden="true" className={styles.skipMark}>»</span>
            </button>
          </div>

          <div className={styles.timelineGroup}>
            <label className={styles.timelineLabel} htmlFor="daily-audio-position">Posición del audio</label>
            <input
              aria-valuetext={`${formatAudioTime(displayedPosition)} de ${formatAudioTime(activeDuration)}`}
              className={styles.timeline}
              disabled={!activeDuration}
              id="daily-audio-position"
              max={rangeMaximum}
              min="0"
              onChange={(event) => seek(Number(event.target.value))}
              step="1"
              type="range"
              value={displayedPosition}
            />
            <div className={styles.times} aria-hidden="true">
              <span>{formatAudioTime(displayedPosition)}</span>
              <span>{formatAudioTime(activeDuration)}</span>
            </div>
          </div>

          {playbackMessage(playbackState) && (
            <div className={styles.feedback}>
              <p className={styles.playbackMessage} role="status">{playbackMessage(playbackState)}</p>
              {playbackState === 'error' && <button className={styles.retryButton} onClick={retry} type="button">Reintentar</button>}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
