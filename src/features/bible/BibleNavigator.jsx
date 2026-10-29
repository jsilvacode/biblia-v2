import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { useBibleTextSearch } from '../search/useBibleTextSearch'
import { useSettings } from '../settings/SettingsProvider'
import { BibleCategoryFilters } from './BibleCategoryFilters'
import { BookChaptersDialog } from './BookChaptersDialog'
import { findMatchingBooks } from './bookSearch'
import { bibleCategories } from './bibleCategories'
import { formatReference, getLocalizedBookName, normalizeText } from './catalog'
import { getReaderPath } from './readerPath'
import { parseReference } from './reference'
import styles from './BibleNavigator.module.css'

export function BibleNavigator({
  currentBookId = null,
  currentChapter = null,
}) {
  const { locale, t } = useI18n()
  const { settings } = useSettings()
  const [searchParams] = useSearchParams()
  const [categoryId, setCategoryId] = useState('all')
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
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
  const selectedCategory = bibleCategories.find((category) => category.id === categoryId) ?? bibleCategories[0]
  const bookGroups = ['OT', 'NT'].map((testament) => ({
    testament,
    books: selectedCategory.books.filter((book) => book.testament === testament),
  })).filter((group) => group.books.length)

  const visibleBooks = useMemo(() => findMatchingBooks(normalizedQuery), [normalizedQuery])

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
        <span aria-hidden="true" className={styles.bookNumber}>{String(book.id).padStart(2, '0')}</span>
        <span className={styles.bookName}>{getLocalizedBookName(book, locale)}</span>
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
      <Link className={className} key={key} state={{ attentionVerse: true }} to={getReaderPath(result)}>{content}</Link>
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

        <BibleCategoryFilters
          categories={bibleCategories}
          onSelect={(category) => { setCategoryId(category.id); setQuery('') }}
          selected={normalizedQuery ? bibleCategories[0] : selectedCategory}
        />
      </div>

      {normalizedQuery && <p className={styles.searchScope}>{t('bible.searchingAllBooks')}</p>}

      {parsedReference && (
        <div className={styles.referenceResult}>
          <Link to={getReaderPath(parsedReference)}>
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
                <><p className={styles.searchMessage} role="alert">{t('search.error')}</p><button className="button button--compact" onClick={textSearch.retry} type="button">{t('reader.retry')}</button></>
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
          <section aria-labelledby="bible-results-title" className={styles.results} id="bible-book-results">
            <header className={styles.resultsHeading}>
              <h2 id="bible-results-title">{t(selectedCategory.labelKey)}</h2>
              <p aria-live="polite" aria-atomic="true">{t('bible.filteredBookCount', { count: selectedCategory.books.length })}</p>

            </header>
            {bookGroups.map((group) => (
              <section
                aria-label={t(group.testament === 'OT' ? 'bible.oldTestament' : 'bible.newTestament')}
                className={styles.bookGroup}
                key={group.testament}
              >
                {bookGroups.length > 1 && <header className={styles.groupHeading}>
                  <h3>{t(group.testament === 'OT' ? 'bible.oldTestament' : 'bible.newTestament')}</h3>
                  <span>{t(group.books.length === 1 ? 'bible.bookCountOne' : 'bible.bookCount', { count: group.books.length })}</span>
                </header>
                }
                <div className={styles.bookGrid}>{group.books.map(renderBookButton)}</div>
              </section>
            ))}
          </section>
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
