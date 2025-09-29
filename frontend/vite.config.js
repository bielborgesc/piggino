import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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