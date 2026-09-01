import type { QboConnection, QboConnectionSummary, ConnectionId } from '../../types/qboConnection.types'
import { toConnectionSummary } from '../../types/qboConnection.types'

/**
 * The persistence boundary for QBO OAuth connections. Every caller
 * (routes, the future QBOProvider) depends only on this interface, never
 * on how connections are actually stored — so a real, encrypted-at-rest
 * implementation can replace InMemoryTokenStore below with no change to
 * any other file. Supports any number of connections (one per QBO
 * company/realm the user has connected), never a single hardcoded one.
 */
export interface TokenStore {
  getConnection(connectionId: ConnectionId): Promise<QboConnection | null>
  saveConnection(connection: QboConnection): Promise<void>
  removeConnection(connectionId: ConnectionId): Promise<void>
  listConnections(): Promise<QboConnectionSummary[]>
}

/**
 * DEVELOPMENT-ONLY placeholder. Connections live in a plain in-memory Map
 * and are lost on every server restart — this must NEVER be used in
 * production. It exists solely so the TokenStore interface/abstraction can
 * be exercised by routes and tests before Phase 3 wires up real OAuth and
 * a real persistence layer (e.g. an encrypted database table or secrets
 * manager) is built behind the same interface.
 */
export class InMemoryTokenStore implements TokenStore {
  private connections = new Map<ConnectionId, QboConnection>()

  async getConnection(connectionId: ConnectionId): Promise<QboConnection | null> {
    return this.connections.get(connectionId) ?? null
  }

  async saveConnection(connection: QboConnection): Promise<void> {
    this.connections.set(connection.connectionId, connection)
  }

  async removeConnection(connectionId: ConnectionId): Promise<void> {
    this.connections.delete(connectionId)
  }

  async listConnections(): Promise<QboConnectionSummary[]> {
    return Array.from(this.connections.values()).map(toConnectionSummary)
  }
}
