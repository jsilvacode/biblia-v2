import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
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

export function HomeQuickSearch({ currentBookId, currentChapter, onGoToChapter }) {
  const { locale, t } = useI18n()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)
  const [resultsOpen, setResultsOpen] = useState(false)
  const inputRef = useRef(null)
  const bookTriggerRef = useRef(null)
  const searchRef = useRef(null)
  const formRef = useRef(null)
  const resultsRef = useRef(null)
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

  useLayoutEffect(() => {
    if (showResults) {
      if (document.activeElement === inputRef.current) revealPickerAnchor(formRef.current)
      positionPickerMenu(resultsRef.current, formRef.current)
    }
  }, [activeQuery, showResults, search.status, search.results])

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
  }, [showResults, selectedBook])

  function submit(event) {
    event.preventDefault()
    if (!activeQuery) return
    if (reference) { onGoToChapter(reference.book, reference.chapter, reference.verse); return }
    const exactBook = findMatchingBooks(activeQuery, { exact: true })[0]
    if (exactBook) {
      bookTriggerRef.current = inputRef.current
      setSelectedBook(exactBook)
    } else navigate(resultsPath)
  }

  function renderReference(result, text) {
    return (
      <Link className={styles.result} key={`${result.book}:${result.chapter}:${result.verse}`} state={{ attentionVerse: true }} to={readerPath(result)}>
        <span><strong>{formatReference(result, locale)}</strong>{text && <small>{text}</small>}</span>
        <Icon name="arrowRight" size={16} />
      </Link>
    )
  }

  return (
    <section
      aria-label={t('home.quickSearch')}
      className={styles.search}
      onBlur={(event) => {
        if (!selectedBook && !event.currentTarget.contains(event.relatedTarget)) setResultsOpen(false)
      }}
      onKeyDown={(event) => {
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
        <input aria-label={t('bible.searchLabel')} onChange={(event) => { setQuery(event.target.value); setResultsOpen(true) }} onFocus={() => setResultsOpen(true)} placeholder={t('bible.searchPlaceholder')} ref={inputRef} type="search" value={query} />
        <button aria-label={t('common.search')} disabled={!activeQuery} type="submit"><Icon name="arrowRight" size={19} /></button>
      </form>
      {showResults && (
        <div aria-label={t('bible.searchResults')} className={styles.results} ref={resultsRef} role="region">
          {reference ? renderReference(reference, t('search.openReference')) : books.length ? books.slice(0, 3).map((book) => (
            <button className={styles.result} key={book.id} onClick={(event) => { bookTriggerRef.current = event.currentTarget; setSelectedBook(book) }} type="button">
              <span><strong>{getLocalizedBookName(book, locale)}</strong><small>{t('bible.chapterCount', { count: book.chapters })}</small></span>
              <Icon name="chevronRight" size={16} />
            </button>
          )) : search.status === 'loading' ? <p role="status">{t('search.loading')}</p>
            : search.status === 'error' ? <p role="alert">{t('search.error')}</p>
              : search.results.length ? search.results.map((result) => renderReference(result, result.text))
                : <p role="status">{t('search.noResults')}</p>}
          {!reference && (books.length > 3 || !books.length && search.results.length > 0) && (
            <Link className={styles.more} to={resultsPath}>{t('search.showMore')}<Icon name="arrowRight" size={14} /></Link>
          )}
        </div>
      )}
      {selectedBook && <BookChaptersDialog book={selectedBook} currentBookId={currentBookId} currentChapter={currentChapter} onClose={() => setSelectedBook(null)} returnFocusRef={bookTriggerRef} />}
    </section>
  )
}
