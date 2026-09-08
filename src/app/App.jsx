import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { AppProviders } from './AppProviders'
import { AppRoutes } from './routes'

const BOOT_SPLASH_MIN_MS = 1300
const BOOT_SPLASH_MAX_MS = 4500
const BOOT_SPLASH_FADE_MS = 700

function redactAnalyticsQuery(event) {
  return {
    ...event,
    url: typeof event.url === 'string' ? event.url.split('?')[0] : event.url,
  }
}

export default function App() {
  useEffect(() => {
    const splash = document.getElementById('boot-splash')
    if (!splash) return undefined

    const startedAt = window.performance?.now() ?? Date.now()
    let hideTimer = 0
    let removalTimer = 0
    let hasStartedExit = false

    const removeSplash = () => splash.remove()
    const hideSplash = () => {
      if (hasStartedExit) return
      hasStartedExit = true
      const elapsed = (window.performance?.now() ?? Date.now()) - startedAt
      const delay = Math.max(0, BOOT_SPLASH_MIN_MS - elapsed)

      hideTimer = window.setTimeout(() => {
        splash.classList.add('boot-splash--hidden')
        removalTimer = window.setTimeout(removeSplash, BOOT_SPLASH_FADE_MS)
      }, delay)
    }
    const handleCriticalReady = () => hideSplash()

    window.addEventListener('santa-biblia:critical-ready', handleCriticalReady)
    if (document.documentElement.dataset.santaBibliaReady === 'true') hideSplash()
    const fallback = window.setTimeout(hideSplash, BOOT_SPLASH_MAX_MS)

    return () => {
      window.removeEventListener('santa-biblia:critical-ready', handleCriticalReady)
      window.clearTimeout(fallback)
      window.clearTimeout(hideTimer)
      window.clearTimeout(removalTimer)
    }
  }, [])

  return (
    <>
      <AppProviders>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <AppRoutes />
        </BrowserRouter>
      </AppProviders>
      <Analytics beforeSend={redactAnalyticsQuery} />
      <SpeedInsights />
    </>
  )
}
