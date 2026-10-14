import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { useBibleTextSearch } from '../search/useBibleTextSearch'
import { useSettings } from '../settings/SettingsProvider'
import { BookChaptersDialog } from './BookChaptersDialog'
import { getAllLocalizedBookNames } from './bookNames'
import { bookCollections } from './bookCollections'
import { bibleBooks, formatReference, getBook, getLocalizedBookName, normalizeText } from './catalog'
import { parseReference } from './reference'
import styles from './BibleNavigator.module.css'

const testamentCounts = { OT: 39, NT: 27 }

function getBookSearchValues(book) {
  return [...getAllLocalizedBookNames(book), book.abbrev, book.slug]
    .filter(Boolean)
    .map(normalizeText)
}

function referencePath(reference) {
  return `/read/${reference.book}/${reference.chapter}${reference.verse ? `/${reference.verse}` : ''}`
}

export function BibleNavigator({
  currentBookId = null,
  currentChapter = null,
  initialTestament = 'NT',
}) {
  const { locale, t } = useI18n()
  const { settings } = useSettings()
  const currentBook = getBook(currentBookId)
  const [testament, setTestament] = useState(currentBook?.testament ?? initialTestament)
  const [query, setQuery] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)
  const bookTriggerRef = useRef(null)
  const normalizedQuery = normalizeText(query)
  const parsedReference = useMemo(() => parseReference(query), [query])
  const textSearchEnabled = normalizedQuery.length >= 2 && !parsedReference
  const textSearch = useBibleTextSearch({
    debounceMs: 180,
    enabled: textSearchEnabled,
    query,
    translationId: settings.bibleVersion,
  })
  const collections = bookCollections.filter((collection) => collection.testament === testament)

  const visibleBooks = useMemo(() => {
    if (!normalizedQuery) return bibleBooks.filter((book) => book.testament === testament)
    return bibleBooks.filter((book) => getBookSearchValues(book).some((value) => value.includes(normalizedQuery)))
  }, [normalizedQuery, testament])

  function selectTestament(nextTestament) {
    setTestament(nextTestament)
    setQuery('')
  }

  function renderBookButton(book) {
    return (
      <button
        aria-current={book.id === currentBookId ? 'true' : undefined}
        aria-haspopup="dialog"
        aria-expanded={book.id === selectedBook?.id}
        data-book-id={book.id}
        key={book.id}
        onClick={(event) => {
          bookTriggerRef.current = event.currentTarget
          setSelectedBook(book)
        }}
        type="button"
      >
        <span>{getLocalizedBookName(book, locale)}</span>
        <small aria-label={t('bible.chapterCount', { count: book.chapters })}>{t('bible.shortChapterCount', { count: book.chapters })}</small>
        <Icon name="chevronRight" size={16} />
      </button>
    )
  }

  function renderVerseResult(result) {
    const content = (
      <>
        <span className={styles.verseResultCopy}>
          <strong>{formatReference(result, locale)}</strong>
          <small>{result.text}</small>
        </span>
        <Icon name="arrowRight" size={17} />
      </>
    )
    const className = styles.verseResult
    const key = `${result.book}:${result.chapter}:${result.verse}`

    return (
      <Link className={className} key={key} state={{ attentionVerse: true }} to={referencePath(result)}>{content}</Link>
    )
  }

  return (
    <div className={styles.navigator}>
      <div className={styles.controls}>
        <label className={styles.searchField}>
          <span className="sr-only">{t('bible.searchLabel')}</span>
          <Icon name="search" size={18} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('bible.searchPlaceholder')}
            type="search"
            value={query}
          />
        </label>

        <div aria-label={t('bible.testaments')} className={styles.testaments} role="group">
          {['OT', 'NT'].map((value) => (
            <button
              aria-pressed={!normalizedQuery && testament === value}
              className={!normalizedQuery && testament === value ? styles.testamentSelected : undefined}
              key={value}
              onClick={() => selectTestament(value)}
              type="button"
            >
              <span>{t(value === 'OT' ? 'bible.oldTestament' : 'bible.newTestament')}</span>
              <small>{testamentCounts[value]}</small>
            </button>
          ))}
        </div>
      </div>

      {parsedReference && (
        <div className={styles.referenceResult}>
          <Link to={referencePath(parsedReference)}>
            <Icon name="bookOpen" size={18} />
            <span>{t('bible.openReference', { reference: formatReference(parsedReference, locale) })}</span>
            <Icon name="arrowRight" size={17} />
          </Link>
        </div>
      )}

      {!parsedReference && <div>
        {normalizedQuery ? (
          <section aria-label={t('bible.searchResults')} className={styles.searchPane}>
            {visibleBooks.length > 0 && (
              <div className={styles.searchGroup}>
                <p className={styles.resultContext}>{t('bible.bookMatches')}</p>
                <div className={`${styles.bookGrid} ${styles.searchBookGrid}`}>
                  {visibleBooks.map(renderBookButton)}
                </div>
              </div>
            )}

            <div aria-live="polite" className={styles.searchGroup}>
              <p className={styles.resultContext}>{t('bible.verseMatches')}</p>
              {!textSearchEnabled ? (
                <p className={styles.searchMessage}>{t('bible.typeMoreToSearch')}</p>
              ) : textSearch.status === 'loading' ? (
                <p className={styles.searchMessage}>{t('search.loading')}</p>
              ) : textSearch.status === 'error' ? (
                <p className={styles.searchMessage}>{t('search.error')}</p>
              ) : textSearch.results.length ? (
                <>
                  <p className={styles.verseResultCount}>
                    {t('search.showingResults', { shown: textSearch.results.length, total: textSearch.total })}
                  </p>
                  <div className={styles.verseResults}>{textSearch.results.map(renderVerseResult)}</div>
                  {textSearch.hasMore && (
                    <button
                      className={styles.loadMore}
                      disabled={textSearch.isLoadingMore}
                      onClick={textSearch.loadMore}
                      type="button"
                    >
                      {textSearch.isLoadingMore ? t('search.loading') : t('search.showMore')}
                    </button>
                  )}
                  {textSearch.loadMoreError && <p className={styles.loadMoreError} role="alert">{t('search.error')}</p>}
                </>
              ) : (
                <p className={styles.searchMessage}>{t('search.noResults')}</p>
              )}
            </div>
          </section>
        ) : (
          <div aria-label={t('bible.books')} className={styles.collections} role="region">
            {collections.map((collection) => (
              <section aria-labelledby={`collection-${collection.id}`} className={styles.collection} key={collection.id}>
                <header className={styles.collectionHeading}>
                  <h2 id={`collection-${collection.id}`}>{t(`bible.collections.${collection.key}`)}</h2>
                  <span>{t(collection.books.length === 1 ? 'bible.bookCountOne' : 'bible.bookCount', { count: collection.books.length })}</span>
                </header>
                <div className={styles.bookGrid}>{collection.books.map(renderBookButton)}</div>
              </section>
            ))}
          </div>
        )}
      </div>}
      {selectedBook && (
        <BookChaptersDialog
          book={selectedBook}
          currentBookId={currentBookId}
          currentChapter={currentChapter}
          onClose={() => setSelectedBook(null)}
          returnFocusRef={bookTriggerRef}
        />
      )}
    </div>
  )
}
