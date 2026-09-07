import { useEffect, useId, useRef } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { bibleBooks } from '../bible/catalog'
import { BookChapterAccordion } from '../bible/BookChapterAccordion'
import { useAnchoredPopover } from './useAnchoredPopover'

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
  const titleId = useId()
  const position = useAnchoredPopover({
    anchorRef,
    isOpen,
    onClose,
    panelRef: popoverRef,
    resolvePosition: ({ anchor, panel }) => {
      const rect = anchor.getBoundingClientRect()
      const width = Math.min(352, window.innerWidth - 16)
      const estimatedHeight = panel.offsetHeight || Math.min(576, window.innerHeight - 16)
      const spaceBelow = window.innerHeight - rect.bottom - 8
      const spaceAbove = rect.top - 8
      const opensAbove = spaceBelow < Math.min(estimatedHeight, 240) && spaceAbove > spaceBelow
      const top = opensAbove
        ? Math.max(8, rect.top - estimatedHeight - 8)
        : Math.max(8, rect.bottom + 8)
      const availableHeight = Math.max(1, opensAbove ? rect.top - top - 8 : window.innerHeight - top - 8)
      const preferredLeft = rect.left + ((rect.width - width) / 2)
      return {
        top: Math.round(top),
        left: Math.round(Math.max(8, Math.min(preferredLeft, window.innerWidth - width - 8))),
        maxHeight: Math.round(availableHeight),
      }
    },
    returnFocusRef,
  })

  if (!isOpen) return null

  return (
    <section
      aria-labelledby={titleId}
      className="reader-quick-navigation-popover"
      ref={popoverRef}
      role="dialog"
      style={{ maxHeight: position?.maxHeight ? `${position.maxHeight}px` : undefined, top: position?.top ?? 0, left: position?.left ?? 0 }}
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
