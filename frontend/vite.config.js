import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/resources': 'http://localhost:3000',
      '/requests': 'http://localhost:3000',
      '/damage-reports': 'http://localhost:3000',
      '/maintenance': 'http://localhost:3000',
      '/notifications': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
      '/prices': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    }
  }
})
