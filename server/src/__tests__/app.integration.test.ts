import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'net'
import { createApp } from '../app'
import { readConfig } from '../config/env'

/**
 * Starts a real app instance on an ephemeral port and issues real HTTP
 * requests against it — this is the one place Phase 2's "actually run the
 * backend, don't just check that it compiles" requirement is exercised in
 * an automated test.
 */
/** Test-only helper: parses a fetch Response body as JSON with a permissive shape for assertions. */
async function json(res: Response): Promise<Record<string, any>> {
  return (await res.json()) as Record<string, any>
}

async function withRunningApp<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
  const app = createApp(readConfig({ FRONTEND_ORIGIN: 'http://localhost:5173' }))
  await new Promise<void>((resolve) => app.listen(0, resolve))
  const { port } = app.address() as AddressInfo
  try {
    return await fn(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise<void>((resolve) => app.close(() => resolve()))
  }
}

describe('backend app — integration (real HTTP server, real requests)', () => {
  it('GET /api/health returns 200 with status "ok"', async () => {
    await withRunningApp(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/health`)
      expect(res.status).toBe(200)
      const body = await json(res)
      expect(body.status).toBe('ok')
      expect(typeof body.timestamp).toBe('string')
    })
  })

  it('GET /api/qbo/status reports real (not fabricated) configuration and connection state', async () => {
    await withRunningApp(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/qbo/status`)
      expect(res.status).toBe(200)
      const body = await json(res)
      expect(body.configured).toBe(false) // no QBO_CLIENT_ID/SECRET set in this test's config
      expect(body.environment).toBe('sandbox')
      expect(body.connections).toEqual([]) // nothing connected — never pretends otherwise
    })
  })

  it('GET /api/qbo/connect responds 501 NOT_IMPLEMENTED rather than pretending to start OAuth', async () => {
    await withRunningApp(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/qbo/connect`)
      expect(res.status).toBe(501)
      const body = await json(res)
      expect(body.error.code).toBe('NOT_IMPLEMENTED')
    })
  })

  it('POST /api/qbo/disconnect responds 501 NOT_IMPLEMENTED', async () => {
    await withRunningApp(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/qbo/disconnect`, { method: 'POST' })
      expect(res.status).toBe(501)
    })
  })

  it('an unknown route returns a structured 404, not an uncaught exception', async () => {
    await withRunningApp(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/does-not-exist`)
      expect(res.status).toBe(404)
      const body = await json(res)
      expect(body.error.code).toBe('NOT_FOUND')
    })
  })

  it('sets CORS headers scoped to the configured frontend origin, never a wildcard', async () => {
    await withRunningApp(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/health`)
      expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173')
      expect(res.headers.get('access-control-allow-origin')).not.toBe('*')
    })
  })

  it('responds to an OPTIONS preflight request without invoking a route handler', async () => {
    await withRunningApp(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/health`, { method: 'OPTIONS' })
      expect(res.status).toBe(204)
    })
  })

  it('never includes a client secret anywhere in an /api/qbo/status response, even when QBO is configured', async () => {
    const app = createApp(
      readConfig({
        FRONTEND_ORIGIN: 'http://localhost:5173',
        QBO_CLIENT_ID: 'real-looking-client-id',
        QBO_CLIENT_SECRET: 'super-secret-value-must-never-leak',
        QBO_REDIRECT_URI: 'http://localhost:4000/api/qbo/callback',
      }),
    )
    await new Promise<void>((resolve) => app.listen(0, resolve))
    const { port } = app.address() as AddressInfo
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/qbo/status`)
      const text = await res.text()
      expect(text).not.toContain('super-secret-value-must-never-leak')
      expect(JSON.parse(text).configured).toBe(true)
    } finally {
      await new Promise<void>((resolve) => app.close(() => resolve()))
    }
  })
})
