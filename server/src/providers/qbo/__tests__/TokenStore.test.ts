import { describe, it, expect } from 'vitest'
import { InMemoryTokenStore } from '../TokenStore'
import type { QboConnection } from '../../../types/qboConnection.types'

function makeConnection(overrides: Partial<QboConnection> = {}): QboConnection {
  return {
    connectionId: 'CONN-1',
    realmId: 'REALM-1',
    companyName: 'Test Company',
    accessToken: 'access-token-value',
    refreshToken: 'refresh-token-value',
    accessTokenExpiresAt: '2026-01-01T00:00:00.000Z',
    refreshTokenExpiresAt: '2026-06-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('InMemoryTokenStore', () => {
  it('can instantiate without any real QBO credentials', () => {
    expect(() => new InMemoryTokenStore()).not.toThrow()
  })

  it('returns null for a connection that was never saved', async () => {
    const store = new InMemoryTokenStore()
    expect(await store.getConnection('MISSING')).toBeNull()
  })

  it('saves and retrieves a connection by id', async () => {
    const store = new InMemoryTokenStore()
    const connection = makeConnection()
    await store.saveConnection(connection)
    expect(await store.getConnection('CONN-1')).toEqual(connection)
  })

  it('supports multiple connections (multi-company), independently addressable', async () => {
    const store = new InMemoryTokenStore()
    await store.saveConnection(makeConnection({ connectionId: 'CONN-A', realmId: 'REALM-A' }))
    await store.saveConnection(makeConnection({ connectionId: 'CONN-B', realmId: 'REALM-B' }))

    const list = await store.listConnections()
    expect(list.length).toBe(2)
    expect(list.map((c) => c.realmId).sort()).toEqual(['REALM-A', 'REALM-B'])
  })

  it('removes a connection', async () => {
    const store = new InMemoryTokenStore()
    await store.saveConnection(makeConnection())
    await store.removeConnection('CONN-1')
    expect(await store.getConnection('CONN-1')).toBeNull()
  })

  it('listConnections never exposes accessToken or refreshToken', async () => {
    const store = new InMemoryTokenStore()
    await store.saveConnection(makeConnection())
    const list = await store.listConnections()
    const serialized = JSON.stringify(list)

    expect(serialized).not.toContain('access-token-value')
    expect(serialized).not.toContain('refresh-token-value')
    expect((list[0] as unknown as { accessToken?: unknown }).accessToken).toBeUndefined()
  })
})
