import { useEffect, useRef } from 'react'
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
  const { pathname, key, hash } = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map())
  const previousPath = useRef(pathname)

  useEffect(() => {
    // Track while this history entry is active; reading scrollY during route
    // cleanup can see the shorter destination document instead of the origin.
    const remember = () => positions.current.set(key, window.scrollY)
    window.addEventListener('scroll', remember, { passive: true })
    return () => window.removeEventListener('scroll', remember)
  }, [key])

  useEffect(() => {
    // The reader owns verse/progress restoration. Other lazy routes may mount
    // after native history restoration has already tried a too-short document.
    const changedPage = previousPath.current !== pathname
    previousPath.current = pathname
    const savedY = positions.current.get(key)
    if (navigationType === 'POP') {
      if (pathname.startsWith('/read/') || hash || savedY === undefined) return undefined
      let frame
      const restore = () => {
        window.cancelAnimationFrame(frame)
        frame = window.requestAnimationFrame(() => {
          if (document.querySelector('.route-loading')) return
          if (document.documentElement.scrollHeight - window.innerHeight < savedY) return
          window.scrollTo({ top: savedY, left: 0, behavior: 'instant' })
          observer.disconnect()
        })
      }
      const observer = new ResizeObserver(restore)
      observer.observe(document.body)
      restore()
      const stop = window.setTimeout(() => observer.disconnect(), 3000)
      return () => {
        window.cancelAnimationFrame(frame)
        window.clearTimeout(stop)
        observer.disconnect()
      }
    }

    if (!changedPage) return undefined
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [navigationType, pathname, key, hash])

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
