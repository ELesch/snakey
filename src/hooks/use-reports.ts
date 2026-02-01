'use client'

import { useQuery } from '@tanstack/react-query'
import {
  fetchGrowthData,
  fetchFeedingStats,
  fetchShedStats,
  fetchEnvironmentStats,
  fetchReportsSummary,
} from '@/lib/api/reports.api'
import { ApiClientError } from '@/lib/api/utils'
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

// Query keys for cache management
export const reportsKeys = {
  all: ['reports'] as const,
  growth: (filters?: ReportFilters) => [...reportsKeys.all, 'growth', filters] as const,
  feedings: (filters?: ReportFilters) => [...reportsKeys.all, 'feedings', filters] as const,
  sheds: (filters?: ReportFilters) => [...reportsKeys.all, 'sheds', filters] as const,
  environment: (filters?: ReportFilters) => [...reportsKeys.all, 'environment', filters] as const,
  summary: () => [...reportsKeys.all, 'summary'] as const,
}

/**
 * Hook for fetching growth/weight data
 */
export function useGrowthData(filters: ReportFilters = {}) {
  const {
    data: growthData,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: reportsKeys.growth(filters),
    queryFn: () => fetchGrowthData(filters),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  return {
    growthData: growthData as GrowthDataPoint[] | undefined,
    isPending,
    isError,
    error: error as ApiClientError | null,
    refetch,
  }
}

/**
 * Hook for fetching feeding statistics
 */
export function useFeedingStats(filters: ReportFilters = {}) {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: reportsKeys.feedings(filters),
    queryFn: () => fetchFeedingStats(filters),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  return {
    feedingData: data?.data as FeedingDataPoint[] | undefined,
    feedingSummary: data?.summary as FeedingStatsSummary | undefined,
    isPending,
    isError,
    error: error as ApiClientError | null,
    refetch,
  }
}

/**
 * Hook for fetching shed statistics
 */
export function useShedStats(filters: ReportFilters = {}) {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: reportsKeys.sheds(filters),
    queryFn: () => fetchShedStats(filters),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  return {
    shedData: data?.data as ShedDataPoint[] | undefined,
    shedSummary: data?.summary as ShedStatsSummary | undefined,
    isPending,
    isError,
    error: error as ApiClientError | null,
    refetch,
  }
}

/**
 * Hook for fetching environment statistics
 */
export function useEnvironmentStats(filters: ReportFilters = {}) {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: reportsKeys.environment(filters),
    queryFn: () => fetchEnvironmentStats(filters),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  return {
    environmentData: data?.data as EnvironmentDataPoint[] | undefined,
    environmentSummary: data?.summary as EnvironmentStatsSummary | undefined,
    isPending,
    isError,
    error: error as ApiClientError | null,
    refetch,
  }
}

/**
 * Hook for fetching reports summary
 */
export function useReportsSummary() {
  const {
    data: summary,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: reportsKeys.summary(),
    queryFn: fetchReportsSummary,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  return {
    summary: summary as SummaryResponse | undefined,
    isPending,
    isError,
    error: error as ApiClientError | null,
    refetch,
  }
}
