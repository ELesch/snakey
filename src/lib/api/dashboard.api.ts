// Dashboard API Client - Handles HTTP requests to /api/dashboard/*
import type {
  DashboardStats,
  UpcomingFeeding,
  EnvironmentAlert,
  Activity,
} from '@/services/dashboard.service'

// API Response Types
export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface SingleResponse<T> {
  data: T
}

export interface ErrorResponse {
  error: ApiError
}

// Type guard
function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ErrorResponse).error === 'object'
  )
}

// API Error class
export class DashboardApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'DashboardApiError'
    this.code = code
    this.status = status
  }
}

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new DashboardApiError(
        data.error.code,
        data.error.message,
        response.status
      )
    }
    throw new DashboardApiError(
      'UNKNOWN_ERROR',
      'An unexpected error occurred',
      response.status
    )
  }

  return data as T
}

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
