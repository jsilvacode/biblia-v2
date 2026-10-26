import { useI18n } from '../../i18n'
import { ProjectContact, ProjectDetails, ProjectHelp, ProjectSupport } from '../../features/about/ProjectInformation'
import { ReaderDialog } from '../../features/reader/ReaderDialog'
import { Icon } from '../ui/Icon'
import styles from './AppFooter.module.css'

const informationDetails = {
  about: { title: 'about.title', icon: 'bookOpen' },
  help: { title: 'about.helpTitle', icon: 'circleHelp' },
  support: { title: 'about.supportTitle', icon: 'heartHandshake' },
}

export default function ProjectInformationDialog({ information, onClose, returnFocusRef }) {
  const { t } = useI18n()
  const selected = informationDetails[information]
  if (!selected) return null

  return (
    <ReaderDialog
      className={`${styles.dialog} ${styles[information]}`}
      isOpen
      onClose={onClose}
      returnFocusRef={returnFocusRef}
      title={<span className={styles.dialogTitle}><Icon name={selected.icon} size={24} /><span>{t(selected.title)}</span></span>}
    >
      <div className={`reader-dialog__scroll-area ${styles.dialogContent}`}>
        {information === 'about' && <><p>{t('about.description')}</p><ProjectDetails /><ProjectContact /></>}
        {information === 'help' && <ProjectHelp />}
        {information === 'support' && <ProjectSupport />}
      </div>
    </ReaderDialog>
  )
}
