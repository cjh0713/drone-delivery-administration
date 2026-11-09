/** Keep the existing optional AI integration on the local Vite server. */
export function createAiDevelopmentProxy(env = {}) {
  const apiKey = (env.DASHSCOPE_API_KEY || '').trim()
  const appId = (env.DASHSCOPE_APP_ID || '').trim()
  const upstreamPath = `/api/v1/apps/${encodeURIComponent(appId)}/completion`

  const sendError = (res, status, message) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ message }))
  }

  return {
    guard: {
      name: 'local-ai-request-guard',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = (req.url || '').split('?')[0]
          if (pathname !== '/ai-api' && !pathname.startsWith('/ai-api/')) {
            next()
            return
          }
          if (pathname !== '/ai-api/chat') {
            sendError(res, 404, '接口不存在。')
            return
          }
          if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST')
            sendError(res, 405, '不支持此操作。')
            return
          }
          if (!apiKey || !appId) {
            sendError(res, 503, 'AI 助手暂未启用。')
            return
          }
          next()
        })
      }
    },
    proxy: {
      '/ai-api': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: () => upstreamPath,
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    }
  }
}
