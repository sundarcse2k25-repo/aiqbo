import type { IncomingMessage, ServerResponse } from 'http'
import type { AppConfig } from '../config/env'

/**
 * Applies CORS headers scoped to the configured frontend origin only —
 * never a wildcard, since QBO connection state will eventually involve
 * credentials/cookies and a wildcard origin is incompatible with
 * credentialed requests anyway. Returns true when the request was an
 * OPTIONS preflight that this function has already fully responded to
 * (callers must stop processing the request in that case).
 */
export function applyCors(req: IncomingMessage, res: ServerResponse, config: AppConfig): boolean {
  res.setHeader('Access-Control-Allow-Origin', config.frontendOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return true
  }
  return false
}
