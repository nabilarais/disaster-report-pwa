
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Disaster Report Preview PWA',
        short_name: 'Disaster Report PWA',
        description: 'Preview PWA pelaporan bencana (offline-first)',
        theme_color: '#0ea5e9',
        background_color: '#0ea5e9',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({url}) => url.origin === self.location.origin,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'static' }
          },
          {
            urlPattern: /^https:\/\/\{s\}\.tile\.openstreetmap\.org\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'osm-tiles' }
          }
        ]
      }
    })
  ],
  server: { port: 5173 }
})
