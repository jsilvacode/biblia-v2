import { useCallback, useEffect, useRef, useState } from 'react'

const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [role="dialog"], [contenteditable="true"]'

export function isNeutralReaderTap(start, end, target) {
  if (!start || !end || !target) return false
  if (target.closest?.(INTERACTIVE_SELECTOR)) return false
  const deltaX = end.clientX - start.clientX
  const deltaY = end.clientY - start.clientY
  const isShortTap = end.timeStamp - start.timeStamp < 650
  return isShortTap && Math.hypot(deltaX, deltaY) <= 8
}

function hasTextSelection() {
  return Boolean(window.getSelection?.()?.toString().trim())
}

function supportsCompactAutoHide() {
  if (typeof window === 'undefined') return false
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  return !reducedMotion && Boolean(
    window.matchMedia?.('(pointer: coarse)').matches
    || window.matchMedia?.('(max-width: 1023px)').matches,
  )
}

/** Hides only the compact reader's bottom navigation after a quiet interval. */
export function useReaderImmersion({ chapterKey, enabled, isOverlayOpen }) {
  const [isImmersive, setIsImmersive] = useState(false)
  // Desktop readers have a precise pointer and enough permanent chrome space;
  // hiding the only way back or to another chapter makes the experience feel
  // broken. Automatic immersion is reserved for compact/touch surfaces.
  const [supportsAutoHide, setSupportsAutoHide] = useState(supportsCompactAutoHide)
  const timerRef = useRef(null)
  const restartTimerRef = useRef(null)
  const pointerStartRef = useRef(null)
  const overlayRef = useRef(isOverlayOpen)

  useEffect(() => {
    overlayRef.current = isOverlayOpen
  }, [isOverlayOpen])

  const clearTimer = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current)
    timerRef.current = null
    restartTimerRef.current = null
  }, [])

  const schedule = useCallback(() => {
    clearTimer()
    if (!enabled || !supportsAutoHide || overlayRef.current || document.visibilityState !== 'visible' || hasTextSelection()) return
    if (document.activeElement?.closest?.('[data-reader-chrome]')) return
    timerRef.current = window.setTimeout(() => {
      if (!overlayRef.current && !hasTextSelection() && !document.activeElement?.closest?.('[data-reader-chrome]')) {
        setIsImmersive(true)
      }
    }, 3000)
  }, [clearTimer, enabled, supportsAutoHide])

  const revealChrome = useCallback((restart = true) => {
    clearTimer()
    setIsImmersive(false)
    if (restart) restartTimerRef.current = window.setTimeout(schedule, 0)
  }, [clearTimer, schedule])

  useEffect(() => {
    const compactQuery = window.matchMedia?.('(max-width: 1023px)')
    const coarseQuery = window.matchMedia?.('(pointer: coarse)')
    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const updateSupport = () => setSupportsAutoHide(supportsCompactAutoHide())
    compactQuery?.addEventListener?.('change', updateSupport)
    coarseQuery?.addEventListener?.('change', updateSupport)
    motionQuery?.addEventListener?.('change', updateSupport)
    return () => {
      compactQuery?.removeEventListener?.('change', updateSupport)
      coarseQuery?.removeEventListener?.('change', updateSupport)
      motionQuery?.removeEventListener?.('change', updateSupport)
    }
  }, [])

  useEffect(() => {
    if (enabled && supportsAutoHide) return undefined
    clearTimer()
    const reveal = window.setTimeout(() => setIsImmersive(false), 0)
    return () => window.clearTimeout(reveal)
  }, [clearTimer, enabled, supportsAutoHide])

  useEffect(() => {
    if (!enabled || !supportsAutoHide) return undefined
    const start = window.setTimeout(() => revealChrome(true), 0)
    return () => {
      window.clearTimeout(start)
      clearTimer()
    }
  }, [chapterKey, clearTimer, enabled, revealChrome, supportsAutoHide])

  useEffect(() => {
    if (!isOverlayOpen) return undefined
    const reveal = window.setTimeout(() => revealChrome(false), 0)
    return () => window.clearTimeout(reveal)
  }, [isOverlayOpen, revealChrome])

  useEffect(() => {
    if (!enabled || !supportsAutoHide) return undefined
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') clearTimer()
      else revealChrome(true)
    }
    const handleScroll = () => revealChrome(true)
    const handleKeyDown = () => revealChrome(true)
    const handleSelection = () => {
      if (hasTextSelection()) revealChrome(false)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('selectionchange', handleSelection)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('selectionchange', handleSelection)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [clearTimer, enabled, revealChrome, supportsAutoHide])

  const onPointerDown = useCallback((event) => {
    if (supportsAutoHide) revealChrome(false)
    pointerStartRef.current = { clientX: event.clientX, clientY: event.clientY, timeStamp: event.timeStamp }
  }, [revealChrome, supportsAutoHide])

  const onPointerUp = useCallback((event) => {
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (hasTextSelection() || !isNeutralReaderTap(start, event, event.target)) return
    revealChrome(true)
  }, [revealChrome])

  return {
    isImmersive,
    onPointerDown,
    onPointerUp,
    revealChrome,
  }
}
