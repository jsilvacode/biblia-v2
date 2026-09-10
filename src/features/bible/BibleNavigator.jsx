import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { useBibleTextSearch } from '../search/useBibleTextSearch'
import { useSettings } from '../settings/SettingsProvider'
import { getAllLocalizedBookNames } from './bookNames'
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
  onSelectReference,
  startWithBooks = false,
}) {
  const { locale, t } = useI18n()
  const { settings } = useSettings()
  const currentBook = getBook(currentBookId)
  const [testament, setTestament] = useState(currentBook?.testament ?? initialTestament)
  const [query, setQuery] = useState('')
  const [selectedBookId, setSelectedBookId] = useState(startWithBooks ? null : currentBookId)
  const [mobilePanel, setMobilePanel] = useState(startWithBooks || !currentBookId ? 'books' : 'chapters')
  const [jumpChapter, setJumpChapter] = useState('')
  const normalizedQuery = normalizeText(query)
  const parsedReference = useMemo(() => parseReference(query), [query])
  const textSearchEnabled = normalizedQuery.length >= 2 && !parsedReference
  const textSearch = useBibleTextSearch({
    debounceMs: 180,
    enabled: textSearchEnabled,
    query,
    translationId: settings.bibleVersion,
  })
  const selectedBook = getBook(selectedBookId)

  const visibleBooks = useMemo(() => {
    if (!normalizedQuery) return bibleBooks.filter((book) => book.testament === testament)
    return bibleBooks.filter((book) => getBookSearchValues(book).some((value) => value.includes(normalizedQuery)))
  }, [normalizedQuery, testament])

  function selectTestament(nextTestament) {
    setTestament(nextTestament)
    setQuery('')
    setSelectedBookId(null)
    setJumpChapter('')
    setMobilePanel('books')
  }

  function selectBook(book) {
    setQuery('')
    setSelectedBookId(book.id)
    setTestament(book.testament)
    setJumpChapter('')
    setMobilePanel('chapters')
  }

  function selectReference(reference) {
    onSelectReference?.(reference)
  }

  function submitChapter(event) {
    event.preventDefault()
    const chapter = Number(jumpChapter)
    if (!selectedBook || !Number.isInteger(chapter) || chapter < 1 || chapter > selectedBook.chapters) return
    selectReference({ book: selectedBook.id, chapter, verse: null })
  }

  function renderBookButton(book) {
    return (
      <button
        aria-current={book.id === currentBookId ? 'true' : undefined}
        aria-pressed={book.id === selectedBookId}
        className={book.id === selectedBookId ? styles.bookSelected : undefined}
        data-book-id={book.id}
        key={book.id}
        onClick={() => selectBook(book)}
        type="button"
      >
        <span>{getLocalizedBookName(book, locale)}</span>
        <small>{t('bible.chapterCount', { count: book.chapters })}</small>
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

    return onSelectReference ? (
      <button className={className} key={key} onClick={() => selectReference(result)} type="button">{content}</button>
    ) : (
      <Link className={className} key={key} state={{ attentionVerse: true }} to={referencePath(result)}>{content}</Link>
    )
  }

  return (
    <div className={`${styles.navigator} ${mobilePanel === 'chapters' ? styles.mobileChapters : styles.mobileBooks}`}>
      <div className={styles.controls}>
        <label className={styles.searchField}>
          <span className="sr-only">{t('bible.searchLabel')}</span>
          <Icon name="search" size={18} />
          <input
            data-dialog-initial-focus
            onChange={(event) => {
              setQuery(event.target.value)
              setMobilePanel('books')
            }}
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
          {onSelectReference ? (
            <button onClick={() => selectReference(parsedReference)} type="button">
              <Icon name="bookOpen" size={18} />
              <span>{t('bible.openReference', { reference: `${getLocalizedBookName(getBook(parsedReference.book), locale)} ${parsedReference.chapter}${parsedReference.verse ? `:${parsedReference.verse}` : ''}` })}</span>
              <Icon name="arrowRight" size={17} />
            </button>
          ) : (
            <Link to={referencePath(parsedReference)}>
              <Icon name="bookOpen" size={18} />
              <span>{t('bible.openReference', { reference: `${getLocalizedBookName(getBook(parsedReference.book), locale)} ${parsedReference.chapter}${parsedReference.verse ? `:${parsedReference.verse}` : ''}` })}</span>
              <Icon name="arrowRight" size={17} />
            </Link>
          )}
        </div>
      )}

      {!parsedReference && <div className={`${styles.workspace} ${normalizedQuery ? styles.workspaceSearching : ''}`}>
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
                  <p className={styles.verseResultCount}>{t('search.results', { count: textSearch.results.length })}</p>
                  <div className={styles.verseResults}>{textSearch.results.map(renderVerseResult)}</div>
                </>
              ) : (
                <p className={styles.searchMessage}>{t('search.noResults')}</p>
              )}
            </div>
          </section>
        ) : (
          <>
            <section aria-label={t('bible.books')} className={styles.booksPane} data-bible-books-scroll>
              <div className={styles.bookGrid}>{visibleBooks.map(renderBookButton)}</div>
            </section>

            <section aria-label={t('bible.chapters')} className={styles.chaptersPane} data-bible-chapters>
          {selectedBook ? (
            <>
              <header className={styles.chapterHeading}>
                <button className={styles.backToBooks} onClick={() => setMobilePanel('books')} type="button">
                  <Icon name="arrowLeft" size={17} />
                  <span>{t('bible.allBooks')}</span>
                </button>
                <div>
                  <p>{getLocalizedBookName(selectedBook, locale)}</p>
                  <h3>{t('bible.chooseChapter')}</h3>
                </div>
              </header>
              <div className={styles.chapterGrid}>
                {Array.from({ length: selectedBook.chapters }, (_, index) => index + 1).map((chapter) => {
                  const reference = { book: selectedBook.id, chapter, verse: null }
                  const isCurrent = selectedBook.id === currentBookId && chapter === currentChapter
                  return onSelectReference ? (
                    <button aria-current={isCurrent ? 'page' : undefined} key={chapter} onClick={() => selectReference(reference)} type="button">{chapter}</button>
                  ) : (
                    <Link aria-current={isCurrent ? 'page' : undefined} key={chapter} to={referencePath(reference)}>{chapter}</Link>
                  )
                })}
              </div>
              {selectedBook.chapters > 50 && (
                <form className={styles.chapterJump} onSubmit={submitChapter}>
                  <label htmlFor={`chapter-jump-${selectedBook.id}`}>{t('bible.goToChapter')}</label>
                  <div>
                    <input id={`chapter-jump-${selectedBook.id}`} inputMode="numeric" max={selectedBook.chapters} min="1" onChange={(event) => setJumpChapter(event.target.value)} type="number" value={jumpChapter} />
                    <button disabled={!jumpChapter || Number(jumpChapter) < 1 || Number(jumpChapter) > selectedBook.chapters} type="submit">{t('common.open')}</button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className={styles.chapterEmpty}>
              <Icon name="bookOpen" size={24} />
              <p>{t('bible.selectBookPrompt')}</p>
            </div>
          )}
            </section>
          </>
        )}
      </div>}
    </div>
  )
}
