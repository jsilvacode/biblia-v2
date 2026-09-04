import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { useInstall } from './InstallProvider'
import styles from './InstallSettings.module.css'

export function InstallSettings() {
  const { t } = useI18n()
  const { installed, isRequesting, platform, requestInstall, status } = useInstall()
  const guidanceKey = platform === 'mac-safari' ? 'install.macSafariInstructions' : 'install.iosInstructions'

  return (
    <section aria-labelledby="install-settings-title" className={styles.section}>
      <div className={styles.heading}>
        <span aria-hidden="true" className={styles.icon}><Icon name={installed ? 'checkCircle' : 'download'} size={19} /></span>
        <div>
          <h2 id="install-settings-title">{t('install.settingsTitle')}</h2>
          <p>{installed ? t('install.installedDescription') : t('install.settingsDescription')}</p>
        </div>
      </div>

      {status === 'promptable' && (
        <button className="button button--compact" disabled={isRequesting} onClick={requestInstall} type="button">
          {isRequesting ? t('install.installing') : t('install.install')}
        </button>
      )}
      {status === 'guidance' && <p className={styles.instructions}>{t(guidanceKey)}</p>}
      {status === 'unavailable' && <p className={styles.status}>{t('install.unavailable')}</p>}
      {status === 'installed' && <p className={styles.status}>{t('install.installed')}</p>}
    </section>
  )
}
