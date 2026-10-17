import { useId } from 'react'
import { Icon } from '../../components/ui/Icon'
import { PROJECT_AUTHOR, PROJECT_CONTACT_EMAIL, PROJECT_DONATION_LINKS, PROJECT_PUBLIC_VERSION } from '../../content/projectMeta'
import { useI18n } from '../../i18n'
import styles from './AboutPage.module.css'

const helpTopics = ['reading', 'translations', 'verseActions', 'offline', 'localData']

export function ProjectDetails() {
  const { t } = useI18n()
  return (
    <dl className={styles.projectMeta}>
      <div><dt>{t('about.versionLabel')}</dt><dd>{PROJECT_PUBLIC_VERSION}</dd></div>
      <div><dt>{t('about.authorLabel')}</dt><dd>{PROJECT_AUTHOR}</dd></div>
    </dl>
  )
}

export function ProjectContact() {
  const { t } = useI18n()
  const id = useId()
  return (
    <section aria-labelledby={id} className={styles.contact}>
      <h2 id={id}>{t('about.contact')}</h2>
      <p>{t('about.contactDescription')}</p>
      <a className={styles.contactLink} href={`mailto:${PROJECT_CONTACT_EMAIL}`}>{PROJECT_CONTACT_EMAIL}</a>
    </section>
  )
}

export function ProjectHelp() {
  const { t } = useI18n()
  const id = useId()
  const labels = { settings: t('settings.title'), downloads: t('settings.offline'), ready: t('settings.readyOffline') }
  return (
    <div className={styles.helpTopics}>
      {helpTopics.map((topic) => (
        <article aria-labelledby={`${id}-${topic}`} key={topic}>
          <h3 id={`${id}-${topic}`}>{t(`about.${topic}Title`)}</h3>
          <p>{t(`about.${topic}Help`, labels)}</p>
        </article>
      ))}
    </div>
  )
}

export function ProjectSupport() {
  const { t } = useI18n()
  return (
    <>
      <p className={styles.informationText}>{t('about.supportDescription')}</p>
      <nav aria-label={t('about.supportTitle')} className={styles.supportLinks}>
        <a href={PROJECT_DONATION_LINKS.mercadoPago} rel="noopener noreferrer" target="_blank">
          <span>{t('about.mercadoPago')}</span><Icon name="externalLink" size={15} strokeWidth={1.65} />
        </a>
        <a href={PROJECT_DONATION_LINKS.paypal} rel="noopener noreferrer" target="_blank">
          <span>{t('about.paypal')}</span><Icon name="externalLink" size={15} strokeWidth={1.65} />
        </a>
      </nav>
    </>
  )
}
