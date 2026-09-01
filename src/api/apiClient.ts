import axios from 'axios'

/**
 * Thin API client boundary for the backend created in Phase 2. Components
 * should call functions exported from this module rather than issuing raw
 * fetch()/axios calls of their own, so the base URL and future concerns
 * (auth headers, error normalization) live in exactly one place.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
})

export interface HealthStatus {
  status: string
  timestamp: string
}

export async function getHealth(): Promise<HealthStatus> {
  const response = await apiClient.get<HealthStatus>('/api/health')
  return response.data
}

export interface QboStatus {
  environment: 'sandbox' | 'production'
  configured: boolean
  connections: unknown[]
}

export async function getQboStatus(): Promise<QboStatus> {
  const response = await apiClient.get<QboStatus>('/api/qbo/status')
  return response.data
}
