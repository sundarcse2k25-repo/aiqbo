/**
 * Minimal server logging. Callers must never pass a secret (client_secret,
 * access_token, refresh_token, authorization_code) into these functions —
 * only request metadata (method, path) and error messages are logged.
 */

function timestamp(): string {
  return new Date().toISOString()
}

export function logInfo(message: string): void {
  console.log(`[${timestamp()}] INFO  ${message}`)
}

export function logError(message: string, err?: unknown): void {
  const detail = err instanceof Error ? err.message : err !== undefined ? String(err) : ''
  console.error(`[${timestamp()}] ERROR ${message}${detail ? ' — ' + detail : ''}`)
}
