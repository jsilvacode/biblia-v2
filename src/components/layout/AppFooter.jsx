import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { PROJECT_PUBLIC_VERSION } from '../../content/projectMeta'
import { useI18n } from '../../i18n'
import { requestAppReload } from '../../features/offline/appUpdates'
import { Icon } from '../ui/Icon'
import styles from './AppFooter.module.css'

const ProjectInformationDialog = lazy(() => import('./ProjectInformationDialog'))

class InformationBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function InformationFailure({ onClose, returnFocusRef }) {
  const { t } = useI18n()
  const [reloading, setReloading] = useState(false)
  const closeRef = useRef(null)

  function dismiss() {
    onClose()
    returnFocusRef.current?.focus({ preventScroll: true })
  }

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const dismissFromKeyboard = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
      returnFocusRef.current?.focus({ preventScroll: true })
    }
    document.addEventListener('keydown', dismissFromKeyboard)
    return () => document.removeEventListener('keydown', dismissFromKeyboard)
  }, [onClose, returnFocusRef])

  async function reload() {
    setReloading(true)
    try {
      await requestAppReload()
    } catch {
      // Keep the local recovery and close actions available if reload fails.
    } finally {
      setReloading(false)
    }
  }

  return (
    <div className={styles.inner} role="alert">
      <p>{t('appRecovery.loadErrorBody')}</p>
      <div className={styles.navigation}>
        <button aria-busy={reloading} disabled={reloading} onClick={reload} type="button">{t('appRecovery.reload')}</button>
        <button onClick={dismiss} ref={closeRef} type="button">{t('common.close')}</button>
      </div>
    </div>
  )
}

function InformationLoading({ label, onClose, returnFocusRef }) {
  useEffect(() => {
    const dismiss = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
      returnFocusRef.current?.focus({ preventScroll: true })
    }
    document.addEventListener('keydown', dismiss)
    return () => document.removeEventListener('keydown', dismiss)
  }, [onClose, returnFocusRef])

  return <span className="sr-only" role="status">{label}</span>
}

export function AppFooter({ editorial = false }) {
  const { t } = useI18n()
  const [information, setInformation] = useState(null)
  const returnFocusRef = useRef(null)
  const actions = [
    { id: 'about', label: 'nav.about' },
    { id: 'help', label: 'about.help' },
    { id: 'support', label: 'about.supportTitle' },
  ]
  const selected = actions.find(({ id }) => id === information)
  const closeInformation = useCallback(() => setInformation(null), [])

  return (
    <footer className={`${styles.footer}${editorial ? ` ${styles.editorial}` : ''}`}>
      <div className={styles.inner}>
        <nav aria-label={t('about.footerNavigation')} className={styles.navigation}>
          {actions.map(({ id, label }) => (
            <button aria-expanded={information === id} aria-haspopup="dialog" key={id} onClick={(event) => { returnFocusRef.current = event.currentTarget; setInformation(id) }} type="button">{t(label)}</button>
          ))}
        </nav>
        <div className={styles.identity}>
          <p className={styles.name}><Icon name="bookOpen" size={16} /><strong>{t('about.appName', { version: PROJECT_PUBLIC_VERSION })}</strong></p>
          <p className={styles.purpose}>{t('about.footerPurpose')}</p>
        </div>
      </div>
      {selected && (
        <InformationBoundary
          fallback={<InformationFailure onClose={closeInformation} returnFocusRef={returnFocusRef} />}
          key={information}
        >
          <Suspense
            fallback={<InformationLoading label={t('appRecovery.loading')} onClose={closeInformation} returnFocusRef={returnFocusRef} />}
          >
            <ProjectInformationDialog information={information} onClose={closeInformation} returnFocusRef={returnFocusRef} />
          </Suspense>
        </InformationBoundary>
      )}
    </footer>
  )
}
