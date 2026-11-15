import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageContext'
import { AccessibilityProvider } from './utils/AccessibilityContext'
import { CelebrationLayer } from './ui/fx/CelebrationLayer'
import { useReducedMotion } from './ui/hooks'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'

/** Makes every framer-motion animation honor the in-app Reduce motion setting (System / On / Off). */
function MotionRoot({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  return <MotionConfig reducedMotion={reduce ? 'always' : 'never'}>{children}</MotionConfig>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityProvider>
      <LanguageProvider>
        <MotionRoot>
          <App />
        </MotionRoot>
        <CelebrationLayer />
      </LanguageProvider>
    </AccessibilityProvider>
  </StrictMode>,
)

// Register offline-capable service worker for iPads, Chromebooks & classroom installations
serviceWorkerRegistration.register()
