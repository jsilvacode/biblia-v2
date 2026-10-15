import { useEffect, useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { ReaderDialog } from '../reader/ReaderDialog'
import { getLocalizedBookName } from './catalog'
import { useSettings } from '../settings/SettingsProvider'
import { loadReaderPage, preloadReading } from '../reader/preloadReading'
import styles from './BookChaptersDialog.module.css'

export function BookChaptersDialog({ book, currentBookId, currentChapter, onClose, returnFocusRef }) {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const { settings } = useSettings()
  const descriptionId = useId()
  const chapterInputId = useId()
  const [jumpChapter, setJumpChapter] = useState('')
  const chapterNumber = Number(jumpChapter)
  const isValidChapter = Number.isInteger(chapterNumber) && chapterNumber >= 1 && chapterNumber <= book.chapters

  useEffect(() => { void loadReaderPage().catch(() => undefined) }, [])

  function warmChapter(chapter) {
    preloadReading({ book: book.id, chapter }, settings.bibleVersion)
  }

  function submitChapter(event) {
    event.preventDefault()
    if (isValidChapter) {
      warmChapter(chapterNumber)
      navigate(`/read/${book.id}/${chapterNumber}`)
    }
  }

  return (
    <ReaderDialog
      className={styles.dialog}
      closeIcon="close"
      closeLabel={t('common.close')}
      descriptionId={descriptionId}
      isOpen
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      title={getLocalizedBookName(book, locale)}
    >
      <p className={styles.description} id={descriptionId}>{t('bible.chooseChapter')}</p>
      {book.chapters > 50 && (
        <form className={styles.jump} onSubmit={submitChapter}>
          <label htmlFor={chapterInputId}>{t('bible.goToChapter')}</label>
          <input
            id={chapterInputId}
            inputMode="numeric"
            max={book.chapters}
            min="1"
            onChange={(event) => setJumpChapter(event.target.value)}
            placeholder={`1–${book.chapters}`}
            type="number"
            value={jumpChapter}
          />
          <button disabled={!isValidChapter} type="submit">{t('common.open')}</button>
        </form>
      )}
      <div className={`reader-dialog__scroll-area ${styles.chapters}`}>
        <nav aria-label={t('bible.chapters')} className={styles.grid}>
          {Array.from({ length: book.chapters }, (_, index) => index + 1).map((chapter) => (
            <Link
              aria-current={book.id === currentBookId && chapter === currentChapter ? 'page' : undefined}
              key={chapter}
              onFocus={() => warmChapter(chapter)}
              onPointerDown={() => warmChapter(chapter)}
              to={`/read/${book.id}/${chapter}`}
            >
              {chapter}
            </Link>
          ))}
        </nav>
      </div>
    </ReaderDialog>
  )
}
