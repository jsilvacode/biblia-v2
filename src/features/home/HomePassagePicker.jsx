import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { OverlayCloseButton } from '../../components/ui/OverlayCloseButton'
import { useI18n } from '../../i18n'
import { bibleBooks, getLocalizedBookName, normalizeText } from '../bible/catalog'
import { preloadReading } from '../reader/preloadReading'
import { useSettings } from '../settings/SettingsProvider'
import { createPickerPositionScheduler, positionPickerMenu, revealPickerAnchor } from './pickerPosition'
import styles from './HomePassagePicker.module.css'

const MENU_HEIGHT = 324
const TYPEAHEAD_TIMEOUT = 700
const BOOK_REVEAL_MARGIN = 8

function BookAccordion({ book, expanded, currentBookId, currentChapter, id, locale, t, onToggle, onBookKeyDown, onKeyUp, onChapterKeyDown, onRead, onWarmChapter }) {
  const name = getLocalizedBookName(book, locale)
  return (
    <div className={`${styles.book}${expanded ? ` ${styles.expandedBook}` : ''}`}>
      <div className={styles.bookBar}>
        <button aria-controls={`${id}-chapters-${book.id}`} aria-current={book.id === currentBookId ? 'true' : undefined} aria-expanded={expanded} className={styles.bookToggle} data-book-id={book.id} onClick={() => onToggle(book.id)} onKeyDown={(event) => onBookKeyDown(event, book.id)} onKeyUp={onKeyUp} type="button">
          <span>{name}</span>{' '}<small>{t('bible.shortChapterCount', { count: book.chapters })}</small>
        </button>
        {expanded && <OverlayCloseButton label={`${t('common.close')}: ${name}`} onClose={() => onToggle(book.id)} />}
      </div>
      <div aria-label={`${name} · ${t('bible.chapters')}`} className={styles.chapterGrid} hidden={!expanded} id={`${id}-chapters-${book.id}`} onKeyDown={onChapterKeyDown}>
        {expanded && Array.from({ length: book.chapters }, (_, index) => index + 1).map((chapter) => (
          <button aria-current={book.id === currentBookId && chapter === currentChapter ? 'page' : undefined} aria-label={t('bible.openReference', { reference: `${name} ${chapter}` })} data-chapter={chapter} key={chapter} onClick={() => onRead(book.id, chapter)} onFocus={() => onWarmChapter(book.id, chapter)} onPointerDown={() => onWarmChapter(book.id, chapter)} type="button">{chapter}</button>
        ))}
      </div>
    </div>
  )
}

// Books and chapters share a non-modal disclosure. A listbox cannot contain
// an accordion of interactive chapter buttons; keep every action native.
export function HomePassagePicker({ onGoToChapter, compact = false, bookTriggerRef, onOpenChange, currentBookId = null, currentChapter = null }) {
  const { locale, t } = useI18n()
  const { settings } = useSettings()
  const id = useId()
  const currentBook = bibleBooks.find((book) => book.id === Number(currentBookId))
  const chapter = Number(currentChapter)
  const [isOpen, setIsOpen] = useState(false)
  const [expandedBook, setExpandedBook] = useState(null)
  const [activeTestament, setActiveTestament] = useState(() => currentBook?.testament ?? 'OT')
  const visibleBooks = bibleBooks.filter((book) => book.testament === activeTestament)
  const expandedBookData = visibleBooks.find((book) => book.id === expandedBook)
  const menuHeading = expandedBookData ? `${getLocalizedBookName(expandedBookData, locale)} · ${t('bible.chapters')}` : t('home.chooseReading')
  const rootRef = useRef(null)
  const anchorRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const openRef = useRef(false)
  const openChangeRef = useRef(onOpenChange)
  const revealBookRef = useRef(null)
  const focusBookRef = useRef(null)
  const typeahead = useRef({ text: '', at: 0 })
  const pointerInsideRef = useRef(false)

  useEffect(() => { openChangeRef.current = onOpenChange }, [onOpenChange])
  useEffect(() => () => {
    if (openRef.current) openChangeRef.current?.(false)
  }, [])

  const close = useCallback((restoreFocus = false) => {
    if (!openRef.current) return
    openRef.current = false
    setIsOpen(false)
    typeahead.current = { text: '', at: 0 }
    openChangeRef.current?.(false)
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true })
  }, [])

  function open(focusBook = null, focusFromKeyboard = false) {
    const target = bibleBooks.find((book) => book.id === (focusBook ?? currentBook?.id ?? expandedBook)) ?? visibleBooks[0]
    revealPickerAnchor(anchorRef.current)
    setActiveTestament(target.testament)
    if (currentBook || target.testament !== activeTestament) setExpandedBook(null)
    focusBookRef.current = focusBook ?? (focusFromKeyboard ? target.id : null)
    revealBookRef.current = target.id
    openRef.current = true
    setIsOpen(true)
    typeahead.current = { text: '', at: 0 }
    openChangeRef.current?.(true)
  }

  function revealBook(bookId) {
    const menu = menuRef.current
    const button = menu?.querySelector(`[data-book-id="${bookId}"]`)
    if (!menu || !button) return
    const headerHeight = menu.querySelector('header')?.offsetHeight ?? 44
    const top = menu.getBoundingClientRect().top + menu.clientTop + headerHeight + BOOK_REVEAL_MARGIN
    menu.scrollTop += button.getBoundingClientRect().top - top
  }

  useLayoutEffect(() => {
    if (!isOpen) return undefined
    if (!positionPickerMenu(menuRef.current, anchorRef.current, MENU_HEIGHT)) {
      const frame = requestAnimationFrame(() => close())
      return () => cancelAnimationFrame(frame)
    }
    const focusBook = focusBookRef.current
    if (revealBookRef.current !== null) revealBook(revealBookRef.current)
    if (focusBook) menuRef.current?.querySelector(`[data-book-id="${focusBook}"]`)?.focus({ preventScroll: true })
    revealBookRef.current = null
    focusBookRef.current = null
    return undefined
  }, [isOpen, expandedBook, activeTestament, close])

  useEffect(() => {
    if (!isOpen) return undefined
    const scheduler = createPickerPositionScheduler(() => {
      if (!positionPickerMenu(menuRef.current, anchorRef.current, MENU_HEIGHT)) close()
    })
    const reposition = scheduler.request
    const dismiss = (event) => {
      if (!rootRef.current?.contains(event.target)) close()
    }
    const viewport = window.visualViewport
    document.addEventListener('pointerdown', dismiss)
    window.addEventListener('resize', reposition, { passive: true })
    window.addEventListener('scroll', reposition, { passive: true })
    viewport?.addEventListener('resize', reposition)
    viewport?.addEventListener('scroll', reposition)
    return () => {
      scheduler.cancel()
      document.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition)
      viewport?.removeEventListener('resize', reposition)
      viewport?.removeEventListener('scroll', reposition)
    }
  }, [isOpen, close])

  function toggleBook(bookId) {
    revealBookRef.current = bookId
    focusBookRef.current = bookId
    setExpandedBook((current) => current === bookId ? null : bookId)
  }

  function focusBook(bookId) {
    const book = bibleBooks.find((entry) => entry.id === bookId)
    if (!book) return
    if (book.testament !== activeTestament) {
      focusBookRef.current = bookId
      revealBookRef.current = bookId
      setExpandedBook(null)
      setActiveTestament(book.testament)
      return
    }
    revealBook(bookId)
    menuRef.current?.querySelector(`[data-book-id="${bookId}"]`)?.focus({ preventScroll: true })
  }

  function changeTestament(testament) {
    if (testament === activeTestament) return
    typeahead.current = { text: '', at: 0 }
    revealBookRef.current = currentBook?.testament === testament
      ? currentBook.id
      : bibleBooks.find((book) => book.testament === testament).id
    focusBookRef.current = null
    setExpandedBook(null)
    setActiveTestament(testament)
  }

  function handleTestamentNavigation(event) {
    const { key } = event
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
      event.preventDefault()
      const testament = key === 'ArrowLeft' || key === 'Home' ? 'OT' : 'NT'
      changeTestament(testament)
      menuRef.current?.querySelector(`[data-testament="${testament}"]`)?.focus({ preventScroll: true })
    } else if (key === 'ArrowDown') {
      event.preventDefault()
      focusBook(expandedBook ?? (currentBook?.testament === activeTestament ? currentBook.id : visibleBooks[0].id))
    } else handleBookNavigation(event)
  }

  function handleBookNavigation(event, bookId = null) {
    const { key } = event
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(key)) {
      event.preventDefault()
      typeahead.current = { text: '', at: 0 }
      const current = Math.max(0, visibleBooks.findIndex((book) => book.id === (bookId ?? expandedBook ?? currentBook?.id)))
      const next = key === 'Home' ? 0 : key === 'End' ? visibleBooks.length - 1
        : current + (key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : key === 'PageDown' ? 6 : -6)
      if (!isOpen) open(key === 'Home' ? visibleBooks[0].id : key === 'End' ? visibleBooks.at(-1).id
        : currentBook?.id ?? visibleBooks[key === 'ArrowUp' ? visibleBooks.length - 1 : 0].id)
      else focusBook(visibleBooks[Math.max(0, Math.min(visibleBooks.length - 1, next))].id)
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
      && (key !== ' ' || typeahead.current.text && event.timeStamp - typeahead.current.at < TYPEAHEAD_TIMEOUT)) {
      event.preventDefault()
      const text = (event.timeStamp - typeahead.current.at < TYPEAHEAD_TIMEOUT ? typeahead.current.text : '') + key
      const query = normalizeText(text)
      const found = bibleBooks.find((book) => normalizeText(getLocalizedBookName(book, locale)).startsWith(query))
      if (!isOpen) open(found?.id ?? null)
      else if (found) focusBook(found.id)
      typeahead.current = { text, at: event.timeStamp }
    }
  }

  function warmChapter(book, chapter) {
    preloadReading({ book, chapter }, settings.bibleVersion)
  }

  function readChapter(book, chapter) {
    close()
    onGoToChapter(book, chapter)
  }

  function handleKeyUp(event) {
    if (event.key === ' ' && typeahead.current.text && event.timeStamp - typeahead.current.at < TYPEAHEAD_TIMEOUT) event.preventDefault()
  }

  function handleChapterNavigation(event) {
    const grid = event.currentTarget
    const buttons = [...grid.querySelectorAll('button')]
    const current = buttons.indexOf(event.target)
    if (current < 0) return
    const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length
    const offset = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }[event.key]
    if (offset || event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : Math.max(0, Math.min(buttons.length - 1, current + offset))
      buttons[index]?.focus({ preventScroll: true })
      buttons[index]?.scrollIntoView({ block: 'nearest' })
    }
  }

  return (
    <div
      aria-label={t('home.chooseReading')}
      className={`${styles.picker}${compact ? ` ${styles.compact}` : ''}`}
      data-testid={compact ? 'reader-passage-picker' : 'home-reading-actions'}
      onBlur={(event) => {
        // Safari focuses the nearest focusable ancestor instead of a tapped
        // button. Keep the popup alive until its own pointer click completes.
        if (!pointerInsideRef.current && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) close()
      }}
      onPointerDownCapture={() => { pointerInsideRef.current = true }}
      onPointerCancel={() => { pointerInsideRef.current = false }}
      onClickCapture={() => { pointerInsideRef.current = false }}
      onKeyDown={(event) => {
        pointerInsideRef.current = false
        if (event.key === 'Escape' && isOpen) { event.preventDefault(); event.stopPropagation(); close(true) }
      }}
      ref={rootRef}
    >
      <div className={`${styles.control} ${styles.bookControl}`} data-picker-field="book" ref={anchorRef}>
        <button
          aria-controls={`${id}-books`} aria-expanded={isOpen} aria-haspopup="dialog"
          className={`${styles.trigger} ${styles.bookTrigger}`} data-picker-trigger="book"
          onClick={(event) => isOpen ? close() : open(null, event.detail === 0)}
          onKeyDown={(event) => handleBookNavigation(event)}
          onKeyUp={handleKeyUp}
          ref={(node) => { triggerRef.current = node; if (bookTriggerRef) bookTriggerRef.current = node }}
          type="button"
        >
          <Icon name="bookOpen" size={18} />
          <span className={styles.value}>{t('home.selectBook')}</span>
          <Icon name="chevronDown" size={17} />
        </button>
        {isOpen && (
          <div aria-label={t('home.chooseReading')} className={`${styles.menu} ${styles.bookMenu}`} data-height-limit={MENU_HEIGHT} data-picker-menu="book" id={`${id}-books`} ref={menuRef} role="dialog">
            <header className={styles.menuHeader}>
              <div className={styles.menuHeading}><span>{menuHeading}</span><OverlayCloseButton onClose={() => close(true)} /></div>
              <div aria-label={`${t('bible.oldTestament')} / ${t('bible.newTestament')}`} className={styles.testamentSwitch} role="group">
                {['OT', 'NT'].map((testament) => (
                  <button aria-controls={`${id}-book-list`} aria-label={t(testament === 'OT' ? 'bible.oldTestament' : 'bible.newTestament')} aria-pressed={activeTestament === testament} data-testament={testament} key={testament} onClick={() => changeTestament(testament)} onKeyDown={handleTestamentNavigation} onKeyUp={handleKeyUp} type="button">{testament === 'OT' && locale !== 'en' ? 'AT' : testament}</button>
                ))}
              </div>
            </header>
            <section aria-labelledby={`${id}-${activeTestament}`} id={`${id}-book-list`}>
              <h3 className={styles.groupLabel} id={`${id}-${activeTestament}`}>{t(activeTestament === 'OT' ? 'bible.oldTestament' : 'bible.newTestament')}</h3>
              {visibleBooks.map((book) => (
                <BookAccordion book={book} expanded={expandedBook === book.id} currentBookId={currentBook?.id} currentChapter={chapter} id={id} key={book.id} locale={locale} onBookKeyDown={handleBookNavigation} onChapterKeyDown={handleChapterNavigation} onKeyUp={handleKeyUp} onRead={readChapter} onToggle={toggleBook} onWarmChapter={warmChapter} t={t} />
              ))}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
