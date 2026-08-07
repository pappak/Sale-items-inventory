import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

const buildNumber = String(pkg.buildNumber ?? 1)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.BACKEND_PORT || 3100
  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_NUMBER__: JSON.stringify(buildNumber),
    },
    server: {
      port: env.APP_PORT ? parseInt(env.APP_PORT) : 3000,
      proxy: {
        '/api': `http://localhost:${backendPort}`,
        '/uploads': `http://localhost:${backendPort}`,
      },
    },
  }
})
