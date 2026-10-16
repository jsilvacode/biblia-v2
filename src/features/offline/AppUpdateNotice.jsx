import { useSyncExternalStore } from 'react'
import { OverlayCloseButton } from '../../components/ui/OverlayCloseButton'
import { useI18n } from '../../i18n'
import { dismissAppUpdate, getAppUpdateState, requestAppReload, subscribeAppUpdates } from './appUpdates'
import styles from './AppUpdateNotice.module.css'

export function AppUpdateNotice() {
  const { t } = useI18n()
  const update = useSyncExternalStore(subscribeAppUpdates, getAppUpdateState, getAppUpdateState)
  if (!update.available || update.dismissed) return null

  return (
    <aside aria-label={t('appRecovery.updateReady')} className={styles.notice}>
      <p aria-live="polite" role={update.error ? 'alert' : 'status'}>{t(update.error ? 'appRecovery.updateError' : 'appRecovery.updateReady')}</p>
      <button className={styles.apply} disabled={update.applying} onClick={() => { void requestAppReload() }} type="button">
        {t(update.applying ? 'appRecovery.updating' : 'appRecovery.update')}
      </button>
      {!update.applying && <OverlayCloseButton label={t('appRecovery.later')} onClose={dismissAppUpdate} />}
    </aside>
  )
}
