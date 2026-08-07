import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Build date as yymmdd
const now = new Date()
const yy = String(now.getFullYear()).slice(2)
const mm = String(now.getMonth() + 1).padStart(2, '0')
const dd = String(now.getDate()).padStart(2, '0')
const buildDate = `${yy}${mm}${dd}`
const buildNumber = String(pkg.buildNumber ?? 1).padStart(6, '0')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.BACKEND_PORT || 3100
  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_NUMBER__: JSON.stringify(buildNumber),
      __BUILD_DATE__: JSON.stringify(buildDate),
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
