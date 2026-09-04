import { bibleVersions } from '../bible/catalog'
import { useI18n } from '../../i18n'
import { ReaderFontSizeControl } from './ReaderFontSizeControl'
import { useSettings } from './SettingsProvider'

const locales = [
  ['es', 'Español'],
  ['en', 'English'],
  ['pt-BR', 'Português'],
]

/** Shared settings fields for the full Settings page and compact in-context sheets. */
export function SettingsControls({ initialFocus = false, showReading = true }) {
  const { t } = useI18n()
  const { settings, updateSetting } = useSettings()

  return (
    <div className="settings-controls">
      <label className="reader-field" htmlFor="settings-locale">
        <span>{t('settings.language')}</span>
        <select data-dialog-initial-focus={initialFocus || undefined} id="settings-locale" onChange={(event) => updateSetting('locale', event.target.value)} value={settings.locale}>
          {locales.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="reader-field" htmlFor="settings-theme">
        <span>{t('settings.theme')}</span>
        <select id="settings-theme" onChange={(event) => updateSetting('theme', event.target.value)} value={settings.theme}>
          {['system', 'light', 'dark'].map((theme) => <option key={theme} value={theme}>{t(`settings.${theme}`)}</option>)}
        </select>
      </label>
      {showReading && <>
        <label className="reader-field" htmlFor="settings-version">
          <span>{t('settings.bibleVersion')}</span>
          <select id="settings-version" onChange={(event) => updateSetting('bibleVersion', event.target.value)} value={settings.bibleVersion}>
            {bibleVersions.map((version) => <option key={version.id} value={version.id}>{version.name}</option>)}
          </select>
        </label>
        <label className="reader-field" htmlFor="settings-font">
          <span>{t('settings.fontFamily')}</span>
          <select id="settings-font" onChange={(event) => updateSetting('fontFamily', event.target.value)} value={settings.fontFamily}>
            <option value="serif">{t('reader.serif')}</option>
            <option value="sans">{t('reader.sans')}</option>
          </select>
        </label>
        <label className="reader-field" htmlFor="settings-line-height">
          <span>{t('settings.lineHeight')}</span>
          <select id="settings-line-height" onChange={(event) => updateSetting('readerLineHeight', event.target.value)} value={settings.readerLineHeight}>
            {['compact', 'comfortable', 'spacious'].map((lineHeight) => <option key={lineHeight} value={lineHeight}>{t(`reader.${lineHeight}`)}</option>)}
          </select>
        </label>
        <ReaderFontSizeControl compact />
      </>}
    </div>
  )
}
