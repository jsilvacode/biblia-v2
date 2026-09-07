import { useId, useRef } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import {
  adjustReaderFontScale,
  READER_FONT_SCALE_MAX,
  READER_FONT_SCALE_MIN,
  readerFontScalePercentage,
} from '../settings/readerFontScale'
import { useSettings } from '../settings/SettingsProvider'
import { useAnchoredPopover } from './useAnchoredPopover'

export function ReaderSectionMenu({ anchorRef, isOpen, onClose, onOpenSettings, returnFocusRef }) {
  const { t } = useI18n()
  const { settings, updateSetting } = useSettings()
  const menuRef = useRef(null)
  const titleId = useId()
  const position = useAnchoredPopover({
    anchorRef,
    isOpen,
    onClose,
    panelRef: menuRef,
    resolvePosition: ({ anchor, panel }) => {
      const rect = anchor.getBoundingClientRect()
      const width = Math.min(304, window.innerWidth - 16)
      const height = Math.min(420, panel.offsetHeight || 280)
      const spaceBelow = window.innerHeight - rect.bottom - 8
      const spaceAbove = rect.top - 8
      const opensAbove = spaceBelow < height && spaceAbove > spaceBelow
      const top = opensAbove
        ? Math.max(8, rect.top - height - 8)
        : Math.min(rect.bottom + 8, Math.max(8, window.innerHeight - height - 8))
      return {
        top: Math.round(top),
        left: Math.round(Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))),
      }
    },
    returnFocusRef,
  })

  if (!isOpen) return null
  const resolvedTheme = settings.theme === 'system'
    ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : settings.theme
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
  const nextThemeLabel = t(nextTheme === 'dark' ? 'home.useDarkTheme' : 'home.useLightTheme')
  const fontScale = settings.readerFontScale
  const fontPercentage = readerFontScalePercentage(fontScale)

  function changeFontSize(direction) {
    updateSetting('readerFontScale', adjustReaderFontScale(fontScale, direction))
  }

  return (
    <section aria-labelledby={titleId} className="reader-section-menu-popover" ref={menuRef} role="dialog" style={{ left: position?.left ?? 8, top: position?.top ?? 8 }}>
      <header className="reader-section-menu-popover__header">
        <button aria-label={t('common.back')} className="reader-dialog__back" onClick={onClose} type="button"><Icon name="arrowLeft" size="sm" /></button>
        <h2 id={titleId}>{t('reader.quickOptions')}</h2>
        <span aria-hidden="true" className="reader-dialog__header-spacer" />
      </header>
      <div className="reader-section-menu-popover__body">
        <button aria-label={nextThemeLabel} className="reader-section-menu-popover__option" data-dialog-initial-focus onClick={() => updateSetting('theme', nextTheme)} type="button">
          <span aria-hidden="true" className="reader-section-menu-popover__icon"><Icon name={nextTheme === 'dark' ? 'moon' : 'sun'} size="sm" /></span>
          <span className="reader-section-menu-popover__copy">{nextThemeLabel}</span>
        </button>
        <div aria-label={t('settings.fontSize')} className="reader-section-menu-popover__option reader-section-menu-popover__option--font-size" role="group">
          <span aria-hidden="true" className="reader-section-menu-popover__icon"><Icon name="type" size="sm" /></span>
          <span className="reader-section-menu-popover__copy">{t('settings.fontSize')}</span>
          <span className="reader-section-menu-popover__font-controls">
            <button aria-label={t('reader.smallerText')} disabled={fontScale <= READER_FONT_SCALE_MIN} onClick={() => changeFontSize(-1)} type="button">A−</button>
            <output aria-label={t('settings.fontSizeCurrent', { value: fontPercentage })} aria-live="polite">{fontPercentage}%</output>
            <button aria-label={t('reader.largerText')} disabled={fontScale >= READER_FONT_SCALE_MAX} onClick={() => changeFontSize(1)} type="button">A+</button>
          </span>
        </div>
        <button className="reader-section-menu-popover__option" onClick={onOpenSettings} type="button">
          <span aria-hidden="true" className="reader-section-menu-popover__icon"><Icon name="gear" size="sm" /></span>
          <span className="reader-section-menu-popover__copy">{t('reader.allSettings')}</span>
          <Icon name="chevronRight" size="sm" />
        </button>
      </div>
    </section>
  )
}
