import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Piggino - Controle Financeiro',
        short_name: 'Piggino',
        description: 'Controle seus gastos e conquiste sua liberdade financeira',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.method === 'GET' && /\/api\//.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      // Redireciona qualquer requisição que comece com /api
      '/api': {
        // Para o seu backend .NET
        target: 'http://localhost:5139', 
        // Necessário para o backend aceitar a requisição
        changeOrigin: true, 
      },
    },
  },
})