// Reports API Client - Handles HTTP requests to /api/reports/*
import type {
  GrowthDataPoint,
  FeedingDataPoint,
  FeedingStatsSummary,
  ShedDataPoint,
  ShedStatsSummary,
  EnvironmentDataPoint,
  EnvironmentStatsSummary,
  SummaryResponse,
  ReportFilters,
} from '@/services/reports.service'

// API Response Types
export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface SingleResponse<T> {
  data: T
}

export interface ReportsDataResponse<T, S = undefined> {
  data: T[]
  summary?: S
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
export class ReportsApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ReportsApiError'
    this.code = code
    this.status = status
  }
}

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new ReportsApiError(
        data.error.code,
        data.error.message,
        response.status
      )
    }
    throw new ReportsApiError(
      'UNKNOWN_ERROR',
      'An unexpected error occurred',
      response.status
    )
  }

  return data as T
}

// Build query string from filters
function buildQueryString(filters: ReportFilters): string {
  const params = new URLSearchParams()

  if (filters.reptileId) {
    params.set('reptileId', filters.reptileId)
  }
  if (filters.startDate) {
    params.set('startDate', filters.startDate)
  }
  if (filters.endDate) {
    params.set('endDate', filters.endDate)
  }

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * Fetch growth/weight data for charting
 */
export async function fetchGrowthData(
  filters: ReportFilters = {}
): Promise<GrowthDataPoint[]> {
  const queryString = buildQueryString(filters)
  const response = await fetch(`/api/reports/growth${queryString}`)
  const result = await handleResponse<SingleResponse<GrowthDataPoint[]>>(response)
  return result.data
}

/**
 * Fetch feeding statistics
 */
export async function fetchFeedingStats(
  filters: ReportFilters = {}
): Promise<{ data: FeedingDataPoint[]; summary: FeedingStatsSummary }> {
  const queryString = buildQueryString(filters)
  const response = await fetch(`/api/reports/feedings${queryString}`)
  const result = await handleResponse<{
    data: FeedingDataPoint[]
    summary: FeedingStatsSummary
  }>(response)
  return result
}

/**
 * Fetch shed statistics
 */
export async function fetchShedStats(
  filters: ReportFilters = {}
): Promise<{ data: ShedDataPoint[]; summary: ShedStatsSummary }> {
  const queryString = buildQueryString(filters)
  const response = await fetch(`/api/reports/sheds${queryString}`)
  const result = await handleResponse<{
    data: ShedDataPoint[]
    summary: ShedStatsSummary
  }>(response)
  return result
}

/**
 * Fetch environment statistics
 */
export async function fetchEnvironmentStats(
  filters: ReportFilters = {}
): Promise<{ data: EnvironmentDataPoint[]; summary: EnvironmentStatsSummary }> {
  const queryString = buildQueryString(filters)
  const response = await fetch(`/api/reports/environment${queryString}`)
  const result = await handleResponse<{
    data: EnvironmentDataPoint[]
    summary: EnvironmentStatsSummary
  }>(response)
  return result
}

/**
 * Fetch summary metrics for dashboard cards
 */
export async function fetchReportsSummary(): Promise<SummaryResponse> {
  const response = await fetch('/api/reports/summary')
  const result = await handleResponse<SingleResponse<SummaryResponse>>(response)
  return result.data
}
