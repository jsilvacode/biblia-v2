import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import rpspApi from './api/rpsp.js'
import { APP_ICON_REVISION } from './src/features/reader/socialCardConfig.js'

function rpspDevelopmentEndpoint() {
  const middleware = async (request, response, next) => {
    const origin = `http://${request.headers.host ?? '127.0.0.1'}`
    const url = new URL(request.originalUrl ?? request.url, origin)
    if (url.pathname !== '/api/rpsp') return next()

    try {
      const apiResponse = await rpspApi.fetch(new Request(url, {
        headers: request.headers,
        method: request.method,
      }))
      response.statusCode = apiResponse.status
      for (const [name, value] of apiResponse.headers) response.setHeader(name, value)
      if (request.method === 'HEAD' || !apiResponse.body) return response.end()
      response.end(Buffer.from(await apiResponse.arrayBuffer()))
    } catch {
      response.statusCode = 503
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ error: 'rpsp_unavailable' }))
    }
  }

  return {
    name: 'rpsp-development-endpoint',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Keep the framework stable across content/UI releases. Grouping the
        // offline lessons also avoids twenty separate installation requests.
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'framework'
          if (/src\/content\/la-fe-de-jesus\/generated\//.test(id)) return 'study-lessons'
        },
      },
    },
  },
  server: {
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  preview: {
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  plugins: [
    react(),
    rpspDevelopmentEndpoint(),
    VitePWA({
      includeManifestIcons: false,
      registerType: 'autoUpdate',
      manifest: {
        id: '/',
        name: 'Santa Biblia',
        short_name: 'Santa Biblia',
        description: 'Una Biblia rápida, privada y disponible sin conexión.',
        theme_color: '#241b17',
        background_color: '#241b17',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'es',
        icons: [
          {
            src: `icons/santa-biblia-192.png?v=${APP_ICON_REVISION}`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `icons/santa-biblia-512.png?v=${APP_ICON_REVISION}`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `icons/santa-biblia-512.png?v=${APP_ICON_REVISION}`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        importScripts: ['sw-update.js'],
        globPatterns: ['**/*.{js,css,html,png,svg,webp,avif,jpg,jpeg,woff,woff2}'],
        // Social-card images are read by the server and are not offline UI.
        globIgnores: ['assets/social/**', 'og-share.jpg', 'assets/home-landscape-v2-*.{avif,webp}'],
        cleanupOutdatedCaches: true,
        // Online navigations should see this deployment immediately, rather
        // than show the previous HTML until the next SW finishes installing.
        navigateFallback: null,
        directoryIndex: null,
        navigationPreload: true,
        runtimeCaching: [
          {
            // Cache the chosen crop/format, without downloading all ten
            // responsive alternatives during service-worker installation.
            urlPattern: /\/assets\/home-landscape-v2-.*\.(avif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'santa-biblia-v2-home-landscape',
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'santa-biblia-v2-pages',
              networkTimeoutSeconds: 3,
              precacheFallback: { fallbackURL: 'index.html' },
              expiration: { maxEntries: 24 },
            },
          },
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
