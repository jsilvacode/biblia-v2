import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AppProviders } from './AppProviders'
import { AppRoutes } from './routes'

function redactAnalyticsQuery(event) {
  return {
    ...event,
    url: typeof event.url === 'string' ? event.url.split('?')[0] : event.url,
  }
}

export default function App() {
  return (
    <>
      <AppProviders>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <AppRoutes />
        </BrowserRouter>
      </AppProviders>
      <Analytics beforeSend={redactAnalyticsQuery} />
    </>
  )
}
