import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import {
  adjustReaderFontScale,
  READER_FONT_SCALE_MAX,
  READER_FONT_SCALE_MIN,
  readerFontScalePercentage,
} from '../settings/readerFontScale'
import { useSettings } from '../settings/SettingsProvider'

const focusableSelector = 'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
function focusWithoutScrolling(element) {
  if (!element || !element.isConnected || typeof element.focus !== 'function') return
  element.focus({ preventScroll: true })
}

export function ReaderSectionMenu({ anchorRef, isOpen, onClose, onOpenSettings, returnFocusRef }) {
  const { t } = useI18n()
  const { settings, updateSetting } = useSettings()
  const menuRef = useRef(null)
  const closeRef = useRef(onClose)
  const titleId = useId()
  const [position, setPosition] = useState({ top: 8, left: 8 })

  useEffect(() => { closeRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!isOpen) return undefined
    const returnFocusTarget = returnFocusRef ? returnFocusRef.current : document.activeElement
    const updatePosition = () => {
      const anchor = anchorRef?.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      const width = Math.min(304, window.innerWidth - 16)
      const height = Math.min(420, menuRef.current?.offsetHeight ?? 280)
      const spaceBelow = window.innerHeight - rect.bottom - 8
      const spaceAbove = rect.top - 8
      const opensAbove = spaceBelow < height && spaceAbove > spaceBelow
      const top = opensAbove
        ? Math.max(8, rect.top - height - 8)
        : Math.min(rect.bottom + 8, Math.max(8, window.innerHeight - height - 8))
      setPosition({
        top: Math.round(top),
        left: Math.round(Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))),
      })
    }
    updatePosition()
    const focusId = window.requestAnimationFrame(() => {
      focusWithoutScrolling(menuRef.current?.querySelector('[data-dialog-initial-focus]') ?? menuRef.current?.querySelector(focusableSelector))
    })
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !menuRef.current) return
      const focusable = [...menuRef.current.querySelectorAll(focusableSelector)]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        focusWithoutScrolling(last)
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        focusWithoutScrolling(first)
      }
    }
    function handlePointerDown(event) {
      if (menuRef.current?.contains(event.target) || anchorRef?.current?.contains(event.target)) return
      closeRef.current?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(updatePosition) : null
    if (menuRef.current) resizeObserver?.observe(menuRef.current)
    return () => {
      window.cancelAnimationFrame(focusId)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      resizeObserver?.disconnect()
      window.requestAnimationFrame(() => focusWithoutScrolling(returnFocusTarget))
    }
  }, [anchorRef, isOpen, returnFocusRef])

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
    <section aria-labelledby={titleId} className="reader-section-menu-popover" ref={menuRef} role="dialog" style={{ left: position.left, top: position.top }}>
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
