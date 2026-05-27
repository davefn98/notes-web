import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string }
const appCommit = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'local'
  }
})()

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_COMMIT__: JSON.stringify(appCommit),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon.svg'],
      manifest: {
        name: 'Notas',
        short_name: 'Notas',
        description: 'Gestión de notas personales con grupos, etiquetas y recordatorios.',
        lang: 'es-AR',
        dir: 'ltr',
        theme_color: '#101827',
        background_color: '#f8fafc',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        start_url: '/',
        scope: '/',
        orientation: 'any',
        categories: ['productivity', 'utilities'],
        shortcuts: [
          {
            name: 'Nueva nota rápida',
            short_name: 'Nueva nota',
            description: 'Crear una nota nueva al instante',
            url: '/?quick-capture=1',
            icons: [{ src: '/pwa-icon.svg', sizes: '192x192', type: 'image/svg+xml' }],
          },
          {
            name: 'Recordatorios',
            short_name: 'Recordatorios',
            description: 'Ver recordatorios pendientes',
            url: '/?reminders=1',
            icons: [{ src: '/pwa-icon.svg', sizes: '192x192', type: 'image/svg+xml' }],
          },
        ],
        share_target: {
          action: '/share',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/pwa-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/notes-api-zwbl\.onrender\.com\/api\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        navigateFallback: '/offline.html',
      },
    }),
  ],
  optimizeDeps: {
    include: ['lucide-react'],
  },
})
