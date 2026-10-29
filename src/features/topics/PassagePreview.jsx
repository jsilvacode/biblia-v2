import { createContext, lazy, Suspense, useCallback, useContext, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { getVersion } from '../bible/catalog'
import { ReaderDialog } from '../reader/ReaderDialog'
import { useSettings } from '../settings/SettingsProvider'
import { formatThematicReference, resolveThematicReference } from './topicReference'
import styles from './PassagePreview.module.css'

const PassagePreviewBody = lazy(() => import('./PassagePreviewBody'))
const PassagePreviewContext = createContext(null)

export function PassagePreviewProvider({ children, versionId: versionIdOverride }) {
  const { locale, t } = useI18n()
  const { settings } = useSettings()
  const versionId = versionIdOverride ?? settings.bibleVersion
  const [selection, setSelection] = useState(null)
  const returnFocusRef = useRef(null)
  const openPassage = useCallback((passage, trigger) => {
    const references = passage.references?.length ? passage.references
      : passage.labels?.length ? passage.labels : [passage.label]
    const passages = [...new Map(references.filter(Boolean).map((value) => {
      const reference = resolveThematicReference(value)
      const label = formatThematicReference(reference) || (typeof value === 'string' ? value : value.label)
      return [label, { label, reference }]
    })).values()]
    if (!passages.length) return
    returnFocusRef.current = trigger
    setSelection({ title: passage.title, passages, index: 0 })
  }, [])

  const activeIndex = selection?.index ?? 0
  const activePassage = selection?.passages[activeIndex]

  return (
    <PassagePreviewContext.Provider value={openPassage}>
      {children}
      <ReaderDialog
        className={styles.dialog}
        closeLabel={t('topics.closeReading')}
        isOpen={Boolean(selection)}
        onClose={() => setSelection(null)}
        returnFocusRef={returnFocusRef}
        title={activePassage ? formatThematicReference(activePassage.reference, locale) || activePassage.label : ''}
      >
        {selection && (
          <>
            <p className={styles.context}>{selection.title}<span>{getVersion(versionId)?.short}</span></p>
            {selection.passages.length > 1 && (
              <nav aria-label="Referencias de la cita" className={styles.sequenceControls}>
                <span aria-live="polite">Pasaje {activeIndex + 1} de {selection.passages.length}</span>
                <div>
                  <button
                    disabled={activeIndex === 0}
                    onClick={() => setSelection((current) => ({ ...current, index: current.index - 1 }))}
                    type="button"
                  >Anterior</button>
                  <button
                    disabled={activeIndex >= selection.passages.length - 1}
                    onClick={() => setSelection((current) => ({ ...current, index: current.index + 1 }))}
                    type="button"
                  >Siguiente</button>
                </div>
              </nav>
            )}
            <div className={`reader-dialog__scroll-area ${styles.reading}`} data-font={settings.fontFamily} data-line-height={settings.readerLineHeight}>
              <Suspense fallback={<p role="status">{t('topics.passageLoading')}</p>}>
                <PassagePreviewBody key={activePassage.label + ' : ' + versionId} reference={activePassage.reference ?? activePassage.label} versionId={versionId} />
              </Suspense>
            </div>
          </>
        )}
      </ReaderDialog>
    </PassagePreviewContext.Provider>
  )
}

export function usePassagePreview() {
  const openPassage = useContext(PassagePreviewContext)
  if (!openPassage) throw new Error('usePassagePreview must be used inside PassagePreviewProvider')
  return openPassage
}

export function PassageReferences({ references, title, primaryReference }) {
  const { locale, t } = useI18n()
  const openPassage = useContext(PassagePreviewContext)
  return (
    <div className={styles.referenceGrid}>
      {[...new Set(references)].map((label) => (
        <button
          aria-haspopup="dialog"
          className={`${styles.referenceButton}${label === primaryReference ? ` ${styles.primaryReference}` : ''}`}
          key={label}
          onClick={(event) => openPassage({ label, title }, event.currentTarget)}
          type="button"
        >
          <Icon name="bookOpen" size={18} />
          <span>
            <strong>{formatThematicReference(label, locale) || label}</strong>
            {label === primaryReference && <small>{t('topics.centralReading')}</small>}
          </span>
          <Icon name="chevronRight" size={16} />
        </button>
      ))}
    </div>
  )
}
