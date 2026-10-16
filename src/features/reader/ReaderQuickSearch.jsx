import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { OverlayCloseButton } from '../../components/ui/OverlayCloseButton'
import { useI18n } from '../../i18n'
import { HomeQuickSearch } from '../home/HomeQuickSearch'

const compactQuery = '(max-width: 767px)'

export function ReaderQuickSearch({ currentBookId, currentChapter, onGoToChapter, onOpenChange }) {
  const { t } = useI18n()
  const id = useId()
  const [isCompact, setIsCompact] = useState(() => window.matchMedia(compactQuery).matches)
  const [isOpen, setIsOpen] = useState(false)
  const [hasSearchOverlay, setHasSearchOverlay] = useState(false)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const inputRef = useRef(null)
  const pointerInsideRef = useRef(false)

  const close = useCallback((restoreFocus = true) => {
    setIsOpen(false)
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const query = window.matchMedia(compactQuery)
    const resize = () => {
      const keepOpen = query.matches && (hasSearchOverlay || panelRef.current?.contains(document.activeElement))
      setIsCompact(query.matches)
      setIsOpen(Boolean(keepOpen))
    }
    query.addEventListener('change', resize)
    return () => query.removeEventListener('change', resize)
  }, [hasSearchOverlay])

  useEffect(() => {
    onOpenChange?.(isOpen || hasSearchOverlay)
    return () => onOpenChange?.(false)
  }, [hasSearchOverlay, isOpen, onOpenChange])

  useLayoutEffect(() => {
    if (isOpen && isCompact && !document.querySelector('[aria-modal="true"]')) inputRef.current?.focus({ preventScroll: true })
  }, [isCompact, isOpen])

  useEffect(() => {
    if (!isOpen || !isCompact) return undefined
    const dismiss = (event) => {
      // Chapter dialogs live in a portal and return to this search panel.
      if (document.querySelector('[aria-modal="true"]')) return
      if (!panelRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) close(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [close, isCompact, isOpen])

  return (
    <>
      <button aria-controls={id} aria-expanded={isOpen} aria-haspopup="dialog" aria-label={t('home.quickSearch')} className="reader-header__search-toggle" onClick={() => setIsOpen(open => !open)} ref={triggerRef} type="button">
        <Icon name="search" size={20} />
      </button>
      {(!isCompact || isOpen) && (
        <div
          aria-label={isCompact ? t('home.quickSearch') : undefined}
          className="reader-header__search-panel"
          id={id}
          onBlur={(event) => {
            if (!pointerInsideRef.current && isCompact && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && !document.querySelector('[aria-modal="true"]')) close(false)
          }}
          onPointerDownCapture={() => { pointerInsideRef.current = true }}
          onPointerCancel={() => { pointerInsideRef.current = false }}
          onClickCapture={() => { pointerInsideRef.current = false }}
          onKeyDown={(event) => {
            pointerInsideRef.current = false
            if (isCompact && event.key === 'Escape' && !event.defaultPrevented && !event.target.closest('[aria-modal="true"]')) {
              event.preventDefault()
              event.stopPropagation()
              close()
            }
          }}
          ref={panelRef}
          role={isCompact ? 'dialog' : undefined}
        >
          <div className="reader-header__search-heading"><span>{t('home.quickSearch')}</span><OverlayCloseButton onClose={close} /></div>
          <HomeQuickSearch currentBookId={currentBookId} currentChapter={currentChapter} inputRef={inputRef} onGoToChapter={onGoToChapter} onOpenChange={setHasSearchOverlay} />
        </div>
      )}
    </>
  )
}
