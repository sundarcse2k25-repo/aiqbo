export type ConnectionId = string

/**
 * One connected QBO company (a "realm", in QBO's own terminology). Nothing
 * in this shape assumes a single hardcoded company — a user may have any
 * number of QboConnections, each identified by its own connectionId/realmId,
 * satisfying the multi-company requirement from the start.
 */
export interface QboConnection {
  connectionId: ConnectionId
  realmId: string
  companyName?: string
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
  createdAt: string
  updatedAt: string
}

/** The subset of a connection that is safe to return to the frontend — accessToken/refreshToken are never included. */
export type QboConnectionSummary = Omit<QboConnection, 'accessToken' | 'refreshToken'>

export function toConnectionSummary(connection: QboConnection): QboConnectionSummary {
  const { accessToken, refreshToken, ...summary } = connection
  return summary
}
