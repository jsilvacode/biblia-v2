import { useRef, useState } from 'react'
import { PROJECT_PUBLIC_VERSION } from '../../content/projectMeta'
import { useI18n } from '../../i18n'
import { ProjectContact, ProjectDetails, ProjectHelp, ProjectSupport } from '../../features/about/ProjectInformation'
import { ReaderDialog } from '../../features/reader/ReaderDialog'
import { Icon } from '../ui/Icon'
import styles from './AppFooter.module.css'

export function AppFooter({ editorial = false }) {
  const { t } = useI18n()
  const [information, setInformation] = useState(null)
  const returnFocusRef = useRef(null)
  const actions = [
    { id: 'about', label: 'nav.about', title: 'about.title', icon: 'bookOpen' },
    { id: 'help', label: 'about.help', title: 'about.helpTitle', icon: 'circleHelp' },
    { id: 'support', label: 'about.supportTitle', title: 'about.supportTitle', icon: 'heartHandshake' },
  ]
  const selected = actions.find(({ id }) => id === information)

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
        <ReaderDialog
          className={`${styles.dialog} ${styles[information]}`}
          isOpen
          onClose={() => setInformation(null)}
          returnFocusRef={returnFocusRef}
          title={<span className={styles.dialogTitle}><Icon name={selected.icon} size={24} /><span>{t(selected.title)}</span></span>}
        >
          <div className={`reader-dialog__scroll-area ${styles.dialogContent}`}>
            {information === 'about' && <><p>{t('about.description')}</p><ProjectDetails /><ProjectContact /></>}
            {information === 'help' && <ProjectHelp />}
            {information === 'support' && <ProjectSupport />}
          </div>
        </ReaderDialog>
      )}
    </footer>
  )
}
