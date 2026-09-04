import { PROJECT_CONTACT_EMAIL, PROJECT_DONATION_LINKS } from '../../content/projectMeta'
import { useI18n } from '../../i18n'
import { Icon } from '../ui/Icon'
import styles from './AppFooter.module.css'

export function AppFooter({ showSupport = false }) {
  const { t } = useI18n()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {showSupport && (
          <section aria-labelledby="support-project-title" className={styles.support}>
            <div className={styles.supportCopy}>
              <strong id="support-project-title">{t('about.supportTitle')}</strong>
              <p>{t('about.supportDescription')}</p>
            </div>
            <nav aria-label={t('about.supportTitle')} className={styles.supportLinks}>
              <a href={PROJECT_DONATION_LINKS.mercadoPago} rel="noopener noreferrer" target="_blank">
                <span>{t('about.mercadoPago')}</span><Icon name="externalLink" size={15} strokeWidth={1.65} />
              </a>
              <a href={PROJECT_DONATION_LINKS.paypal} rel="noopener noreferrer" target="_blank">
                <span>{t('about.paypal')}</span><Icon name="externalLink" size={15} strokeWidth={1.65} />
              </a>
            </nav>
          </section>
        )}
        <div className={styles.signature}>
          <span>{t('about.appName')}</span>
          <span aria-hidden="true">·</span>
          <span>{t('about.developer')}</span>
          <span aria-hidden="true">·</span>
          <a href={`mailto:${PROJECT_CONTACT_EMAIL}`}>{PROJECT_CONTACT_EMAIL}</a>
        </div>
      </div>
    </footer>
  )
}
