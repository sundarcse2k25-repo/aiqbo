import * as http from 'http'
import { buildRouter } from './routes'
import { applyCors } from './middleware/cors'
import { sendJson } from './middleware/errorHandler'
import { logInfo } from './middleware/logger'
import { InMemoryTokenStore } from './providers/qbo/TokenStore'
import { config as defaultConfig, type AppConfig } from './config/env'
import { notFound } from './types/apiError.types'

/**
 * Builds the HTTP server. tokenStore/config are injectable so tests can
 * construct an isolated app instance instead of sharing the process-wide
 * singleton config/store.
 */
export function createApp(config: AppConfig = defaultConfig, tokenStore = new InMemoryTokenStore()): http.Server {
  const router = buildRouter(tokenStore, config)

  return http.createServer(async (req, res) => {
    if (applyCors(req, res, config)) return

    const url = new URL(req.url || '/', 'http://localhost')
    logInfo(`${req.method} ${url.pathname}`)

    const handler = router.match(req.method || 'GET', url.pathname)
    if (!handler) {
      const err = notFound('No route matches this request.')
      sendJson(res, err.statusCode, { error: { code: err.code, message: err.message } })
      return
    }

    await handler(req, res)
  })
}
