//Version desarrollo

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("📦 App version:", __APP_VERSION__)

// 👇 IMPORTANTE: registro del Service Worker
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    const aceptar = window.confirm(
      "📚 Hay nuevas preguntas disponibles.\n\n¿Actualizar ahora?"
    )

    if (aceptar) {
      // Limpia preguntas antiguas
      localStorage.removeItem("preguntas")
      localStorage.removeItem("preguntas_version")

      // Activa el nuevo Service Worker y recarga
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log("✅ App lista para uso offline")
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)