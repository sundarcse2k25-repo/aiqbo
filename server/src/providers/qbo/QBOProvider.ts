import { isQboConfigured, type AppConfig } from '../../config/env'

/**
 * The future boundary between this backend and QuickBooks Online. No
 * route, controller, or (especially) reporting-engine code should ever
 * import a QBO SDK type or raw QBO API response shape directly — every
 * QBO interaction must pass through an implementation of this interface
 * first, so QBO-specific concepts never leak past it.
 *
 * Phase 2 establishes only the interface and a real configuration check.
 * Phase 3 will extend this with the actual OAuth flow (getAuthorizationUrl,
 * exchangeCodeForTokens, refreshAccessToken); Phase 4 adds QBOClient (the
 * authenticated QBO API HTTP client) behind the same seam.
 */
export interface QBOProvider {
  /** Whether QBO_CLIENT_ID / QBO_CLIENT_SECRET / QBO_REDIRECT_URI are all configured — never reveals the values themselves. */
  isConfigured(): boolean
}

export class DefaultQBOProvider implements QBOProvider {
  constructor(private readonly config: AppConfig) {}

  isConfigured(): boolean {
    return isQboConfigured(this.config)
  }
}
