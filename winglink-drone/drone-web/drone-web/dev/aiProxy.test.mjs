import test from 'node:test'
import assert from 'node:assert/strict'
import { createAiDevelopmentProxy } from './aiProxy.mjs'

function requestThroughGuard(env, url, method = 'POST') {
  let middleware
  let continued = false
  const result = { statusCode: 200, headers: {}, body: '' }
  const integration = createAiDevelopmentProxy(env)
  integration.guard.configureServer({
    middlewares: { use(handler) { middleware = handler } }
  })
  middleware({ url, method }, {
    set statusCode(value) { result.statusCode = value },
    setHeader(name, value) { result.headers[name] = value },
    end(body) { result.body = body }
  }, () => { continued = true })
  return { ...result, continued, integration }
}

test('missing local credentials fail before an upstream request', () => {
  const result = requestThroughGuard({}, '/ai-api/chat')
  assert.equal(result.statusCode, 503)
  assert.equal(result.continued, false)
  assert.equal(JSON.parse(result.body).message, 'AI 助手暂未启用。')
})

test('only the intended POST endpoint can reach the proxy', () => {
  const env = { DASHSCOPE_API_KEY: 'unit-test-value', DASHSCOPE_APP_ID: 'test-app' }
  assert.equal(requestThroughGuard(env, '/ai-api/another-app').statusCode, 404)
  const get = requestThroughGuard(env, '/ai-api/chat', 'GET')
  assert.equal(get.statusCode, 405)
  assert.equal(get.headers.Allow, 'POST')
  assert.equal(get.continued, false)
})

test('credentials stay in the server proxy configuration and out of responses', () => {
  const env = { DASHSCOPE_API_KEY: 'unit-test-value', DASHSCOPE_APP_ID: 'test-app' }
  const result = requestThroughGuard(env, '/ai-api/chat')
  assert.equal(result.continued, true)
  const proxy = result.integration.proxy['/ai-api']
  assert.equal(proxy.headers.Authorization, 'Bearer unit-test-value')
  assert.equal(proxy.rewrite('/ai-api/chat'), '/api/v1/apps/test-app/completion')
  assert.equal(result.body.includes(env.DASHSCOPE_API_KEY), false)
})

test('regular app routes are left unchanged', () => {
  assert.equal(requestThroughGuard({}, '/api/auth/login').continued, true)
  assert.equal(requestThroughGuard({}, '/').continued, true)
})
