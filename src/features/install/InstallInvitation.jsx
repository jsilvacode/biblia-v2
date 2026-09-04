import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { useInstall } from './InstallProvider'
import styles from './InstallInvitation.module.css'

export function InstallInvitation() {
  const { t } = useI18n()
  const {
    dismissFirstOffer,
    isRequesting,
    platform,
    requestInstall,
    shouldOffer,
    status,
  } = useInstall()

  if (!shouldOffer) return null

  const isGuidance = status === 'guidance'
  const guidanceKey = platform === 'mac-safari' ? 'install.macSafariInstructions' : 'install.iosInstructions'

  async function handlePrimaryAction() {
    if (isGuidance) {
      dismissFirstOffer()
      return
    }
    await requestInstall()
  }

  return (
    <aside
      aria-atomic="true"
      aria-labelledby="install-invitation-title"
      aria-live="polite"
      className={styles.invitation}
      role="region"
    >
      <span aria-hidden="true" className={styles.icon}><Icon name="download" size={21} /></span>
      <div className={styles.copy}>
        <strong id="install-invitation-title">{t('install.invitationTitle')}</strong>
        <p>{isGuidance ? t(guidanceKey) : t('install.invitationDescription')}</p>
        <div className={styles.actions}>
          <button className={styles.primaryAction} disabled={isRequesting} onClick={handlePrimaryAction} type="button">
            {isGuidance ? t('install.gotIt') : (isRequesting ? t('install.installing') : t('install.install'))}
          </button>
          {!isGuidance && (
            <button className={styles.secondaryAction} onClick={dismissFirstOffer} type="button">
              {t('install.notNow')}
            </button>
          )}
        </div>
      </div>
      <button aria-label={t('install.dismiss')} className={styles.close} onClick={dismissFirstOffer} type="button">
        <Icon name="close" size={17} />
      </button>
    </aside>
  )
}
