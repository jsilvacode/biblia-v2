import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import styles from './DailyVideoPlayer.module.css'

const ENTER_DURATION = 560
const EXIT_DURATION = 420
const EASING = 'cubic-bezier(.22, 1, .36, 1)'

function duration(milliseconds) {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : milliseconds
}

function frameTransform(from, to) {
  return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`
}

// The same dialog and iframe stay in the same DOM position. showModal only
// promotes the player into the browser's top layer, preserving playback.
export function DailyVideoPlayer({ episode, onActivate, autoPlay = false, playRequest, t }) {
  const [manuallyActivated, setManuallyActivated] = useState(false)
  const activated = manuallyActivated || autoPlay
  const [phase, setPhase] = useState('inline')
  const slotRef = useRef(null)
  const dialogRef = useRef(null)
  const frameRef = useRef(null)
  const enterButtonRef = useRef(null)
  const closeButtonRef = useRef(null)
  const originRef = useRef(null)
  const returnFocusRef = useRef(null)
  const animationRef = useRef(null)
  const exitTimerRef = useRef(null)
  const closingRef = useRef(false)
  const captionId = useId()
  const theater = phase !== 'inline'

  const restoreFocus = useCallback(() => {
    // The inline control is recreated after closing, so resolve it after
    // React commits rather than capturing the old (now hidden) trigger.
    const target = returnFocusRef.current?.isConnected ? returnFocusRef.current : enterButtonRef.current
    if (target?.isConnected) target.focus({ preventScroll: true })
  }, [])

  const enterTheater = useCallback(() => {
    if (typeof dialogRef.current?.showModal !== 'function') return
    originRef.current = frameRef.current.getBoundingClientRect()
    returnFocusRef.current = document.activeElement
    closingRef.current = false
    setPhase('opening')
  }, [])

  const closeTheater = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    const frame = frameRef.current
    const current = frame.getBoundingClientRect()
    animationRef.current?.cancel()
    const destination = slotRef.current.getBoundingClientRect()
    const base = frame.getBoundingClientRect()
    setPhase('closing')
    const milliseconds = duration(EXIT_DURATION)
    if (milliseconds && typeof frame.animate === 'function' && base.width && destination.width) {
      animationRef.current = frame.animate([
        { transform: frameTransform(current, base), borderRadius: '8px' },
        { transform: frameTransform(destination, base), borderRadius: '18px' },
      ], { duration: milliseconds, easing: EASING, fill: 'forwards' })
    }
    exitTimerRef.current = window.setTimeout(() => setPhase('inline'), milliseconds)
  }, [])

  useLayoutEffect(() => {
    if (autoPlay) enterTheater()
  }, [autoPlay, playRequest, enterTheater])

  useLayoutEffect(() => {
    if (!theater) return undefined
    const dialog = dialogRef.current
    const frame = frameRef.current
    const body = document.body
    const root = document.documentElement
    const scrollX = window.scrollX
    const scrollY = window.scrollY
    const location = window.location.href
    const previousBody = Object.fromEntries(['overflow', 'position', 'top', 'left', 'width', 'paddingRight'].map((key) => [key, body.style[key]]))
    const previousOverscroll = root.style.overscrollBehavior
    const previousTheater = root.getAttribute('data-video-theater')
    const scrollbar = window.innerWidth - root.clientWidth

    // Pause the decorative parallax before fixing the page in place.
    root.setAttribute('data-video-theater', 'true')
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = `-${scrollX}px`
    body.style.width = '100%'
    if (scrollbar > 0) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbar}px`
    root.style.overscrollBehavior = 'none'
    dialog.removeAttribute('open')
    dialog.showModal()
    closeButtonRef.current?.focus({ preventScroll: true })

    const destination = frame.getBoundingClientRect()
    const origin = originRef.current
    const milliseconds = duration(ENTER_DURATION)
    if (milliseconds && typeof frame.animate === 'function' && origin?.width && destination.width) {
      animationRef.current = frame.animate([
        { transform: frameTransform(origin, destination), borderRadius: '18px' },
        { transform: 'none', borderRadius: '8px' },
      ], { duration: milliseconds, easing: EASING })
    }
    const entryTimer = window.setTimeout(() => {
      if (!closingRef.current) setPhase('open')
    }, milliseconds)

    return () => {
      window.clearTimeout(entryTimer)
      window.clearTimeout(exitTimerRef.current)
      animationRef.current?.cancel()
      dialog.close()
      dialog.setAttribute('open', '')
      Object.assign(body.style, previousBody)
      root.style.overscrollBehavior = previousOverscroll
      if (window.location.href === location) window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' })
      if (previousTheater === null) root.removeAttribute('data-video-theater')
      else root.setAttribute('data-video-theater', previousTheater)
      window.requestAnimationFrame(() => {
        if (window.location.href === location) restoreFocus()
      })
    }
  }, [theater, restoreFocus])

  useEffect(() => () => window.clearTimeout(exitTimerRef.current), [])

  function play() {
    setManuallyActivated(true)
    onActivate()
    enterTheater()
  }

  function backdropClick(event) {
    if (!theater || event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeTheater()
  }

  return (
    <div className={styles.slot} ref={slotRef}>
      <dialog
        aria-describedby={theater ? captionId : undefined}
        aria-label={theater ? t('dailyVideo.theaterTitle', { title: episode.title }) : undefined}
        aria-modal={theater ? 'true' : undefined}
        className={styles.stage}
        data-phase={phase}
        data-video-player=""
        onCancel={(event) => { event.preventDefault(); closeTheater() }}
        onClick={backdropClick}
        open
        ref={dialogRef}
        role={theater ? 'dialog' : 'presentation'}
      >
        <div className={styles.toolbar} hidden={!theater}>
          <span className={styles.theaterLabel}><Icon name="play" size={17} /> {t('dailyVideo.theaterMode')}</span>
          <button aria-label={t('dailyVideo.closeTheater')} className={styles.closeButton} onClick={closeTheater} ref={closeButtonRef} type="button">
            <span>{t('common.close')}</span><Icon name="close" size={21} />
          </button>
        </div>
        <div className={styles.frame} ref={frameRef}>
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
            <button aria-label={t('dailyVideo.play', { title: episode.title })} className={styles.poster} onClick={play} type="button">
              <img alt="" decoding="async" height="360" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" src={`https://i.ytimg.com/vi/${episode.videoId}/hqdefault.jpg`} width="480" />
              <span aria-hidden="true" className={styles.playIcon}><Icon name="play" size={64} strokeWidth={1.25} /></span>
              <span aria-hidden="true" className={styles.posterHint}>{t('dailyVideo.watchReflection')} <Icon name="arrowRight" size={17} /></span>
            </button>
          )}
          {activated && !theater && (
            <button aria-label={t('dailyVideo.theaterMode')} className={styles.enterButton} onClick={enterTheater} ref={enterButtonRef} type="button">
              <Icon name="play" size={16} /> {t('dailyVideo.theaterMode')}
            </button>
          )}
        </div>
        <p className={styles.caption} hidden={!theater} id={captionId}>{episode.title}</p>
      </dialog>
    </div>
  )
}
