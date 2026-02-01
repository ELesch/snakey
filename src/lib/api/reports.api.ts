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
import type { SingleResponse } from './types'
import { handleResponse, buildQueryString } from './utils'

// Re-export ApiClientError for backwards compatibility
export { ApiClientError } from './utils'

/**
 * Fetch growth/weight data for charting
 */
export async function fetchGrowthData(
  filters: ReportFilters = {}
): Promise<GrowthDataPoint[]> {
  const queryString = buildQueryString(filters as Record<string, unknown>)
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
  const queryString = buildQueryString(filters as Record<string, unknown>)
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
  const queryString = buildQueryString(filters as Record<string, unknown>)
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
  const queryString = buildQueryString(filters as Record<string, unknown>)
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
