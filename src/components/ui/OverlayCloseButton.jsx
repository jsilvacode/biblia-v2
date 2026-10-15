import { useI18n } from '../../i18n'
import { Icon } from './Icon'
import styles from './OverlayCloseButton.module.css'

export function OverlayCloseButton({ onClose, label, className = '' }) {
  const { t } = useI18n()
  return <button aria-label={label ?? t('common.close')} className={`${styles.close} ${className}`.trim()} onClick={onClose} type="button"><Icon name="close" size={16} /></button>
}
