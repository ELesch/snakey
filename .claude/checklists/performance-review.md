# Performance Review Checklist

> Target: Fast, responsive user experience

## Pre-Review
- [ ] Know baseline metrics (if any)
- [ ] Have profiling tools ready

## Core Web Vitals

### Largest Contentful Paint (LCP)
- [ ] Target: < 2.5s
- [ ] Hero images optimized
- [ ] Critical CSS inlined
- [ ] Server response time fast

### First Input Delay (FID) / Interaction to Next Paint (INP)
- [ ] Target: < 100ms (FID), < 200ms (INP)
- [ ] No long tasks blocking main thread
- [ ] Event handlers are fast
- [ ] Heavy computation in workers

### Cumulative Layout Shift (CLS)
- [ ] Target: < 0.1
- [ ] Images have width/height
- [ ] Fonts don't cause layout shift
- [ ] Dynamic content has reserved space

## Database Performance

### Queries
- [ ] No N+1 query patterns
- [ ] Queries use indexes
- [ ] No SELECT * without LIMIT
- [ ] Complex queries use EXPLAIN

### Indexing
- [ ] Foreign keys indexed
- [ ] Query filter columns indexed
- [ ] No unused indexes
- [ ] Composite indexes for multi-column filters

### Connection Management
- [ ] Connection pooling configured
- [ ] Pool size appropriate for workload
- [ ] Connections released properly

## Frontend Performance

### Bundle Size
- [ ] Code splitting implemented
- [ ] Dynamic imports for large modules
- [ ] Tree shaking effective
- [ ] No duplicate dependencies
- [ ] Bundle analyzer run

### Rendering
- [ ] React components memoized appropriately
- [ ] No unnecessary re-renders
- [ ] Large lists virtualized
- [ ] Expensive calculations memoized

### Assets
- [ ] Images optimized (WebP, AVIF)
- [ ] Images lazy-loaded
- [ ] Fonts preloaded
- [ ] Static assets cached

## API Performance

### Response Times
- [ ] Endpoints < 200ms average
- [ ] No single endpoint > 1s
- [ ] Slow queries identified

### Caching
- [ ] Frequently accessed data cached
- [ ] Cache invalidation strategy clear
- [ ] HTTP caching headers set

### Pagination
- [ ] Large collections paginated
- [ ] Cursor-based for large datasets
- [ ] Reasonable default page size

## Memory Management

- [ ] No memory leaks (subscriptions cleaned up)
- [ ] Event listeners removed
- [ ] Large objects released
- [ ] No unbounded caches

## Sign-Off
- Reviewer: _______
- Date: _______
- Issues: [ ] None [ ] See below

| Severity | Issue | Metric | Location | Fix |
|----------|-------|--------|----------|-----|
| | | | | |
