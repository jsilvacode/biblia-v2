import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../../components/ui/Icon'

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function getFocusableElements(container) {
  return [...container.querySelectorAll(focusableSelector)]
    .filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true')
}

function focusWithoutScrolling(element) {
  if (!element || !element.isConnected || typeof element.focus !== 'function') return
  element.focus({ preventScroll: true })
}

function schedule(callback) {
  if (typeof window.requestAnimationFrame === 'function') return window.requestAnimationFrame(callback)
  return window.setTimeout(callback, 0)
}

function cancelScheduled(id) {
  if (typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(id)
  else window.clearTimeout(id)
}

/**
 * A compact, reader-scoped modal primitive. It deliberately owns background
 * scroll and focus while open so a mobile bottom sheet cannot leak gestures
 * or keyboard focus back into the chapter beneath it.
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
  const [popoverStyle, setPopoverStyle] = useState(null)
  const titleId = useId()

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return undefined

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

    if (!popover) {
      body.style.overflow = 'hidden'
      body.style.position = 'fixed'
      body.style.top = `-${scrollY}px`
      body.style.width = '100%'
      root.style.overscrollBehavior = 'none'
    }

    function updatePopoverPosition() {
      const anchor = anchorRef?.current
      if (!popover || !anchor) return

      const anchorBox = anchor.getBoundingClientRect()
      const gap = 0.55 * parseFloat(getComputedStyle(document.documentElement).fontSize || '16')
      const viewportPadding = 8
      const panelBox = dialogRef.current?.getBoundingClientRect()
      const panelHeight = panelBox?.height ?? 0
      const panelWidth = panelBox?.width ?? Math.min(352, window.innerWidth - viewportPadding * 2)
      const right = Math.max(viewportPadding, window.innerWidth - anchorBox.right)
      const preferredTop = anchorBox.bottom + gap
      const maxTop = window.innerHeight - panelHeight - viewportPadding
      const top = panelHeight > 0 && preferredTop > maxTop
        ? Math.max(viewportPadding, anchorBox.top - panelHeight - gap)
        : Math.max(viewportPadding, preferredTop)

      setPopoverStyle({
        maxWidth: `calc(100vw - ${viewportPadding * 2}px)`,
        right: `${Math.min(right, Math.max(viewportPadding, window.innerWidth - panelWidth - viewportPadding))}px`,
        top: `${top}px`,
      })
    }

    if (popover) {
      updatePopoverPosition()
      const frame = schedule(updatePopoverPosition)
      window.addEventListener('resize', updatePopoverPosition)
      window.addEventListener('scroll', updatePopoverPosition, true)

      function closeFromOutside(event) {
        if (dialogRef.current?.contains(event.target) || anchorRef?.current?.contains(event.target)) return
        closeRef.current?.()
      }

      document.addEventListener('pointerdown', closeFromOutside)

      const focusId = schedule(() => {
        const dialog = dialogRef.current
        const initialTarget = dialog?.querySelector('[data-dialog-initial-focus]')
        focusWithoutScrolling(initialTarget ?? getFocusableElements(dialog ?? document.body)[0])
      })

      function handlePopoverKeyDown(event) {
        if (event.key === 'Escape') {
          event.preventDefault()
          closeRef.current?.()
          return
        }

        if (event.key !== 'Tab' || !dialogRef.current) return
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

      document.addEventListener('keydown', handlePopoverKeyDown)
      return () => {
        cancelScheduled(frame)
        cancelScheduled(focusId)
        window.removeEventListener('resize', updatePopoverPosition)
        window.removeEventListener('scroll', updatePopoverPosition, true)
        document.removeEventListener('pointerdown', closeFromOutside)
        document.removeEventListener('keydown', handlePopoverKeyDown)
        setPopoverStyle(null)
        schedule(() => focusWithoutScrolling(returnFocusTarget))
      }
    }

    const focusId = schedule(() => {
      const dialog = dialogRef.current
      const initialTarget = dialog?.querySelector('[data-dialog-initial-focus]')
      focusWithoutScrolling(initialTarget ?? getFocusableElements(dialog ?? document.body)[0])
    })

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current?.()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return
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
      if (!popover) {
        body.style.overflow = previousBodyStyles.overflow
        body.style.position = previousBodyStyles.position
        body.style.top = previousBodyStyles.top
        body.style.width = previousBodyStyles.width
        root.style.overscrollBehavior = previousOverscroll
      }
      const currentLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (currentLocation === openedAtLocation) window.scrollTo(0, scrollY)

      schedule(() => {
        focusWithoutScrolling(returnFocusTarget)
      })
    }
  }, [anchorRef, isOpen, popover, returnFocusRef])

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
        style={popover ? popoverStyle : undefined}
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
