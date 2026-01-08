import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Toda vez que você chamar /api, o Vite redireciona para a Hotmobile
      '/api-hotmobile': {
        target: 'https://chat.hotmobile.com.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-hotmobile/, '')
      }
    }
  }
})