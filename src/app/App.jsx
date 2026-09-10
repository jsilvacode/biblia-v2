import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { AppProviders } from './AppProviders'
import { AppRoutes } from './routes'

const BOOT_SPLASH_FADE_MS = 180

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

    let removalTimer = 0

    const removeSplash = () => splash.remove()
    splash.classList.add('boot-splash--hidden')
    removalTimer = window.setTimeout(removeSplash, BOOT_SPLASH_FADE_MS)

    return () => {
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
