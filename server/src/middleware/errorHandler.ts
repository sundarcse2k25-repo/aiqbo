import type { IncomingMessage, ServerResponse } from 'http'
import { ApiError } from '../types/apiError.types'
import { logError } from './logger'
import type { RouteHandler } from '../http/router'

export function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(payload)
}

/**
 * Wraps a route handler so any thrown error becomes a structured JSON
 * response instead of an uncaught exception or a leaked stack trace. A
 * thrown ApiError is reported using its own statusCode/code/message; any
 * other error is logged server-side (message only — never the request
 * body, which will eventually carry an OAuth authorization code) and
 * reported to the client as a generic 500 with no internal detail.
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      await handler(req, res)
    } catch (err) {
      if (err instanceof ApiError) {
        sendJson(res, err.statusCode, { error: { code: err.code, message: err.message } })
        return
      }
      logError('Unhandled request error', err)
      sendJson(res, 500, { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } })
    }
  }
}
