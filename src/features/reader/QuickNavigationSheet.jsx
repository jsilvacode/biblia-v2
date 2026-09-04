import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { bibleBooks } from '../bible/catalog'
import { BookChapterAccordion } from '../bible/BookChapterAccordion'

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

function QuickNavigationContent({ book, chapter: currentChapter, onGoToChapter }) {
  const { locale, t } = useI18n()
  const contentRef = useRef(null)

  useEffect(() => {
    if (!book?.id) return undefined
    const frame = window.requestAnimationFrame(() => {
      const container = contentRef.current
      const currentBook = container?.querySelector(`[data-book-id="${book.id}"]`)
      if (!container || !currentBook) return
      const containerBox = container.getBoundingClientRect()
      const bookBox = currentBook.getBoundingClientRect()
      container.scrollTop += bookBox.top - containerBox.top - 8
    })
    return () => window.cancelAnimationFrame(frame)
  }, [book?.id])

  return (
    <div className="reader-dialog__scroll-area reader-quick-navigation" ref={contentRef}>
      <BookChapterAccordion
        books={bibleBooks}
        currentBookId={book?.id ?? null}
        currentChapter={currentChapter}
        initialFocusBookId={book?.id ?? null}
        initialOpenBookId={book?.id ?? null}
        locale={locale}
        onSelectChapter={onGoToChapter}
        prefix="reader"
        showTestamentGroups
        t={t}
      />
    </div>
  )
}

function QuickNavigationPopover({ anchorRef, book, chapter: currentChapter, isOpen, onClose, onGoToChapter, returnFocusRef }) {
  const { t } = useI18n()
  const popoverRef = useRef(null)
  const closeRef = useRef(onClose)
  const titleId = useId()
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: null })

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return undefined

    const returnFocusTarget = returnFocusRef ? returnFocusRef.current : document.activeElement
    const updatePosition = () => {
      const anchor = anchorRef?.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      const width = Math.min(352, window.innerWidth - 16)
      const estimatedHeight = popoverRef.current?.offsetHeight ?? Math.min(576, window.innerHeight - 16)
      const spaceBelow = window.innerHeight - rect.bottom - 8
      const spaceAbove = rect.top - 8
      const opensAbove = spaceBelow < Math.min(estimatedHeight, 240) && spaceAbove > spaceBelow
      const top = opensAbove
        ? Math.max(8, rect.top - estimatedHeight - 8)
        : Math.max(8, rect.bottom + 8)
      const availableHeight = Math.max(1, opensAbove ? rect.top - top - 8 : window.innerHeight - top - 8)
      const preferredLeft = rect.left + ((rect.width - width) / 2)
      setPosition({
        top: Math.round(top),
        left: Math.round(Math.max(8, Math.min(preferredLeft, window.innerWidth - width - 8))),
        maxHeight: Math.round(availableHeight),
      })
    }

    updatePosition()
    const focusId = window.requestAnimationFrame(() => {
      focusWithoutScrolling(popoverRef.current?.querySelector('[data-dialog-initial-focus]') ?? getFocusableElements(popoverRef.current ?? document.body)[0])
    })

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !popoverRef.current) return
      const focusable = getFocusableElements(popoverRef.current)
      if (!focusable.length) return
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
      if (popoverRef.current?.contains(event.target) || anchorRef?.current?.contains(event.target)) return
      closeRef.current?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(updatePosition) : null
    if (popoverRef.current) resizeObserver?.observe(popoverRef.current)
    return () => {
      window.cancelAnimationFrame(focusId)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      resizeObserver?.disconnect()
      window.requestAnimationFrame(() => focusWithoutScrolling(returnFocusTarget))
    }
  }, [anchorRef, isOpen, returnFocusRef])

  if (!isOpen) return null

  return (
    <section
      aria-labelledby={titleId}
      className="reader-quick-navigation-popover"
      ref={popoverRef}
      role="dialog"
      style={{ maxHeight: position.maxHeight ? `${position.maxHeight}px` : undefined, top: position.top, left: position.left }}
    >
      <header className="reader-dialog__header">
        <button aria-label={t('common.back')} className="reader-dialog__back" onClick={onClose} type="button">
          <Icon name="arrowLeft" size="sm" />
        </button>
        <h2 id={titleId}>{t('reader.quickNavigation')}</h2>
        <span aria-hidden="true" className="reader-dialog__header-spacer" />
      </header>
      <QuickNavigationContent book={book} chapter={currentChapter} onGoToChapter={onGoToChapter} />
    </section>
  )
}

export function QuickNavigationSheet({ anchorRef, book, chapter: currentChapter, isOpen, onClose, onGoToChapter, returnFocusRef }) {
  return (
    <QuickNavigationPopover
      book={book}
      chapter={currentChapter}
      isOpen={isOpen}
      onClose={onClose}
      onGoToChapter={onGoToChapter}
      anchorRef={anchorRef ?? returnFocusRef}
      returnFocusRef={returnFocusRef}
    />
  )
}
