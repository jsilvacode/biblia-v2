import { createContext, lazy, Suspense, useCallback, useContext, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { getVersion } from '../bible/catalog'
import { ReaderDialog } from '../reader/ReaderDialog'
import { useSettings } from '../settings/SettingsProvider'
import { formatThematicReference } from './topicReference'
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
    returnFocusRef.current = trigger
    setSelection(passage)
  }, [])

  return (
    <PassagePreviewContext.Provider value={openPassage}>
      {children}
      <ReaderDialog
        className={styles.dialog}
        closeLabel={t('topics.closeReading')}
        isOpen={Boolean(selection)}
        onClose={() => setSelection(null)}
        returnFocusRef={returnFocusRef}
        title={selection ? formatThematicReference(selection.label, locale) || selection.label : ''}
      >
        {selection && (
          <>
            <p className={styles.context}>{selection.title}<span>{getVersion(versionId)?.short}</span></p>
            <div className={`reader-dialog__scroll-area ${styles.reading}`} data-font={settings.fontFamily} data-line-height={settings.readerLineHeight}>
              <Suspense fallback={<p role="status">{t('topics.passageLoading')}</p>}>
                <PassagePreviewBody key={selection.label + ' : ' + versionId} label={selection.label} versionId={versionId} />
              </Suspense>
            </div>
          </>
        )}
      </ReaderDialog>
    </PassagePreviewContext.Provider>
  )
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
