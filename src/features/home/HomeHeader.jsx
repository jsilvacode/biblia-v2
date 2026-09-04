import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { useI18n } from '../../i18n'
import { SettingsPopover } from '../settings/SettingsPopover'
import { useSettings } from '../settings/SettingsProvider'
import styles from './HomeHeader.module.css'

const navigation = [
  ['home', '/', 'home'],
  ['bible', '/bible', 'book'],
  ['search', '/search', 'search'],
  ['saved', '/saved', 'bookmark'],
]

export function HomeHeader({ variant = 'hero' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { resolvedTheme, toggleTheme } = useSettings()
  const requestedSettings = location.state?.openSettings === true
  const [isSettingsOpen, setIsSettingsOpen] = useState(requestedSettings)
  const settingsTriggerRef = useRef(null)
  const settingsReturnFocusRef = useRef(null)
  const nextThemeIsDark = resolvedTheme !== 'dark'

  function handleThemeToggle(event) {
    toggleTheme()
    if (event.detail > 0) event.currentTarget.blur()
  }

  function handleSettingsToggle(event) {
    settingsReturnFocusRef.current = event.detail === 0 ? event.currentTarget : null
    setIsSettingsOpen((open) => !open)
  }

  useEffect(() => {
    if (!requestedSettings) return
    const nextState = { ...location.state }
    delete nextState.openSettings
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: Object.keys(nextState).length ? nextState : null,
    })
  }, [location.hash, location.pathname, location.search, location.state, navigate, requestedSettings])

  return (
    <>
      <header className={`${styles.homeHeader} ${variant === 'site' ? styles.siteHeader : styles.heroHeader}`}>
        <Link aria-label="Santa Biblia" className={styles.homeBrand} to="/">
          <span aria-hidden="true" className={styles.homeBrandMark}><Icon name="bookOpen" size={20} strokeWidth={1.55} /></span>
          <span>Santa Biblia</span>
        </Link>
        <nav aria-label={t('app.name')} className={styles.homeDesktopNavigation}>
          {navigation.map(([label, path, icon]) => (
            <NavLink className={({ isActive }) => `${styles.homeNavigationLink}${isActive ? ` ${styles.isActive}` : ''}`} end={path === '/'} key={path} to={path}>
              <Icon name={icon} size={20} strokeWidth={1.65} />
              <span>{t(`nav.${label}`)}</span>
            </NavLink>
          ))}
        </nav>
        <div className={styles.homeHeaderControls}>
          <button aria-label={t(nextThemeIsDark ? 'home.useDarkTheme' : 'home.useLightTheme')} className={styles.headerIconButton} onClick={handleThemeToggle} type="button">
            <Icon name={nextThemeIsDark ? 'moon' : 'sun'} size={20} strokeWidth={1.65} />
          </button>
          <button aria-expanded={isSettingsOpen} aria-haspopup="dialog" aria-label={t('nav.settings')} className={styles.headerIconButton} onClick={handleSettingsToggle} ref={settingsTriggerRef} type="button">
            <Icon name="gear" size={20} strokeWidth={1.65} />
          </button>
        </div>
      </header>
      {isSettingsOpen && (
        <SettingsPopover
          anchorRef={settingsTriggerRef}
          isOpen
          onClose={() => setIsSettingsOpen(false)}
          returnFocusRef={settingsReturnFocusRef}
        />
      )}
    </>
  )
}
