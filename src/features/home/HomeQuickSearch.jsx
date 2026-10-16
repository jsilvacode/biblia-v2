import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { OverlayCloseButton } from '../../components/ui/OverlayCloseButton'
import { useI18n } from '../../i18n'
import { BookChaptersDialog } from '../bible/BookChaptersDialog'
import { findMatchingBooks } from '../bible/bookSearch'
import { formatReference, getLocalizedBookName, normalizeText } from '../bible/catalog'
import { parseReference } from '../bible/reference'
import { useBibleTextSearch } from '../search/useBibleTextSearch'
import { useSettings } from '../settings/SettingsProvider'
import { positionPickerMenu, revealPickerAnchor } from './pickerPosition'
import styles from './HomeQuickSearch.module.css'

function readerPath(reference) {
  return `/read/${reference.book}/${reference.chapter}${reference.verse ? `/${reference.verse}` : ''}`
}

export function HomeQuickSearch({ compact = false, currentBookId, currentChapter, inputRef: forwardedInputRef, onGoToChapter, onOpenChange }) {
  const { locale, t } = useI18n()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)
  const [resultsOpen, setResultsOpen] = useState(false)
  const localInputRef = useRef(null)
  const inputRef = forwardedInputRef ?? localInputRef
  const bookTriggerRef = useRef(null)
  const searchRef = useRef(null)
  const formRef = useRef(null)
  const resultsRef = useRef(null)
  const openChangeRef = useRef(onOpenChange)
  const pointerInsideRef = useRef(false)
  const activeQuery = query.trim()
  const hasSearchQuery = normalizeText(activeQuery).length >= 2
  const showResults = hasSearchQuery && resultsOpen
  const reference = parseReference(activeQuery)
  const books = hasSearchQuery && !reference ? findMatchingBooks(activeQuery) : []
  const search = useBibleTextSearch({
    debounceMs: 220,
    enabled: showResults && !reference && !books.length,
    pageSize: 3,
    query: activeQuery,
    translationId: settings.bibleVersion,
  })
  const resultsPath = `/${books.length ? 'bible' : 'search'}?q=${encodeURIComponent(activeQuery)}`

  useEffect(() => { openChangeRef.current = onOpenChange }, [onOpenChange])
  useEffect(() => {
    openChangeRef.current?.(showResults || Boolean(selectedBook))
    return () => openChangeRef.current?.(false)
  }, [showResults, selectedBook])

  function closeResults() {
    inputRef.current?.focus({ preventScroll: true })
    setResultsOpen(false)
  }

  useLayoutEffect(() => {
    if (showResults) {
      if (document.activeElement === inputRef.current) revealPickerAnchor(formRef.current)
      positionPickerMenu(resultsRef.current, formRef.current)
    }
  }, [activeQuery, inputRef, showResults, search.status, search.results])

  useEffect(() => {
    if (!showResults || selectedBook) return undefined
    const reposition = () => positionPickerMenu(resultsRef.current, formRef.current)
    const resize = () => {
      if (document.activeElement === inputRef.current) revealPickerAnchor(formRef.current)
      reposition()
    }
    const dismiss = (event) => {
      if (!searchRef.current?.contains(event.target)) setResultsOpen(false)
    }
    const viewport = window.visualViewport
    document.addEventListener('pointerdown', dismiss)
    window.addEventListener('scroll', reposition, { passive: true })
    window.addEventListener('resize', resize, { passive: true })
    viewport?.addEventListener('resize', resize)
    viewport?.addEventListener('scroll', reposition)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('scroll', reposition)
      window.removeEventListener('resize', resize)
      viewport?.removeEventListener('resize', resize)
      viewport?.removeEventListener('scroll', reposition)
    }
  }, [inputRef, showResults, selectedBook])

  function submit(event) {
    event.preventDefault()
    if (!activeQuery) return
    if (reference) { setResultsOpen(false); onGoToChapter(reference.book, reference.chapter, reference.verse); return }
    const exactBook = findMatchingBooks(activeQuery, { exact: true })[0]
    if (exactBook) {
      bookTriggerRef.current = inputRef.current
      setSelectedBook(exactBook)
    } else navigate(resultsPath)
  }

  function renderReference(result, text) {
    return (
      <Link className={styles.result} key={`${result.book}:${result.chapter}:${result.verse}`} onClick={(event) => {
        if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
          event.preventDefault()
          setResultsOpen(false)
          onGoToChapter(result.book, result.chapter, result.verse)
        }
      }} state={{ attentionVerse: true }} to={readerPath(result)}>
        <span><strong>{formatReference(result, locale)}</strong>{text && <small>{text}</small>}</span>
      </Link>
    )
  }

  return (
    <section
      aria-label={t('home.quickSearch')}
      className={`${styles.search}${compact ? ` ${styles.compact}` : ''}`}
      onBlur={(event) => {
        if (!pointerInsideRef.current && !selectedBook && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setResultsOpen(false)
      }}
      onPointerDownCapture={() => { pointerInsideRef.current = true }}
      onPointerCancel={() => { pointerInsideRef.current = false }}
      onClickCapture={() => { pointerInsideRef.current = false }}
      onKeyDown={(event) => {
        pointerInsideRef.current = false
        if (event.key === 'Escape' && !selectedBook && showResults) {
          event.preventDefault()
          inputRef.current?.focus({ preventScroll: true })
          setResultsOpen(false)
        }
      }}
      ref={searchRef}
    >
      <form className={styles.form} onSubmit={submit} ref={formRef} role="search">
        <Icon name="search" size={20} />
        <input aria-label={t('bible.searchLabel')} onChange={(event) => { setQuery(event.target.value); setResultsOpen(true) }} onFocus={() => setResultsOpen(true)} placeholder={t('home.searchPlaceholder')} ref={inputRef} type="search" value={query} />
        <button aria-label={t('common.search')} disabled={!activeQuery} type="submit"><Icon className={styles.submitIcon} name="search" size={20} /><span className={styles.submitLabel}>{t('common.search')}</span></button>
      </form>
      {showResults && (
        <div aria-label={t('bible.searchResults')} className={styles.results} ref={resultsRef} role="region">
          <header className={styles.resultsHeader}><span>{t('bible.searchResults')}</span><OverlayCloseButton onClose={closeResults} /></header>
          {reference ? renderReference(reference, t('search.openReference')) : books.length ? books.slice(0, 3).map((book) => (
            <button className={styles.result} key={book.id} onClick={(event) => { bookTriggerRef.current = event.currentTarget; setSelectedBook(book) }} type="button">
              <span><strong>{getLocalizedBookName(book, locale)}</strong><small>{t('bible.chapterCount', { count: book.chapters })}</small></span>
            </button>
          )) : search.status === 'loading' ? <p role="status">{t('search.loading')}</p>
            : search.status === 'error' ? <p role="alert">{t('search.error')}</p>
              : search.results.length ? search.results.map((result) => renderReference(result, result.text))
                : <p role="status">{t('search.noResults')}</p>}
          {!reference && (books.length > 3 || !books.length && search.results.length > 0) && (
            <Link className={styles.more} to={resultsPath}>{t('search.showMore')}</Link>
          )}
        </div>
      )}
      {selectedBook && <BookChaptersDialog book={selectedBook} currentBookId={currentBookId} currentChapter={currentChapter} onClose={() => setSelectedBook(null)} onGoToChapter={onGoToChapter} returnFocusRef={bookTriggerRef} />}
    </section>
  )
}
