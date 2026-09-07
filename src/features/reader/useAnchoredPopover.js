import { useEffect, useRef, useState } from 'react'

export const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function getFocusableElements(container) {
  if (!container) return []
  return [...container.querySelectorAll(focusableSelector)]
    .filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true')
}

export function focusWithoutScrolling(element) {
  if (!element || !element.isConnected || typeof element.focus !== 'function') return
  element.focus({ preventScroll: true })
}

export function schedule(callback) {
  if (typeof window.requestAnimationFrame === 'function') return window.requestAnimationFrame(callback)
  return window.setTimeout(callback, 0)
}

export function cancelScheduled(id) {
  if (typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(id)
  else window.clearTimeout(id)
}

function samePosition(previous, next) {
  const previousEntries = Object.entries(previous ?? {})
  const nextEntries = Object.entries(next ?? {})
  return previousEntries.length === nextEntries.length
    && nextEntries.every(([key, value]) => previous?.[key] === value)
}

export function useAnchoredPopover({
  anchorRef,
  isOpen,
  onClose,
  panelRef,
  resolvePosition,
  returnFocusRef,
}) {
  const [position, setPosition] = useState(null)
  const closeRef = useRef(onClose)
  const resolvePositionRef = useRef(resolvePosition)

  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => { resolvePositionRef.current = resolvePosition }, [resolvePosition])

  useEffect(() => {
    if (!isOpen) return undefined

    const returnFocusTarget = returnFocusRef ? returnFocusRef.current : document.activeElement
    let positionFrame = 0

    function updatePosition() {
      if (positionFrame) return
      positionFrame = schedule(() => {
        positionFrame = 0
        const anchor = anchorRef?.current
        const panel = panelRef.current
        if (!anchor || !panel) return
        const nextPosition = resolvePositionRef.current?.({ anchor, panel })
        if (nextPosition) setPosition((previous) => samePosition(previous, nextPosition) ? previous : nextPosition)
      })
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = getFocusableElements(panelRef.current)
      if (!focusable.length) {
        event.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        focusWithoutScrolling(last)
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        focusWithoutScrolling(first)
      }
    }

    function handlePointerDown(event) {
      if (panelRef.current?.contains(event.target) || anchorRef?.current?.contains(event.target)) return
      closeRef.current?.()
    }

    updatePosition()
    const focusFrame = schedule(() => {
      const panel = panelRef.current
      focusWithoutScrolling(panel?.querySelector('[data-dialog-initial-focus]') ?? getFocusableElements(panel)[0])
    })
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(updatePosition) : null
    if (panelRef.current) resizeObserver?.observe(panelRef.current)

    return () => {
      cancelScheduled(positionFrame)
      cancelScheduled(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      resizeObserver?.disconnect()
      setPosition(null)
      schedule(() => focusWithoutScrolling(returnFocusTarget))
    }
  }, [anchorRef, isOpen, panelRef, returnFocusRef])

  return position
}
