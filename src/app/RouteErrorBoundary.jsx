import { Component, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HomeHeader } from '../features/home/HomeHeader'
import { requestAppReload } from '../features/offline/appUpdates'
import { useI18n } from '../i18n'
import styles from './RouteErrorBoundary.module.css'

export function RouteLoading() {
  const { t } = useI18n()
  return <div className="route-loading" role="status" aria-live="polite"><span className="sr-only">{t('appRecovery.loading')}</span></div>
}

function RouteFailure() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const [reloading, setReloading] = useState(false)
  const needsHeader = pathname === '/' || pathname.startsWith('/biblia/') || pathname.startsWith('/read/')

  async function handleReload() {
    setReloading(true)
    try {
      await requestAppReload()
    } catch {
      // Keep the recovery actions available if the browser cannot update.
    } finally {
      setReloading(false)
    }
  }

  return (
    <>
      {needsHeader && <div className="site-header"><HomeHeader variant="site" /></div>}
      <section className={styles.failure} role="alert">
        <h1>{t('appRecovery.loadErrorTitle')}</h1>
        <p>{t('appRecovery.loadErrorBody')}</p>
        <div className={styles.actions}>
          <button aria-busy={reloading} className="button" disabled={reloading} onClick={handleReload} type="button">{t('appRecovery.reload')}</button>
          <Link className={styles.homeLink} to="/">{t('appRecovery.goHome')}</Link>
        </div>
      </section>
    </>
  )
}

class PageErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <RouteFailure /> : this.props.children
  }
}

export function RouteErrorBoundary({ children }) {
  const { pathname, search } = useLocation()
  return <PageErrorBoundary key={`${pathname}${search}`}>{children}</PageErrorBoundary>
}
