import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n'
import { loadCommentary } from '../bible/bibleRepository'
import { ReaderDialog } from './ReaderDialog'

export function CommentarySheet({ bookId, chapter, isOpen, onClose, reference, returnFocusRef, verse }) {
  const { t } = useI18n()
  const [state, setState] = useState({ blocks: [], status: 'loading' })

  useEffect(() => {
    if (!isOpen) return undefined

    const controller = new AbortController()
    loadCommentary({ bookId, chapter, signal: controller.signal })
      .then((content) => {
        if (controller.signal.aborted) return
        setState({ blocks: content[String(verse)]?.b ?? [], status: 'ready' })
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== 'AbortError') setState({ blocks: [], status: 'error' })
      })

    return () => controller.abort()
  }, [bookId, chapter, isOpen, verse])

  return (
    <ReaderDialog
      className="reader-dialog--commentary"
      closeLabel={t('common.back')}
      isOpen={isOpen}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      title={t('reader.commentary')}
    >
      <p className="reader-dialog__reference">{reference}</p>
      <div aria-live="polite" className="reader-dialog__scroll-area">
        {state.status === 'loading' && <p className="reader-dialog__status">{t('reader.commentaryLoading')}</p>}
        {state.status === 'error' && <p className="reader-dialog__status">{t('reader.commentaryError')}</p>}
        {state.status === 'ready' && (state.blocks.length ? state.blocks.map(([kind, text], index) => (
          kind === 'h'
            ? <h3 key={`${kind}-${index}`}>{text}</h3>
            : <p key={`${kind}-${index}`}>{text}</p>
        )) : <p className="reader-dialog__status">{t('reader.commentaryEmpty')}</p>)}
      </div>
      <footer className="reader-dialog__footer">{t('reader.commentarySource')}</footer>
    </ReaderDialog>
  )
}
