import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { AppProviders } from './AppProviders'
import { AppRoutes } from './routes'

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

    const frame = window.requestAnimationFrame(() => splash.classList.add('boot-splash--hidden'))
    const removal = window.setTimeout(() => splash.remove(), 480)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(removal)
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
