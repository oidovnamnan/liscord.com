import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Only precache the app shell, not all JS chunks
        globPatterns: ['**/*.{html,css,ico,png,svg,webmanifest}'],
        // Prevent SW from serving index.html for JS/CSS module requests
        navigateFallbackDenylist: [/^\/api/, /\.(js|css|json|png|jpg|svg|webp|woff2?)$/],
        // Only use navigateFallback for actual page navigations
        navigateFallbackAllowlist: [/^\/app/, /^\/login/, /^\/register/, /^\/s\//],
        // Runtime caching for JS chunks — always use network first
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'static-assets',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Liscord — Бараа Захиалга',
        short_name: 'Liscord',
        description: 'Google Sheets-ээс 10 дахин хурдан бараа захиалгын бүртгэл',
        theme_color: '#6c5ce7',
        background_color: '#0f0f14',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
