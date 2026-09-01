import { describe, it, expect } from 'vitest'
import { readConfig, isQboConfigured, getPublicQboConfig } from '../env'

describe('readConfig', () => {
  it('applies safe defaults when no environment variables are set', () => {
    const cfg = readConfig({})
    expect(cfg.port).toBe(4000)
    expect(cfg.frontendOrigin).toBe('http://localhost:5173')
    expect(cfg.qboEnvironment).toBe('sandbox')
    expect(cfg.qboClientId).toBeUndefined()
    expect(cfg.qboClientSecret).toBeUndefined()
    expect(cfg.qboRedirectUri).toBeUndefined()
  })

  it('reads every configured value from the provided environment', () => {
    const cfg = readConfig({
      PORT: '5000',
      FRONTEND_ORIGIN: 'http://localhost:3000',
      QBO_ENVIRONMENT: 'production',
      QBO_CLIENT_ID: 'abc',
      QBO_CLIENT_SECRET: 'secret-value',
      QBO_REDIRECT_URI: 'http://localhost:4000/api/qbo/callback',
      QBO_API_BASE_URL: 'https://quickbooks.api.intuit.com',
    })
    expect(cfg.port).toBe(5000)
    expect(cfg.frontendOrigin).toBe('http://localhost:3000')
    expect(cfg.qboEnvironment).toBe('production')
    expect(cfg.qboClientId).toBe('abc')
    expect(cfg.qboApiBaseUrl).toBe('https://quickbooks.api.intuit.com')
  })

  it('treats any QBO_ENVIRONMENT value other than "production" as sandbox', () => {
    expect(readConfig({ QBO_ENVIRONMENT: 'sandbox' }).qboEnvironment).toBe('sandbox')
    expect(readConfig({ QBO_ENVIRONMENT: 'not-a-real-value' }).qboEnvironment).toBe('sandbox')
    expect(readConfig({}).qboEnvironment).toBe('sandbox')
  })
})

describe('isQboConfigured', () => {
  it('is false when any of client id / client secret / redirect uri is missing', () => {
    expect(isQboConfigured(readConfig({}))).toBe(false)
    expect(isQboConfigured(readConfig({ QBO_CLIENT_ID: 'a' }))).toBe(false)
    expect(isQboConfigured(readConfig({ QBO_CLIENT_ID: 'a', QBO_CLIENT_SECRET: 'b' }))).toBe(false)
  })

  it('is true only when all three are present', () => {
    const cfg = readConfig({ QBO_CLIENT_ID: 'a', QBO_CLIENT_SECRET: 'b', QBO_REDIRECT_URI: 'c' })
    expect(isQboConfigured(cfg)).toBe(true)
  })
})

describe('getPublicQboConfig', () => {
  it('never includes the client secret or any credential value — only environment and a configured boolean', () => {
    const cfg = readConfig({
      QBO_CLIENT_ID: 'my-client-id',
      QBO_CLIENT_SECRET: 'super-secret-value',
      QBO_REDIRECT_URI: 'http://localhost:4000/api/qbo/callback',
    })
    const publicConfig = getPublicQboConfig(cfg)
    const serialized = JSON.stringify(publicConfig)

    expect(publicConfig).toEqual({ environment: 'sandbox', configured: true })
    expect(serialized).not.toContain('super-secret-value')
    expect(serialized).not.toContain('my-client-id')
  })

  it('reports configured: false when QBO credentials are missing', () => {
    expect(getPublicQboConfig(readConfig({})).configured).toBe(false)
  })
})
