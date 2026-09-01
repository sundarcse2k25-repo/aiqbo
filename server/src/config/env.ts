import { loadEnvFile } from './loadEnvFile'

loadEnvFile()

export type QboEnvironment = 'sandbox' | 'production'

export interface AppConfig {
  port: number
  frontendOrigin: string
  qboEnvironment: QboEnvironment
  qboClientId: string | undefined
  qboClientSecret: string | undefined
  qboRedirectUri: string | undefined
  qboApiBaseUrl: string | undefined
}

/**
 * Builds an AppConfig from an environment record. Pure and side-effect
 * free (other than the loadEnvFile() call above, which runs once at
 * module load) so tests can exercise it with an arbitrary env object
 * without touching the real process.env.
 */
export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const qboEnvironment: QboEnvironment = env.QBO_ENVIRONMENT === 'production' ? 'production' : 'sandbox'

  return {
    port: Number(env.PORT) || 4000,
    frontendOrigin: env.FRONTEND_ORIGIN || 'http://localhost:5173',
    qboEnvironment,
    qboClientId: env.QBO_CLIENT_ID || undefined,
    qboClientSecret: env.QBO_CLIENT_SECRET || undefined,
    qboRedirectUri: env.QBO_REDIRECT_URI || undefined,
    qboApiBaseUrl: env.QBO_API_BASE_URL || undefined,
  }
}

export const config: AppConfig = readConfig()

/**
 * Whether enough QBO application credentials are present to attempt the
 * OAuth flow (Phase 3). Only ever reports presence/absence — the
 * credential values themselves are never returned, logged, or otherwise
 * exposed by this function.
 */
export function isQboConfigured(cfg: AppConfig): boolean {
  return Boolean(cfg.qboClientId && cfg.qboClientSecret && cfg.qboRedirectUri)
}

/**
 * The subset of configuration that is safe to return to the frontend.
 * QBO_CLIENT_SECRET (and every other credential value) never appears here.
 */
export function getPublicQboConfig(cfg: AppConfig): { environment: QboEnvironment; configured: boolean } {
  return {
    environment: cfg.qboEnvironment,
    configured: isQboConfigured(cfg),
  }
}
