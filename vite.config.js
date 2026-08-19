import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cj-api': {
        target: 'https://developers.cjdropshipping.com/api2.0/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cj-api/, '')
      },
      '/cj-web': {
        target: 'https://cjdropshipping.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cj-web/, '')
      }
    }
  }
})
