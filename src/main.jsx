import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { enableAutomaticAppUpdates } from './features/offline/appUpdates'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/global.css'
import './styles/responsive.css'
import './styles/aurora.css'

enableAutomaticAppUpdates()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
