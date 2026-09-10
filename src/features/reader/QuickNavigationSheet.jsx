import { useI18n } from '../../i18n'
import { BibleNavigator } from '../bible/BibleNavigator'
import { ReaderDialog } from './ReaderDialog'

export function QuickNavigationSheet({
  book,
  chapter: currentChapter,
  isOpen,
  onClose,
  onGoToChapter,
  returnFocusRef,
  startWithBooks = false,
}) {
  const { t } = useI18n()

  return (
    <ReaderDialog
      className="reader-dialog--navigation"
      closeIcon="close"
      closeLabel={t('common.close')}
      isOpen={isOpen}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      title={t('bible.chooseReading')}
    >
      <BibleNavigator
        currentBookId={book?.id ?? null}
        currentChapter={currentChapter}
        initialTestament={book?.testament ?? 'NT'}
        onSelectReference={({ book: bookId, chapter, verse }) => onGoToChapter(bookId, chapter, verse)}
        startWithBooks={startWithBooks}
      />
    </ReaderDialog>
  )
}
