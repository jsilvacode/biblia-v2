import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { BookChaptersDialog } from '../bible/BookChaptersDialog'
import { findMatchingBooks } from '../bible/bookSearch'
import { formatReference, getLocalizedBookName, normalizeText } from '../bible/catalog'
import { parseReference } from '../bible/reference'
import { useBibleTextSearch } from '../search/useBibleTextSearch'
import { useSettings } from '../settings/SettingsProvider'
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
  const inputRef = useRef(null)
  const bookTriggerRef = useRef(null)
  const activeQuery = query.trim()
  const showResults = normalizeText(activeQuery).length >= 2
  const reference = parseReference(activeQuery)
  const books = showResults && !reference ? findMatchingBooks(activeQuery) : []
  const search = useBibleTextSearch({
    debounceMs: 220,
    enabled: showResults && !reference && !books.length,
    pageSize: 3,
    query: activeQuery,
    translationId: settings.bibleVersion,
  })
  const resultsPath = `/${books.length ? 'bible' : 'search'}?q=${encodeURIComponent(activeQuery)}`

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
    <section aria-label={t('home.quickSearch')} className={styles.search}>
      <form className={styles.form} onSubmit={submit} role="search">
        <Icon name="search" size={20} />
        <input aria-label={t('bible.searchLabel')} onChange={(event) => setQuery(event.target.value)} placeholder={t('bible.searchPlaceholder')} ref={inputRef} type="search" value={query} />
        <button aria-label={t('common.search')} disabled={!activeQuery} type="submit"><Icon name="arrowRight" size={19} /></button>
      </form>
      {showResults && (
        <div aria-label={t('bible.searchResults')} className={styles.results} role="region">
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
