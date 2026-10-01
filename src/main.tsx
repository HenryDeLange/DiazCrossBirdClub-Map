import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
import { registerPwaServiceWorker } from './pwa/pwaUpdate'
import { applyThemePreference, getStoredThemePreference } from './theme/theme'

applyThemePreference(getStoredThemePreference())
registerPwaServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
