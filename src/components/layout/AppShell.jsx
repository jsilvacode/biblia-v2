import { useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigationType } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { Icon } from '../ui/Icon'
import { HomeHeader } from '../../features/home/HomeHeader'
import { AppFooter } from './AppFooter'

const mobileLinks = [
  ['home', '/', 'home'],
  ['bible', '/bible', 'book'],
  ['search', '/search', 'search'],
  ['saved', '/saved', 'bookmark'],
]

function Navigation({ links, className }) {
  const { t } = useI18n()
  return (
    <nav className={className} aria-label={t('app.name')}>
      {links.map(([label, path, icon]) => (
        <NavLink
          className={({ isActive }) => `navigation-link ${isActive ? 'is-active' : ''}`}
          end={path === '/'}
          key={path}
          to={path}
        >
          <Icon name={icon} size={20} />
          <span>{t(`nav.${label}`)}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function RouteTransition() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    // On browser back/forward, let the browser restore the reader's prior
    // position. New in-app destinations always begin at their content start.
    if (navigationType === 'POP') return undefined

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [navigationType, pathname])

  return null
}

export function AppShell() {
  const { pathname } = useLocation()
  const { t } = useI18n()
  const isReader = pathname.startsWith('/read/')
  const isHome = pathname === '/'

  return (
    <div className={`app-shell ${isReader ? 'app-shell--reader' : ''} ${isHome ? 'app-shell--home' : ''}`}>
      <RouteTransition />
      <a className="skip-link" href="#main-content">{t('common.skipToContent')}</a>
      {!isReader && !isHome && <div className="site-header"><HomeHeader variant="site" /></div>}
      <main id="main-content" className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
      {!isReader && <AppFooter showSupport={isHome} />}
      {!isReader && <Navigation className="mobile-navigation" links={mobileLinks} />}
    </div>
  )
}
