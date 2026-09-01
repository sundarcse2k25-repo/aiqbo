import type { IncomingMessage, ServerResponse } from 'http'
import { sendJson } from '../middleware/errorHandler'

export function getHealth(_req: IncomingMessage, res: ServerResponse): void {
  sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() })
}
