import { defineConfig, loadEnv } from 'vite'
import { createAiDevelopmentProxy } from './dev/aiProxy.mjs'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, readFileSync } from 'fs'

// 递归复制目录的函数
function copyDir(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true })
  }
  const entries = readdirSync(src)
  for (const entry of entries) {
    const srcPath = resolve(src, entry)
    const destPath = resolve(dest, entry)
    const stat = statSync(srcPath)
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

// 获取文件类型
function getContentType(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase()
  const types = {
    'js': 'application/javascript',
    'css': 'text/css',
    'wasm': 'application/wasm',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'svg': 'image/svg+xml'
  }
  return types[ext] || 'application/octet-stream'
}

// Vite 插件：处理 Cesium
const cesiumPlugin = () => {
  return {
    name: 'cesium-handler',
    configureServer(server) {
      // 开发服务器：提供 Cesium 静态文件
      server.middlewares.use('/node_modules/cesium/', (req, res, next) => {
        try {
          const filePath = resolve(__dirname, 'node_modules/cesium', req.url)
          if (existsSync(filePath) && statSync(filePath).isFile()) {
            res.setHeader('Content-Type', getContentType(filePath))
            res.end(readFileSync(filePath))
          } else {
            next()
          }
        } catch (e) {
          next()
        }
      })
    },
    closeBundle() {
      // 构建完成后复制 Cesium 静态资源到 dist
      const cesiumSource = resolve(__dirname, 'node_modules/cesium/Build/Cesium')
      const cesiumDest = resolve(__dirname, 'dist/cesium')
      try {
        if (existsSync(cesiumSource)) {
          copyDir(cesiumSource, cesiumDest)
          console.log('✓ Cesium static files copied to dist/cesium')
        }
      } catch (err) {
        console.error('Failed to copy Cesium files:', err)
      }
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const ai = createAiDevelopmentProxy(env)
  return {
  plugins: [vue(), cesiumPlugin(), ai.guard],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    },
    rollupOptions: {
      output: {
        manualChunks: {
          cesium: ['cesium']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['cesium'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      ...ai.proxy
    }
  },
  define: {
    CESIUM_BASE_URL: JSON.stringify('/cesium/')
  }
  }
})
