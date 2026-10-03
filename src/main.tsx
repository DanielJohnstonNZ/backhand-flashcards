import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { initStore } from './db'
import { App } from './App'
import './styles.css'

// Caches the app shell for offline use and picks up new versions on reload.
registerSW({ immediate: true })

const root = createRoot(document.getElementById('root')!)

initStore()
  .then(() =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
  .catch((error) => {
    console.error(error)
    root.render(
      <div className="empty">
        <h2>Storage Unavailable</h2>
        <p>Backhand keeps your decks in this browser's storage, which couldn't be opened. Private browsing modes can block it.</p>
      </div>,
    )
  })
