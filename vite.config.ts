// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const isGH = process.env.BUILD_TARGET === 'gh' // set saat build ke GitHub Pages
const basePrefix = isGH ? '/disaster-report-pwa/' : '/'

export default defineConfig({
  base: basePrefix,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Disaster Report PWA (Demo)',
        short_name: 'Disaster PWA',
        description: 'Preview PWA pelaporan bencana (offline-first)',
        theme_color: '#0ea5e9',
        background_color: '#0b1220',
        display: 'standalone',
        start_url: basePrefix,     // penting utk GH Pages
        scope: basePrefix,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // cache static dari origin sendiri
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'static' }
          },
          // cache tile OSM (regex yang benar, bukan {s})
          {
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'osm-tiles' }
          }
        ]
      }
    })
  ],
  server: { port: 5173 }
})
