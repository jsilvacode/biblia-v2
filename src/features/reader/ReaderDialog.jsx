import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../../components/ui/Icon'
import {
  cancelScheduled,
  focusWithoutScrolling,
  getFocusableElements,
  schedule,
  useAnchoredPopover,
} from './useAnchoredPopover'

function resolveDialogPopoverPosition({ anchor, panel }) {
  const anchorBox = anchor.getBoundingClientRect()
  const gap = 0.55 * parseFloat(getComputedStyle(document.documentElement).fontSize || '16')
  const viewportPadding = 8
  const panelBox = panel.getBoundingClientRect()
  const panelHeight = panelBox.height
  const panelWidth = panelBox.width || Math.min(352, window.innerWidth - viewportPadding * 2)
  const right = Math.max(viewportPadding, window.innerWidth - anchorBox.right)
  const preferredTop = anchorBox.bottom + gap
  const maxTop = window.innerHeight - panelHeight - viewportPadding
  const top = panelHeight > 0 && preferredTop > maxTop
    ? Math.max(viewportPadding, anchorBox.top - panelHeight - gap)
    : Math.max(viewportPadding, preferredTop)

  return {
    maxWidth: `calc(100vw - ${viewportPadding * 2}px)`,
    right: `${Math.min(right, Math.max(viewportPadding, window.innerWidth - panelWidth - viewportPadding))}px`,
    top: `${top}px`,
  }
}

/**
 * A compact, reader-scoped dialog primitive. Modal sheets own background
 * scroll; anchored variants share focus and positioning with reader popovers.
 */
export function ReaderDialog({
  children,
  className = '',
  closeLabel = 'Close',
  descriptionId,
  isOpen,
  onClose,
  anchorRef,
  popover = false,
  returnFocusRef,
  title,
}) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  const titleId = useId()
  const popoverStyle = useAnchoredPopover({
    anchorRef,
    isOpen: isOpen && popover,
    onClose,
    panelRef: dialogRef,
    resolvePosition: resolveDialogPopoverPosition,
    returnFocusRef,
  })

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen || popover) return undefined

    const body = document.body
    const root = document.documentElement
    const previouslyFocused = document.activeElement
    const returnFocusTarget = returnFocusRef ? returnFocusRef.current : previouslyFocused
    const scrollY = window.scrollY
    const openedAtLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const previousBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    }
    const previousOverscroll = root.style.overscrollBehavior

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    root.style.overscrollBehavior = 'none'

    const focusId = schedule(() => {
      const dialog = dialogRef.current
      const initialTarget = dialog?.querySelector('[data-dialog-initial-focus]')
      focusWithoutScrolling(initialTarget ?? getFocusableElements(dialog)[0])
    })

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = getFocusableElements(dialogRef.current)
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

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      cancelScheduled(focusId)
      document.removeEventListener('keydown', handleKeyDown)
      body.style.overflow = previousBodyStyles.overflow
      body.style.position = previousBodyStyles.position
      body.style.top = previousBodyStyles.top
      body.style.width = previousBodyStyles.width
      root.style.overscrollBehavior = previousOverscroll
      const currentLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (currentLocation === openedAtLocation) window.scrollTo(0, scrollY)
      schedule(() => focusWithoutScrolling(returnFocusTarget))
    }
  }, [isOpen, popover, returnFocusRef])

  if (!isOpen) return null

  function closeFromBackdrop(event) {
    if (event.target === event.currentTarget) onClose()
  }

  const dialog = (
    <section
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal={popover ? undefined : 'true'}
      className={`reader-dialog ${popover ? 'reader-dialog--popover' : ''} ${className}`.trim()}
      ref={dialogRef}
      role="dialog"
      style={popover ? popoverStyle ?? undefined : undefined}
    >
      <div aria-hidden="true" className="reader-dialog__handle" />
      <header className="reader-dialog__header">
        <button aria-label={closeLabel} className="reader-dialog__back" onClick={onClose} type="button">
          <Icon name="arrowLeft" size="sm" />
        </button>
        <h2 id={titleId}>{title}</h2>
        <span aria-hidden="true" className="reader-dialog__header-spacer" />
      </header>
      {children}
    </section>
  )

  if (popover) return createPortal(dialog, document.body)

  return createPortal((
    <div className="reader-dialog-backdrop" onPointerDown={closeFromBackdrop}>
      {dialog}
    </div>
  ), document.body)
}
