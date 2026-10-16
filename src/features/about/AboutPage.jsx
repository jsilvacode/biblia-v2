import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { PageIntro } from '../../components/ui/PageIntro'
import { PROJECT_AUTHOR, PROJECT_CONTACT_EMAIL, PROJECT_PUBLIC_VERSION } from '../../content/projectMeta'
import { useI18n } from '../../i18n'
import styles from './AboutPage.module.css'

const helpTopics = ['reading', 'translations', 'verseActions', 'offline', 'localData']

export default function AboutPage() {
  const { t } = useI18n()
  const { hash, key } = useLocation()
  const helpRef = useRef(null)

  useEffect(() => {
    if (hash !== '#ayuda') return undefined
    // Wait for the lazy destination. A new history entry can reuse the hash.
    const frame = window.requestAnimationFrame(() => {
      helpRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
      helpRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [hash, key])

  const labels = { settings: t('settings.title'), downloads: t('settings.offline'), ready: t('settings.readyOffline') }

  return (
    <div className={`page ${styles.aboutPage}`}>
      <PageIntro title={t('about.title')}>{t('about.description')}</PageIntro>
      <dl className={styles.projectMeta}>
        <div><dt>{t('about.versionLabel')}</dt><dd>{PROJECT_PUBLIC_VERSION}</dd></div>
        <div><dt>{t('about.authorLabel')}</dt><dd>{PROJECT_AUTHOR}</dd></div>
      </dl>
      <section aria-labelledby="ayuda" className={styles.help}>
        <h2 id="ayuda" ref={helpRef} tabIndex={-1}>{t('about.helpTitle')}</h2>
        <div className={styles.helpTopics}>
          {helpTopics.map((topic) => (
            <article aria-labelledby={`help-${topic}`} key={topic}>
              <h3 id={`help-${topic}`}>{t(`about.${topic}Title`)}</h3>
              <p>{t(`about.${topic}Help`, labels)}</p>
            </article>
          ))}
        </div>
      </section>
      <section aria-labelledby="about-contact-heading" className={styles.contact}>
        <h2 id="about-contact-heading">{t('about.contact')}</h2>
        <p>{t('about.contactDescription')}</p>
        <a className={styles.contactLink} href={`mailto:${PROJECT_CONTACT_EMAIL}`}>{PROJECT_CONTACT_EMAIL}</a>
      </section>
    </div>
  )
}
