import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { primaryNavigation } from '../../components/layout/primaryNavigation'
import { useI18n } from '../../i18n'
import { useSettings } from '../settings/SettingsProvider'
import styles from './HomeHeader.module.css'

const SettingsPopover = lazy(() => import('../settings/SettingsPopover').then((module) => ({ default: module.SettingsPopover })))

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
          {primaryNavigation.map(({ id, to, icon, labelKey }) => {
            const content = <><Icon name={icon} size={17} /><span>{t(labelKey)}</span></>
            return isReader ? (
              <Link
                aria-current={id === 'bible' ? 'page' : undefined}
                aria-label={t(labelKey)}
                className={`${styles.homeNavigationLink} reader-header__navigation-link${id === 'bible' ? ` ${styles.isActive}` : ''}`}
                key={id}
                to={to}
              >
                {content}
              </Link>
            ) : (
              <NavLink className={({ isActive }) => `${styles.homeNavigationLink}${isActive ? ` ${styles.isActive}` : ''}`} end={id === 'home'} key={id} to={to}>
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
        <Suspense fallback={null}>
          <SettingsPopover
            anchorRef={settingsTriggerRef}
            isOpen
            onClose={() => setIsSettingsOpen(false)}
            returnFocusRef={settingsReturnFocusRef}
          />
        </Suspense>
      )}
    </>
  )
}
