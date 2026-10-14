import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { useBibleTextSearch } from '../search/useBibleTextSearch'
import { useSettings } from '../settings/SettingsProvider'
import { BookChaptersDialog } from './BookChaptersDialog'
import { getAllLocalizedBookNames } from './bookNames'
import { bibleCategories } from './bibleCategories'
import { bibleBooks, formatReference, getLocalizedBookName, normalizeText } from './catalog'
import { parseReference } from './reference'
import styles from './BibleNavigator.module.css'

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
}) {
  const { locale, t } = useI18n()
  const { settings } = useSettings()
  const [categorySelection, setCategorySelection] = useState({ id: 'all', revealBooks: false })
  const categoryId = categorySelection.id
  const [query, setQuery] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)
  const bookTriggerRef = useRef(null)
  const categoriesRef = useRef(null)
  const resultsRef = useRef(null)
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

  const visibleBooks = useMemo(() => {
    if (!normalizedQuery) return []
    return bibleBooks.filter((book) => getBookSearchValues(book).some((value) => value.includes(normalizedQuery)))
  }, [normalizedQuery])

  useLayoutEffect(() => {
    if (!categorySelection.revealBooks || !window.matchMedia('(max-width: 699px)').matches) return
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    resultsRef.current?.focus({ preventScroll: true })
  }, [categorySelection])

  function returnToCategories() {
    categoriesRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    categoriesRef.current?.querySelector('button[aria-pressed="true"]')?.focus({ preventScroll: true })
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

      </div>

      {!normalizedQuery && (
        <section aria-labelledby="bible-categories-title" className={styles.discovery} ref={categoriesRef}>
          <h2 className={styles.sectionLabel} id="bible-categories-title">{t('bible.exploreCategories')}</h2>
          <div aria-label={t('bible.categoriesLabel')} className={styles.categoryGrid} role="group">
          {bibleCategories.map((category) => (
            <button
              aria-controls="bible-book-results"
              aria-pressed={categoryId === category.id}
              className={styles.categoryCard}
              data-category-id={category.id}
              key={category.id}
              onClick={() => setCategorySelection({ id: category.id, revealBooks: true })}
              type="button"
            >
              <span aria-hidden="true" className={styles.categoryIcon}><Icon name={category.icon} size={20} /></span>
              <small aria-label={t(category.books.length === 1 ? 'bible.bookCountOne' : 'bible.bookCount', { count: category.books.length })}>{category.books.length}</small>
              <span className={styles.categoryName}>{t(category.labelKey)}</span>
            </button>
          ))}
          </div>
        </section>
      )}

      {normalizedQuery && <p className={styles.searchScope}>{t('bible.searchingAllBooks')}</p>}

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
          <section aria-labelledby="bible-results-title" className={styles.results} id="bible-book-results" ref={resultsRef} tabIndex={-1}>
            <header className={styles.resultsHeading}>
              <h2 id="bible-results-title">{t(selectedCategory.labelKey)}</h2>
              <p aria-live="polite" aria-atomic="true">{t('bible.filteredBookCount', { count: selectedCategory.books.length })}</p>
              <button className={styles.changeCategory} onClick={returnToCategories} type="button">
                <Icon name="arrowUp" size={15} />
                {t('bible.changeCategory')}
              </button>
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
