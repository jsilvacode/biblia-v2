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

export function HomeHeader({ variant = 'hero', leading, readerMenu }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { resolvedTheme, toggleTheme } = useSettings()
  const isReader = variant === 'reader'
  const requestedSettings = !isReader && location.state?.openSettings === true
  const [isSettingsOpen, setIsSettingsOpen] = useState(requestedSettings)
  const settingsTriggerRef = useRef(null)
  const settingsReturnFocusRef = useRef(null)
  const nextThemeIsDark = resolvedTheme !== 'dark'
  const variantClassName = isReader ? styles.readerHeader : variant === 'site' ? styles.siteHeader : styles.heroHeader
  const brand = <Link aria-label="Santa Biblia" className={`${styles.homeBrand}${isReader ? ' reader-header__brand' : ''}`} to="/">
    <span aria-hidden="true" className={styles.homeBrandMark}><Icon name="bookOpen" size={17} /></span>
    <span>Santa Biblia</span>
  </Link>

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
      <header className={`${styles.homeHeader} ${variantClassName ?? ''}${isReader ? ' reader-header__inner' : ''}`}>
        {isReader ? <div className="reader-header__leading">{leading}{brand}</div> : leading ?? brand}
        <nav aria-label={t('app.name')} className={`${styles.homeDesktopNavigation}${isReader ? ' reader-header__desktop-navigation' : ''}`}>
          {navigation.map(([label, path, icon]) => {
            const content = <><Icon name={icon} size={17} /><span>{t(`nav.${label}`)}</span></>
            return isReader ? (
              <Link
                aria-current={label === 'bible' ? 'page' : undefined}
                aria-label={t(`nav.${label}`)}
                className={`${styles.homeNavigationLink} reader-header__navigation-link${label === 'bible' ? ` ${styles.isActive}` : ''}`}
                key={path}
                to={path}
              >
                {content}
              </Link>
            ) : (
              <NavLink className={({ isActive }) => `${styles.homeNavigationLink}${isActive ? ` ${styles.isActive}` : ''}`} end={path === '/'} key={path} to={path}>
                {content}
              </NavLink>
            )
          })}
        </nav>
        <div className={`${styles.homeHeaderControls}${isReader ? ' reader-header__controls' : ''}`}>
          <button aria-label={t(nextThemeIsDark ? 'home.useDarkTheme' : 'home.useLightTheme')} className={styles.headerIconButton} onClick={handleThemeToggle} type="button">
            <Icon name={nextThemeIsDark ? 'moon' : 'sun'} size={17} />
          </button>
          <button
            aria-expanded={isReader ? readerMenu?.isOpen ?? false : isSettingsOpen}
            aria-haspopup="dialog"
            aria-label={t(isReader ? 'reader.openReaderMenu' : 'nav.settings')}
            className={`${styles.headerIconButton}${isReader ? ' reader-header__menu' : ''}`}
            onClick={isReader ? readerMenu?.onOpen : handleSettingsToggle}
            ref={settingsTriggerRef}
            type="button"
          >
            <Icon name="gear" size={17} />
          </button>
        </div>
      </header>
      {!isReader && isSettingsOpen && (
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
