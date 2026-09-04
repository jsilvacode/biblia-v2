import { useI18n } from '../../i18n'
import styles from './ReaderFontSizeControl.module.css'
import {
  adjustReaderFontScale,
  READER_FONT_SCALE_MAX,
  READER_FONT_SCALE_MIN,
  readerFontScalePercentage,
} from './readerFontScale'
import { useSettings } from './SettingsProvider'

export function ReaderFontSizeControl({ compact = false, initialFocus = false }) {
  const { t } = useI18n()
  const { settings, updateSetting } = useSettings()
  const scale = settings.readerFontScale
  const percentage = readerFontScalePercentage(scale)

  function changeSize(direction) {
    updateSetting('readerFontScale', adjustReaderFontScale(scale, direction))
  }

  return (
    <fieldset className={`${styles.control}${compact ? ` ${styles.compact}` : ''}`}>
      <legend>{t('settings.fontSize')}</legend>
      <p className={styles.description}>{t('settings.fontSizeDescription')}</p>
      <div className={styles.actions}>
        <button
          aria-label={t('reader.smallerText')}
          data-dialog-initial-focus={(initialFocus && scale > READER_FONT_SCALE_MIN) || undefined}
          disabled={scale <= READER_FONT_SCALE_MIN}
          onClick={() => changeSize(-1)}
          type="button"
        >
          <span aria-hidden="true" className={styles.smallLetter}>A</span>
          <span aria-hidden="true">−</span>
        </button>
        <output aria-label={t('settings.fontSizeCurrent', { value: percentage })} aria-live="polite">
          {percentage}%
        </output>
        <button
          aria-label={t('reader.largerText')}
          data-dialog-initial-focus={(initialFocus && scale <= READER_FONT_SCALE_MIN) || undefined}
          disabled={scale >= READER_FONT_SCALE_MAX}
          onClick={() => changeSize(1)}
          type="button"
        >
          <span aria-hidden="true" className={styles.largeLetter}>A</span>
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <p aria-hidden="true" className={styles.preview} style={{ fontSize: `calc(1rem * ${scale})` }}>
        {t('settings.fontSizePreview')}
      </p>
    </fieldset>
  )
}
