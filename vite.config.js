import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  preview: {
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  plugins: [
    react(),
    VitePWA({
      includeManifestIcons: false,
      registerType: 'autoUpdate',
      manifest: {
        id: '/',
        name: 'Santa Biblia',
        short_name: 'Santa Biblia',
        description: 'Una Biblia rápida, privada y disponible sin conexión.',
        theme_color: '#eef3f9',
        background_color: '#eef3f9',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'es',
        icons: [
          {
            src: 'icons/santa-biblia-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/santa-biblia-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/santa-biblia-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        importScripts: ['sw-update.js'],
        globPatterns: ['**/*.{js,css,html,png,svg,webp,avif,jpg,jpeg,woff,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'santa-biblia-v2-data',
              expiration: {
                maxEntries: 360,
                maxAgeSeconds: 60 * 60 * 24 * 90,
              },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['e2e/**'],
  },
})
