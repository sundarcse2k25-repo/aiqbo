import { Router } from '../http/router'
import { withErrorHandling } from '../middleware/errorHandler'
import { getHealth } from '../controllers/health.controller'
import { makeQboController } from '../controllers/qbo.controller'
import type { TokenStore } from '../providers/qbo/TokenStore'
import type { AppConfig } from '../config/env'

export function buildRouter(tokenStore: TokenStore, config: AppConfig): Router {
  const router = new Router()
  const qboController = makeQboController(tokenStore, config)

  router.get('/api/health', withErrorHandling(getHealth))
  router.get('/api/qbo/status', withErrorHandling(qboController.getStatus))
  router.get('/api/qbo/connect', withErrorHandling(qboController.connect))
  router.get('/api/qbo/callback', withErrorHandling(qboController.callback))
  router.post('/api/qbo/disconnect', withErrorHandling(qboController.disconnect))

  return router
}
