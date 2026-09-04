import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { getLocalizedBookName } from './catalog'
import styles from './BookChapterAccordion.module.css'

function chapterId(prefix, bookId) {
  return `${prefix}-chapters-${bookId}`
}

function triggerId(prefix, bookId) {
  return `${prefix}-book-${bookId}`
}

export function BookChapterAccordion({
  books,
  currentBookId = null,
  currentChapter = null,
  initialOpenBookId = null,
  initialFocusBookId = null,
  locale,
  onOpenBook,
  openBookId: controlledOpenBookId,
  onSelectChapter,
  prefix = 'book-accordion',
  showTestamentGroups = false,
  t,
}) {
  const generatedPrefix = useId().replaceAll(':', '')
  const idPrefix = `${prefix}-${generatedPrefix}`
  const [uncontrolledOpenBookId, setUncontrolledOpenBookId] = useState(initialOpenBookId)
  const isControlled = controlledOpenBookId !== undefined
  const openBookId = isControlled ? controlledOpenBookId : uncontrolledOpenBookId

  function toggleBook(bookId) {
    const nextBookId = openBookId === bookId ? null : bookId
    if (!isControlled) setUncontrolledOpenBookId(nextBookId)
    onOpenBook?.(nextBookId)
  }

  function renderBook(book, index) {
    const isOpen = book.id === openBookId && books.some((candidate) => candidate.id === openBookId)
    const panelId = chapterId(idPrefix, book.id)
    const bookTriggerId = triggerId(idPrefix, book.id)

    return (
      <div className={`${styles.entry} book-list__entry`} key={book.id}>
        <button
          aria-controls={isOpen ? panelId : undefined}
          aria-expanded={isOpen}
          className={`${styles.bookButton} book-list__item${isOpen ? ' is-selected' : ''}`}
          data-book-id={book.id}
          data-dialog-initial-focus={book.id === (initialFocusBookId ?? initialOpenBookId) || (initialFocusBookId === null && initialOpenBookId === null && index === 0) ? true : undefined}
          id={bookTriggerId}
          onClick={() => toggleBook(book.id)}
          type="button"
        >
          <span>{getLocalizedBookName(book, locale)}</span>
          <span className={styles.bookMeta}>
            <small aria-hidden="true">{book.chapters}</small>
            <span aria-hidden="true" className={`${styles.chevron}${isOpen ? ` ${styles.chevronOpen}` : ''}`}><Icon name="chevronDown" size={17} /></span>
          </span>
        </button>
        {isOpen && (
          <section
            aria-labelledby={bookTriggerId}
            className={`${styles.chapterPanel} chapter-picker chapter-picker--inline`}
            id={panelId}
            role="region"
            tabIndex="-1"
          >
            <div className={`${styles.chapterGrid} chapter-grid`}>
              {Array.from({ length: book.chapters }, (_, chapterIndex) => chapterIndex + 1).map((chapter) => (
                onSelectChapter ? (
                  <button
                    aria-current={book.id === currentBookId && chapter === currentChapter ? 'page' : undefined}
                    key={chapter}
                    onClick={() => onSelectChapter(book.id, chapter)}
                    type="button"
                  >
                    {chapter}
                  </button>
                ) : (
                  <Link key={chapter} to={`/read/${book.id}/${chapter}`}>
                    {chapter}
                  </Link>
                )
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  if (!showTestamentGroups) {
    return <div className={styles.accordion}>{books.map(renderBook)}</div>
  }

  return (
    <div className={styles.accordion}>
      {['OT', 'NT'].map((testament) => {
        const testamentBooks = books.filter((book) => book.testament === testament)
        if (!testamentBooks.length) return null
        return (
          <section className={styles.group} key={testament}>
            <h3 className={styles.groupTitle}>{t(testament === 'OT' ? 'bible.oldTestament' : 'bible.newTestament')}</h3>
            {testamentBooks.map((book, index) => renderBook(book, index))}
          </section>
        )
      })}
    </div>
  )
}
