import { ReaderDialog } from '../reader/ReaderDialog'
import { InstallSettings } from '../install/InstallSettings'
import { OfflineSettings } from '../offline/OfflineSettings'
import { useI18n } from '../../i18n'
import { SettingsControls } from './SettingsControls'
import { useSettings } from './SettingsProvider'
import styles from './SettingsPopover.module.css'

export function SettingsPopover({ anchorRef, isOpen, onClose, onBack, returnFocusRef }) {
  const { t } = useI18n()
  const { settings } = useSettings()

  return (
    <ReaderDialog
      anchorRef={anchorRef}
      className="reader-dialog--settings"
      closeLabel={t('common.close')}
      isOpen={isOpen}
      onClose={onClose}
      onBack={onBack}
      popover
      returnFocusRef={returnFocusRef}
      title={t('settings.title')}
    >
      <div className={`reader-dialog__scroll-area reader-settings ${styles.panel}`}>
        <SettingsControls initialFocus />
        <InstallSettings />
        <OfflineSettings translationId={settings.bibleVersion} />
      </div>
    </ReaderDialog>
  )
}
