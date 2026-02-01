// Dashboard API Client - Handles HTTP requests to /api/dashboard/*
import type {
  DashboardStats,
  UpcomingFeeding,
  EnvironmentAlert,
  Activity,
} from '@/services/dashboard.service'
import type { SingleResponse } from './types'
import { handleResponse } from './utils'

// Re-export ApiClientError for backwards compatibility
export { ApiClientError } from './utils'

/**
 * Fetch dashboard stats
 */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/dashboard/stats')
  const result = await handleResponse<SingleResponse<DashboardStats>>(response)
  return result.data
}

/**
 * Fetch recent activity
 */
export async function fetchRecentActivity(
  limit: number = 10
): Promise<Activity[]> {
  const response = await fetch(`/api/dashboard/activity?limit=${limit}`)
  const result = await handleResponse<SingleResponse<Activity[]>>(response)
  return result.data
}

/**
 * Fetch upcoming feedings
 */
export async function fetchUpcomingFeedings(
  days: number = 7
): Promise<UpcomingFeeding[]> {
  const response = await fetch(`/api/dashboard/feedings?days=${days}`)
  const result = await handleResponse<SingleResponse<UpcomingFeeding[]>>(response)
  return result.data
}

/**
 * Fetch environment alerts
 */
export async function fetchEnvironmentAlerts(): Promise<EnvironmentAlert[]> {
  const response = await fetch('/api/dashboard/alerts')
  const result = await handleResponse<SingleResponse<EnvironmentAlert[]>>(response)
  return result.data
}
