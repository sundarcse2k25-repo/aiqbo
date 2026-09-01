/**
 * A structured, client-safe API error. Route handlers throw this (rather
 * than returning ad-hoc response shapes) so the error-handling middleware
 * can convert every failure into the same { error: { code, message } }
 * envelope without ever leaking a stack trace or internal detail.
 */
export class ApiError extends Error {
  readonly statusCode: number
  readonly code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

export function notImplemented(message: string): ApiError {
  return new ApiError(501, 'NOT_IMPLEMENTED', message)
}

export function notFound(message: string): ApiError {
  return new ApiError(404, 'NOT_FOUND', message)
}
