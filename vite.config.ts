import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'manifest.json'],
      manifest: {
        name: 'কৃষি AI v2',
        short_name: 'কৃষি AI',
        description: 'AI-চালিত কৃষি পরামর্শ সেবা — Krishi AI Bangladesh',
        theme_color: '#16a34a',
        background_color: '#f0fdf4',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/market/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'market-cache', expiration: { maxEntries: 50 } }
          },
          {
            urlPattern: /\/api\/weather/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'weather-cache', expiration: { maxEntries: 50 } }
          },
          {
            urlPattern: /\/api\/soil/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'soil-cache',
              expiration: { maxAgeSeconds: 604800, maxEntries: 50 }
            }
          },
          {
            urlPattern: /\/api\/calendar/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'calendar-cache',
              expiration: { maxAgeSeconds: 2592000, maxEntries: 50 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
