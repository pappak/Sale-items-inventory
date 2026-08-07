import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.BACKEND_PORT || 3100
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: env.APP_PORT ? parseInt(env.APP_PORT) : 3000,
      proxy: {
        '/api': `http://localhost:${backendPort}`,
        '/uploads': `http://localhost:${backendPort}`,
      },
    },
  }
})
