import { Link } from 'react-router-dom'
import { PROJECT_AUTHOR, PROJECT_CONTACT_EMAIL, PROJECT_DONATION_LINKS, PROJECT_PUBLIC_VERSION } from '../../content/projectMeta'
import { useI18n } from '../../i18n'
import { Icon } from '../ui/Icon'
import styles from './AppFooter.module.css'

export function AppFooter({ showSupport = false, editorial = false }) {
  const { t } = useI18n()

  return (
    <footer className={`${styles.footer}${editorial ? ` ${styles.editorial}` : ''}`}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <p className={styles.name}><Icon name="bookOpen" size={18} /><strong>{t('about.appName', { version: PROJECT_PUBLIC_VERSION })}</strong></p>
          <p className={styles.purpose}>{t('about.footerPurpose')}</p>
          <p className={styles.author}>{t('about.developer', { author: PROJECT_AUTHOR })}</p>
        </div>
        <nav aria-label={t('about.footerNavigation')} className={styles.navigation}>
          <Link to="/about">{t('nav.about')}</Link>
          <Link to="/about#ayuda">{t('about.help')}</Link>
          <a href={`mailto:${PROJECT_CONTACT_EMAIL}`}>{t('about.contact')}</a>
        </nav>
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
      </div>
    </footer>
  )
}
