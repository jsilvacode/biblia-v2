import { useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { ReaderDialog } from './ReaderDialog'

export function VerseActionsSheet({
  isBookmarked,
  isHighlighted,
  isOpen,
  onClose,
  onOpenCommentary,
  onShare,
  onToggleBookmark,
  onToggleHighlight,
  reference,
  returnFocusRef,
}) {
  const { t } = useI18n()
  const [pendingAction, setPendingAction] = useState(null)

  async function runAction(name, action, closeAfter = true) {
    if (pendingAction) return
    setPendingAction(name)
    try {
      const result = await action()
      if (closeAfter && result !== 'cancelled') onClose()
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <ReaderDialog
      className="reader-dialog--actions"
      closeLabel={t('common.back')}
      isOpen={isOpen}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      title={t('reader.verseActions')}
    >
      <p className="reader-dialog__reference">{reference}</p>
      <div className="reader-action-list">
        <button
          className="reader-sheet-action"
          data-dialog-initial-focus
          disabled={Boolean(pendingAction)}
          onClick={onOpenCommentary}
          type="button"
        >
          <span className="reader-sheet-action__icon"><Icon name="commentary" size={21} /></span>
          <span>{t('reader.viewCommentary')}</span>
        </button>
        <button
          aria-pressed={isBookmarked}
          className="reader-sheet-action"
          disabled={Boolean(pendingAction)}
          onClick={() => runAction('bookmark', onToggleBookmark)}
          type="button"
        >
          <span className="reader-sheet-action__icon"><Icon name="bookmark" size={21} /></span>
          <span>{pendingAction === 'bookmark' ? t('common.saving') : (isBookmarked ? t('reader.removeBookmark') : t('reader.bookmark'))}</span>
        </button>
        <button
          aria-pressed={isHighlighted}
          className="reader-sheet-action"
          disabled={Boolean(pendingAction)}
          onClick={() => runAction('highlight', onToggleHighlight)}
          type="button"
        >
          <span className="reader-sheet-action__icon"><Icon name="highlight" size={21} /></span>
          <span>{pendingAction === 'highlight' ? t('common.saving') : (isHighlighted ? t('reader.removeHighlight') : t('reader.highlight'))}</span>
        </button>
        <button
          className="reader-sheet-action"
          disabled={Boolean(pendingAction)}
          onClick={() => runAction('share', onShare)}
          type="button"
        >
          <span className="reader-sheet-action__icon"><Icon name="share" size={21} /></span>
          <span>{pendingAction === 'share' ? t('reader.sharing') : t('reader.share')}</span>
        </button>
      </div>
    </ReaderDialog>
  )
}
