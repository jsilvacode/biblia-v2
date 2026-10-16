import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { enableAutomaticAppUpdates } from './features/offline/appUpdates'
import { preloadInitialReading } from './features/reader/preloadReading'
import { readSettings } from './features/settings/SettingsProvider'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/global.css'
import './styles/responsive.css'
import './styles/aurora.css'

if (import.meta.env.PROD) void enableAutomaticAppUpdates()
preloadInitialReading(window.location, readSettings().bibleVersion)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
