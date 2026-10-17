import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { PageIntro } from '../../components/ui/PageIntro'
import { useI18n } from '../../i18n'
import { ProjectContact, ProjectDetails, ProjectHelp, ProjectSupport } from './ProjectInformation'
import styles from './AboutPage.module.css'

export default function AboutPage() {
  const { t } = useI18n()
  const { hash, key } = useLocation()
  const pageRef = useRef(null)
  const helpRef = useRef(null)
  const supportRef = useRef(null)

  useEffect(() => {
    let frame
    const restore = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const currentHash = window.location.hash
        if (window.location.pathname !== '/about' || currentHash && !['#ayuda', '#apoya'].includes(currentHash)) return
        const heading = currentHash === '#ayuda' ? helpRef.current
          : currentHash === '#apoya' ? supportRef.current : pageRef.current?.querySelector('h1')
        if (!heading) return
        if (currentHash) heading.scrollIntoView({ block: 'start', behavior: 'instant' })
        else {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
          heading.tabIndex = -1
        }
        heading.focus({ preventScroll: true })
      })
    }
    // A quick Back during lazy navigation can retain this page and its key.
    // Handle that native history event as well as normal route updates.
    window.addEventListener('popstate', restore)
    restore()
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('popstate', restore)
    }
  }, [hash, key])

  return (
    <div className={`page ${styles.aboutPage}`} ref={pageRef}>
      <PageIntro title={t('about.title')}>{t('about.description')}</PageIntro>
      <ProjectDetails />
      <section aria-labelledby="ayuda" className={styles.help}>
        <h2 id="ayuda" ref={helpRef} tabIndex={-1}>{t('about.helpTitle')}</h2>
        <ProjectHelp />
      </section>
      <section aria-labelledby="apoya" className={styles.support}>
        <h2 id="apoya" ref={supportRef} tabIndex={-1}>{t('about.supportTitle')}</h2>
        <ProjectSupport />
      </section>
      <ProjectContact />
    </div>
  )
}
