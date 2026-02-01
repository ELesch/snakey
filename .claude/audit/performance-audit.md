# Performance Audit Report

**Date:** 2026-02-01
**Auditor:** Performance Auditor (Claude Code)
**Scope:** Full codebase performance review

## Executive Summary

The Snakey PWA demonstrates generally solid performance architecture with proper use of TanStack Query caching, IndexedDB for offline support, and pagination in repositories. However, several opportunities for optimization exist, particularly around the dashboard service which loads all reptiles for feeding calculations, report queries fetching excessive data, and missing React memoization in list components. The Prisma schema has appropriate indexes on foreign keys and date columns.

---

## Critical Issues

No critical issues found that would cause immediate application failures or severe performance degradation.

---

## High Priority Issues

### 1. Dashboard Service Loads All Reptiles for Feeding Calculations

**File:** `C:\Users\elesc\PCL Dropbox\Eric Lesch\local_devel\snakey\src\services\dashboard.service.ts`
**Lines:** 107-145, 150-213

**Issue:** The `countFeedingsDue()` and `getUpcomingFeedings()` methods fetch ALL reptiles for a user and then iterate through them in JavaScript to calculate feeding schedules. For users with many reptiles, this becomes increasingly slow.

```typescript
// Lines 108-119 - Fetches all reptiles
const reptiles = await prisma.reptile.findMany({
  where: { userId, deletedAt: null },
  select: {
    id: true,
    species: true,
    feedings: {
      orderBy: { date: 'desc' },
      take: 1,
      select: { date: true },
    },
  },
})
```

**Impact:** Linear performance degradation as reptile count grows. With 100+ reptiles, this query becomes expensive.

**Recommendation:** Push feeding interval calculations to the database using raw SQL with date arithmetic, or cache feeding schedules and update incrementally.

---

### 2. Reports Service Fetches All Records Without Pagination

**File:** `C:\Users\elesc\PCL Dropbox\Eric Lesch\local_devel\snakey\src\services\reports.service.ts`
**Lines:** 98-124, 129-199, 205-267, 273-330

**Issue:** All report methods (`getGrowthData`, `getFeedingStats`, `getShedStats`, `getEnvironmentStats`) fetch unbounded result sets without pagination. For long-term users, these queries will return thousands of records.

```typescript
// Lines 106-114 - No limit on results
const weights = await prisma.weight.findMany({
  where,
  include: {
    reptile: {
      select: { id: true, name: true, userId: true },
    },
  },
  orderBy: { date: 'asc' },
  // Missing: take, skip
})
```

**Impact:** Memory bloat and slow response times for users with extensive history. Charts may render slowly with thousands of data points.

**Recommendation:**
- Add pagination or limit results to a reasonable window (e.g., last 365 days by default)
- Aggregate data server-side for charts (e.g., weekly/monthly averages instead of daily points)
- Consider database-level aggregations for summaries

---

### 3. ReptileOverview Component Makes Multiple Parallel Queries

**File:** `C:\Users\elesc\PCL Dropbox\Eric Lesch\local_devel\snakey\src\components\reptiles\reptile-overview.tsx`
**Lines:** 17-22

**Issue:** The component makes 4 separate API calls that could potentially be combined:

```typescript
const { reptile, isPending: reptileLoading } = useReptile(reptileId)
const { feedings } = useFeedings(reptileId)
const { sheds } = useSheds(reptileId)
const { weights } = useWeights(reptileId)
```

**Impact:** 4 round trips to the server instead of 1. Each call fetches up to 20 records when only the most recent is needed for the overview.

**Recommendation:**
- Create a dedicated API endpoint that returns the overview data in a single query
- Or use Prisma's `include` to fetch related data in the reptile detail query
- The `useReptile` hook already supports `include` option but it's not being used here

---

### 4. Recharts Components Not Using Dynamic Imports

**Files:**
- `C:\Users\elesc\PCL Dropbox\Eric Lesch\local_devel\snakey\src\components\reports\feeding-chart.tsx`
- `C:\Users\elesc\PCL Dropbox\Eric Lesch\local_devel\snakey\src\components\reports\growth-chart.tsx`
- `C:\Users\elesc\PCL Dropbox\Eric Lesch\local_devel\snakey\src\components\reports\environment-chart.tsx`
- `C:\Users\elesc\PCL Dropbox\Eric Lesch\local_devel\snakey\src\components\reports\shed-chart.tsx`

**Issue:** Recharts is a large library (150KB+ gzipped) imported statically in multiple chart components. This adds to the initial bundle even when users don't visit the reports page.

```typescript
// Static imports at top of each file
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
```

**Impact:** Increased initial JavaScript bundle size, slower Time to Interactive (TTI).

**Recommendation:** Use Next.js dynamic imports with SSR disabled for chart components:
```typescript
const FeedingChart = dynamic(
  () => import('./feeding-chart').then(mod => mod.FeedingChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
```

---

## Medium Priority Issues

### 5. Breeding Module Lacks Offline Support

**File:** `C:\Users\elesc\PCL Dropbox\Eric Lesch\local_devel\snakey\src\hooks\use-breeding.ts`

**Issue:** Unlike `use-reptiles.ts` and `use-feedings.ts`, the breeding hooks don't implement offline support with Dexie. All breeding operations require network connectivity.

**Impact:** Inconsistent offline experience. Users cannot view or manage breeding data when offline.

**Recommendation:** Implement offline support for breeding entities following the same pattern as reptiles and feedings.

---

### 6. Photo Gallery Creates Object URLs Without Cleanup

**File:** `C:\Users\elesc\PCL Dropbox\Eric Lesch\local_devel\snakey\src\components\reptiles\photo-gallery.tsx`
**Lines:** 24-32

**Issue:** The `getPhotoUrl` function creates object URLs from blobs but doesn't clean them up:

```typescript
const getPhotoUrl = (photo: Photo | OfflinePhoto): string => {
  if ('blob' in photo && photo.blob) {
    return URL.createObjectURL(photo.blob)  // Created but never revoked
  }
  // ...
}
```

**Impact:** Memory leak. Each time the component re-renders or photos are displayed, new object URLs are created without revoking the old ones.

**Recommendation:** Use `useEffect` cleanup or `useMemo` with cleanup to revoke URLs:
```typescript
useEffect(() => {
  return () => {
    objectUrls.forEach(URL.revokeObjectURL)
  }
}, [photos])
```

---

### 7. ReptileCard Component Could Benefit from Memoization

**File:** `C:\Users\elesc\PCL Dropbox\Eric Lesch\local_devel\snakey\src\components\reptiles\reptile-grid.tsx`
**Lines:** 24-53

**Issue:** The `ReptileCard` component is not wrapped in `React.memo`. When the parent grid re-renders (e.g., on filter changes), all cards re-render even if their props haven't changed.

**Impact:** Unnecessary re-renders when the reptile list updates.

**Recommendation:** Wrap `ReptileCard` in `React.memo`:
```typescript
const ReptileCard = memo(function ReptileCard({ reptile }: ReptileCardProps) {
  // ...
})
```

---

### 8. Default QueryClient gcTime May Be Too Short

**File:** `C:\Users\elesc\PCL Dropbox\Eric Lesch\local_devel\snakey\src\components\providers\query-provider.tsx`
**Lines:** 13-19

**Issue:** The `gcTime` (garbage collection time) is set to 5 minutes. For an offline-first PWA, this may be too aggressive as it discards cached data quickly.

```typescript
gcTime: 5 * 60 * 1000, // 5 minutes
```

**Impact:** Users navigating back to previously visited pages may see loading states instead of cached data.

**Recommendation:** Consider increasing `gcTime` to 30 minutes or longer for an offline-first PWA:
```typescript
gcTime: 30 * 60 * 1000, // 30 minutes
```

---

### 9. Dashboard Activity Fetch is Inefficient

**File:** `C:\Users\elesc\PCL Dropbox\Eric Lesch\local_devel\snakey\src\services\dashboard.service.ts`
**Lines:** 218-307

**Issue:** `getRecentActivity` fetches 3 separate collections (feedings, sheds, weights) with a limit on each, then merges and re-sorts in JavaScript. This could fetch up to 30 records when only 10 are needed.

```typescript
const [feedings, sheds, weights] = await Promise.all([
  prisma.feeding.findMany({ /* ... */ take: limit }),  // 10
  prisma.shed.findMany({ /* ... */ take: limit }),     // 10
  prisma.weight.findMany({ /* ... */ take: limit }),   // 10
])
// Then sorts all 30 and takes first 10
```

**Impact:** Over-fetching from database. Fetches 3x the needed records.

**Recommendation:** Use a raw SQL union query to fetch the most recent activities across all types in a single query, limited to the exact count needed.

---

## Database Analysis

### N+1 Query Patterns Found

**No traditional N+1 patterns detected.** The codebase uses Prisma `include` and `select` appropriately to fetch related data in single queries.

### Missing Indexes

**Review of `prisma/schema.prisma` shows appropriate indexes exist:**

| Model | Indexes Present | Assessment |
|-------|-----------------|------------|
| Reptile | `userId`, `species`, `shareId` | Good |
| Feeding | `[reptileId, date]` composite | Good |
| Shed | `[reptileId, completedDate]` composite | Good |
| Weight | `[reptileId, date]` composite | Good |
| EnvironmentLog | `[reptileId, date]` composite | Good |
| VetVisit | `[reptileId, date]` composite | Good |
| Medication | `reptileId` | Good |
| Photo | `[reptileId, takenAt]` composite | Good |
| Pairing | `userId` | Good |
| Clutch | `pairingId` | Good |
| Hatchling | `clutchId` | Good |
| Expense | `[userId, date]` composite | Good |
| SyncQueue | `[userId, status]` composite | Good |
| SpeciesConfig | `userId` | Good |

**Potential Addition:** Consider adding an index on `Reptile.deletedAt` since most queries filter by `deletedAt: null`. This would help with the soft-delete pattern:
```prisma
@@index([userId, deletedAt])
```

### Query Optimization Opportunities

1. **Dashboard feeding calculations:** Move interval calculations to database
2. **Reports aggregation:** Use database GROUP BY instead of JavaScript aggregation
3. **Activity feed:** Use UNION query instead of 3 separate queries

---

## Frontend Analysis

### Re-render Issues

| Component | Issue | Severity |
|-----------|-------|----------|
| `ReptileCard` | Not memoized | Medium |
| `PhotoThumbnail` | Not memoized | Low |
| `PairingList` items | Not memoized | Low |

### Bundle Size Concerns

| Package | Estimated Size | Issue |
|---------|---------------|-------|
| `recharts` | ~150KB gzipped | Loaded eagerly for all users |
| `@react-pdf/renderer` | ~200KB+ gzipped | Listed in dependencies, verify usage |
| `lucide-react` | Tree-shakes well | OK |

**Recommendations:**
1. Dynamic import `recharts` components
2. Verify `@react-pdf/renderer` is used; if only for PDF export, dynamically import it
3. Analyze bundle with `next-bundle-analyzer`

### Caching Opportunities

| Data Type | Current Cache | Recommendation |
|-----------|---------------|----------------|
| Reptile list | 30s stale, 5min gc | Increase gc to 30min |
| Dashboard stats | 1min stale, 5min refetch | Good |
| Reports | 1min stale | Consider longer stale time (5min) |
| Photos | 30s stale | Consider longer stale time for thumbnails |

---

## Recommendations

**Priority 1 (High Impact, Moderate Effort):**
1. Add pagination/date limits to report service queries
2. Create dedicated overview endpoint for reptile detail page
3. Dynamic import Recharts components

**Priority 2 (Medium Impact, Low Effort):**
4. Add `React.memo` to list item components
5. Fix object URL memory leak in PhotoGallery
6. Increase TanStack Query `gcTime` to 30 minutes

**Priority 3 (Medium Impact, High Effort):**
7. Refactor dashboard feeding calculations to use database aggregation
8. Implement offline support for breeding module
9. Use UNION query for activity feed

**Priority 4 (Low Impact, Maintenance):**
10. Add composite index on `Reptile(userId, deletedAt)`
11. Analyze bundle with `@next/bundle-analyzer`
12. Consider server-side aggregation for chart data

---

## Appendix: Files Reviewed

### Repositories
- `src/repositories/reptile.repository.ts`
- `src/repositories/feeding.repository.ts`
- `src/repositories/shed.repository.ts`
- `src/repositories/weight.repository.ts`
- `src/repositories/environment.repository.ts`
- `src/repositories/photo.repository.ts`
- `src/repositories/vet.repository.ts`
- `src/repositories/breeding.repository.ts`

### Services
- `src/services/dashboard.service.ts`
- `src/services/reports.service.ts`

### Hooks
- `src/hooks/use-reptiles.ts`
- `src/hooks/use-feedings.ts`
- `src/hooks/use-dashboard.ts`
- `src/hooks/use-reports.ts`
- `src/hooks/use-breeding.ts`

### Components
- `src/components/reptiles/reptile-grid.tsx`
- `src/components/reptiles/reptile-overview.tsx`
- `src/components/reptiles/photo-gallery.tsx`
- `src/components/reports/feeding-chart.tsx`
- `src/components/reports/growth-chart.tsx`
- `src/components/reports/environment-chart.tsx`
- `src/components/reports/shed-chart.tsx`
- `src/components/dashboard/upcoming-feedings.tsx`
- `src/components/breeding/pairing-list.tsx`
- `src/components/providers/query-provider.tsx`

### Database
- `prisma/schema.prisma`

### Configuration
- `package.json`

---

*This audit was performed in read-only mode. No source code was modified.*
