import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useUiStore } from './store/uiStore'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (window.confirm('Nueva versión disponible. ¿Actualizar?')) {
      void updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App lista para usar sin conexión.')
  },
})

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  useUiStore.getState().setInstallPrompt(e as BeforeInstallPromptEvent)
})

window.addEventListener('appinstalled', () => {
  useUiStore.getState().setInstallPrompt(null)
  console.log('App instalada correctamente.')
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
