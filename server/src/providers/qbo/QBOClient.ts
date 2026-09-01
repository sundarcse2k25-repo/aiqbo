/**
 * Placeholder for the future authenticated QBO API HTTP client (Phase 4).
 * It will use the access token supplied via QBOProvider/TokenStore to call
 * the QBO Accounting API — handling pagination, retry/rate-limit backoff,
 * and translating QBO error responses — so every other file that needs
 * QBO data goes through QBOProvider → QBOClient rather than calling QBO
 * directly. Intentionally empty in Phase 2: no HTTP call to QBO is made
 * anywhere in the backend yet.
 */
export {}
