import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageContext'
import { AccessibilityProvider } from './utils/AccessibilityContext'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AccessibilityProvider>
  </StrictMode>,
)

// Register offline-capable service worker for iPads, Chromebooks & classroom installations
serviceWorkerRegistration.register()

