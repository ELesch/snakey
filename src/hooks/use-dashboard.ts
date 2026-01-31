'use client'

import { useQuery } from '@tanstack/react-query'
import {
  fetchDashboardStats,
  fetchRecentActivity,
  fetchUpcomingFeedings,
  fetchEnvironmentAlerts,
  DashboardApiError,
} from '@/lib/api/dashboard.api'
import type {
  DashboardStats,
  UpcomingFeeding,
  EnvironmentAlert,
  Activity,
} from '@/services/dashboard.service'

// Query keys for cache management
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: (limit?: number) => [...dashboardKeys.all, 'activity', limit] as const,
  feedings: (days?: number) => [...dashboardKeys.all, 'feedings', days] as const,
  alerts: () => [...dashboardKeys.all, 'alerts'] as const,
}

/**
 * Hook for fetching dashboard stats
 */
export function useDashboardStats() {
  const {
    data: stats,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  return {
    stats: stats as DashboardStats | undefined,
    isPending,
    isError,
    error: error as DashboardApiError | null,
    refetch,
  }
}

/**
 * Hook for fetching recent activity
 */
export function useRecentActivity(limit: number = 10) {
  const {
    data: activity,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: () => fetchRecentActivity(limit),
    staleTime: 30 * 1000, // 30 seconds
  })

  return {
    activity: activity as Activity[] | undefined,
    isPending,
    isError,
    error: error as DashboardApiError | null,
    refetch,
  }
}

/**
 * Hook for fetching upcoming feedings
 */
export function useUpcomingFeedings(days: number = 7) {
  const {
    data: feedings,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: dashboardKeys.feedings(days),
    queryFn: () => fetchUpcomingFeedings(days),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  return {
    feedings: feedings as UpcomingFeeding[] | undefined,
    isPending,
    isError,
    error: error as DashboardApiError | null,
    refetch,
  }
}

/**
 * Hook for fetching environment alerts
 */
export function useEnvironmentAlerts() {
  const {
    data: alerts,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: dashboardKeys.alerts(),
    queryFn: fetchEnvironmentAlerts,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes (alerts are time-sensitive)
  })

  return {
    alerts: alerts as EnvironmentAlert[] | undefined,
    isPending,
    isError,
    error: error as DashboardApiError | null,
    refetch,
  }
}
