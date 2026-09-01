import { describe, it, expect } from 'vitest'
import type { ServerResponse } from 'http'
import { withErrorHandling } from '../errorHandler'
import { ApiError, notImplemented } from '../../types/apiError.types'

/** A minimal stand-in for http.ServerResponse capturing only what sendJson() touches. */
function makeMockResponse() {
  const headers: Record<string, string> = {}
  let body = ''
  let statusCode = 200
  const res = {
    setHeader(name: string, value: string) {
      headers[name] = value
    },
    end(chunk?: string) {
      if (chunk) body = chunk
    },
    get statusCode() {
      return statusCode
    },
    set statusCode(code: number) {
      statusCode = code
    },
  }
  return { res: res as unknown as ServerResponse, headers, getBody: () => body, getStatus: () => statusCode }
}

describe('withErrorHandling', () => {
  it('lets a handler that does not throw respond normally', async () => {
    const { res, getStatus } = makeMockResponse()
    const handler = withErrorHandling(async (_req, r) => {
      r.statusCode = 200
      r.end('ok')
    })
    await handler({} as never, res)
    expect(getStatus()).toBe(200)
  })

  it('converts a thrown ApiError into its own statusCode/code/message, not a generic 500', async () => {
    const { res, getBody, getStatus } = makeMockResponse()
    const handler = withErrorHandling(async () => {
      throw notImplemented('QBO OAuth connect is not implemented yet — planned for Phase 3.')
    })
    await handler({} as never, res)

    expect(getStatus()).toBe(501)
    const parsed = JSON.parse(getBody())
    expect(parsed.error.code).toBe('NOT_IMPLEMENTED')
    expect(parsed.error.message).toMatch(/Phase 3/)
  })

  it('converts an unexpected (non-ApiError) throw into a generic 500 with no internal detail leaked', async () => {
    const { res, getBody, getStatus } = makeMockResponse()
    const handler = withErrorHandling(async () => {
      throw new Error('some internal database connection string: postgres://user:pw@host/db')
    })
    await handler({} as never, res)

    expect(getStatus()).toBe(500)
    const parsed = JSON.parse(getBody())
    expect(parsed.error.code).toBe('INTERNAL_ERROR')
    expect(parsed.error.message).toBe('An unexpected error occurred.')
    expect(getBody()).not.toContain('postgres://')
  })

  it('a custom ApiError carries its own statusCode through untouched', async () => {
    const { res, getStatus } = makeMockResponse()
    const handler = withErrorHandling(async () => {
      throw new ApiError(403, 'FORBIDDEN', 'not allowed')
    })
    await handler({} as never, res)
    expect(getStatus()).toBe(403)
  })
})
