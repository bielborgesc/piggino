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
      includeAssets: ['ios/180.png', 'android/launchericon-192x192.png', 'android/launchericon-512x512.png'],
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
          { src: 'android/launchericon-48x48.png',   sizes: '48x48',   type: 'image/png' },
          { src: 'android/launchericon-72x72.png',   sizes: '72x72',   type: 'image/png' },
          { src: 'android/launchericon-96x96.png',   sizes: '96x96',   type: 'image/png' },
          { src: 'android/launchericon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: 'android/launchericon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'android/launchericon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'android/launchericon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
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