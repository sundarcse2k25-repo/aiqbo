import type { IncomingMessage, ServerResponse } from 'http'
import { sendJson } from '../middleware/errorHandler'
import { getPublicQboConfig, type AppConfig } from '../config/env'
import { notImplemented } from '../types/apiError.types'
import type { TokenStore } from '../providers/qbo/TokenStore'

/**
 * QBO route handlers. getStatus reports real, current state (configuration
 * presence and any connections already in the TokenStore) — it never
 * fabricates a "connected" state. connect/callback/disconnect are
 * deliberately unimplemented in Phase 2 (see the QBO readiness audit's
 * Phase 3 scope) and report that clearly via 501 rather than pretending to
 * succeed.
 */
export function makeQboController(tokenStore: TokenStore, config: AppConfig) {
  return {
    async getStatus(_req: IncomingMessage, res: ServerResponse): Promise<void> {
      const connections = await tokenStore.listConnections()
      sendJson(res, 200, {
        ...getPublicQboConfig(config),
        connections,
      })
    },

    async connect(): Promise<void> {
      throw notImplemented('QBO OAuth connect is not implemented yet — planned for Phase 3.')
    },

    async callback(): Promise<void> {
      throw notImplemented('QBO OAuth callback is not implemented yet — planned for Phase 3.')
    },

    async disconnect(): Promise<void> {
      throw notImplemented('QBO disconnect is not implemented yet — planned for Phase 3.')
    },
  }
}
