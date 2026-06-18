import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import Inspector from 'unplugin-vue-dev-locator/vite'
import traeBadgePlugin from 'vite-plugin-trae-solo-badge'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'
  const isProd = mode === 'production'

  const plugins = [
    vue(),
  ]

  if (isDev && env.VITE_DEVTOOLS_ENABLED !== 'false') {
    plugins.push(Inspector())
  }

  plugins.push(
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#app',
    }),
  )

  return {
    server: {
      port: Number(env.VITE_PORT) || 5173,
      host: true,
    },
    build: {
      sourcemap: env.VITE_SOURCE_MAP || (isProd ? 'hidden' : 'inline'),
      outDir: 'dist',
      assetsDir: 'assets',
    },
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV || mode),
      __MOCK_ENABLED__: env.VITE_MOCK_ENABLED === 'true',
    },
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
