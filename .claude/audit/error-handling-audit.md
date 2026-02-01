# Error Handling Audit Report

**Date:** 2026-02-01
**Scope:** Snakey PWA - Error handling, error boundaries, user messages, and logging
**Auditor:** dev-auditor-errors

---

## 1. Executive Summary

The Snakey PWA has **solid foundational error handling** with well-structured custom error classes, consistent API error responses, and good structured logging via Pino. However, there are **critical gaps** in React error boundary implementation and user-facing error communication that could result in poor user experience during failures.

### Overall Assessment: **Needs Improvement**

| Area | Status | Priority |
|------|--------|----------|
| Error Boundaries | Missing | Critical |
| User Error Messages | Inconsistent | High |
| API Error Handling | Good | Low |
| Form Validation | Good | Low |
| Offline/Sync Errors | Partial | Medium |
| Logging | Good | Low |

---

## 2. Error Boundary Coverage Analysis

### Current State: **NO ERROR BOUNDARIES IMPLEMENTED**

**Files Checked:**
- `src/app/**/error.tsx` - Not found
- `src/app/**/global-error.tsx` - Not found
- `src/components/**/*ErrorBoundary*` - Not found

### Critical Gaps

1. **No global error boundary** (`src/app/global-error.tsx`)
   - Uncaught errors in root layout will crash the entire app
   - Users see blank white screen on critical failures

2. **No route-level error boundaries** (`error.tsx`)
   - Route segment errors propagate up uncaught
   - Missing in all route groups: `(app)`, `(auth)`

3. **No component-level error boundaries**
   - Chart components (Recharts, Tremor) can throw on malformed data
   - Photo gallery could fail on corrupt image data
   - Offline data corruption has no graceful handling

### Impact

- **User Experience:** App crashes show blank screens or technical errors
- **Debugging:** No error information captured at boundary level
- **Recovery:** Users cannot recover without full page refresh

### Recommendation

Create error boundaries at three levels:
```
src/app/global-error.tsx          (root level)
src/app/(app)/error.tsx           (app routes)
src/app/(auth)/error.tsx          (auth routes)
src/app/(app)/reptiles/error.tsx  (feature level - optional)
```

---

## 3. User Message Quality Assessment

### API Error Messages

**Location:** `src/lib/api/reptile.api.ts` (and similar files)

| Error Code | Message | User-Friendly? |
|------------|---------|----------------|
| `UNAUTHORIZED` | "Authentication required" | Yes |
| `NOT_FOUND` | "Reptile not found" | Yes |
| `FORBIDDEN` | "Access denied" | Acceptable |
| `VALIDATION_ERROR` | Variable (from Zod) | Needs improvement |
| `INTERNAL_ERROR` | "Internal server error" | No - Too technical |
| `UNKNOWN_ERROR` | "An unexpected error occurred" | Acceptable |

### Component Error States

**Good Examples:**

1. `src/components/reptiles/feeding-history.tsx` (lines 40-58):
```tsx
if (isError) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <X className="h-12 w-12 mx-auto mb-4 text-red-300" />
        <p className="text-red-600">Failed to load feeding history</p>
        <p className="text-sm text-warm-500">Please try again later</p>
      </CardContent>
    </Card>
  )
}
```
- Clear visual indicator
- Friendly message
- Guidance for user

2. `src/components/dashboard/upcoming-feedings.tsx` (lines 39-47):
```tsx
if (isError) {
  return (
    <div className="text-center py-8">
      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
      <p>Could not load feedings</p>
      <p className="text-sm">Please try again later</p>
    </div>
  )
}
```
- Good pattern but **no retry button**

### Issues Found

1. **No retry mechanism** in error states
   - Users told to "try again later" but no retry button provided
   - Must refresh entire page to retry

2. **Generic "Internal server error"** exposed to users
   - API routes return technical message on 500 errors
   - Should be: "Something went wrong. Please try again."

3. **Missing error states in some components**
   - `src/components/reptiles/reptile-header.tsx` handles "not found" but not API errors
   - Delete confirmation dialog doesn't show error feedback (line 32-35 just logs)

4. **Inconsistent error styling**
   - Some use `text-red-600`, others use `text-destructive`
   - No unified error component

---

## 4. Logging Consistency Review

### Logger Implementation

**Location:** `src/lib/logger.ts`

**Strengths:**
- Pino structured logging with context
- Sensitive field redaction (password, token, apiKey, etc.)
- Pretty printing in development
- JSON format in production
- Child logger pattern with `createLogger('ServiceName')`

**Usage Patterns:**

| Layer | Logging? | Quality |
|-------|----------|---------|
| API Routes | Yes | Good - errors logged with context |
| Services | Yes | Good - operations logged at info/warn/error |
| Hooks | No | Missing - client-side errors not logged |
| Components | Partial | Only console.error used |
| Offline Sync | Yes | Good |

### Logging Gaps

1. **Client-side error logging missing**
   - No error reporting service integration (e.g., Sentry)
   - Component errors go to console only
   - Offline sync failures logged but not surfaced

2. **Inconsistent log levels**
   - Some validation failures logged as `warn`, others as `error`

3. **Missing correlation IDs**
   - No request ID passed through API chain
   - Difficult to trace errors across layers

---

## 5. Critical Gaps Identified

### Priority 1 (Critical)

| Gap | Impact | Location |
|-----|--------|----------|
| No error boundaries | App crashes show blank screen | All `src/app/` routes |
| No global-error.tsx | Root errors unhandled | `src/app/global-error.tsx` |

### Priority 2 (High)

| Gap | Impact | Location |
|-----|--------|----------|
| Generic server errors | Users see "Internal server error" | All API routes |
| No retry buttons | Users must refresh page | Error state components |
| No toast/notification system | Mutation errors not shown | Forms, mutations |

### Priority 3 (Medium)

| Gap | Impact | Location |
|-----|--------|----------|
| Sync failure UX | Users don't know what failed | `OfflineIndicator` shows count only |
| Delete fails silently | Error logged but not shown | `reptile-header.tsx` line 32 |
| No client error reporting | Errors lost in production | All client components |

### Priority 4 (Low)

| Gap | Impact | Location |
|-----|--------|----------|
| Inconsistent error styling | Visual inconsistency | Various components |
| Missing correlation IDs | Harder debugging | API/Service layers |

---

## 6. Remediation Recommendations

### Immediate Actions (Priority 1)

1. **Create global error boundary**

```tsx
// src/app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
```

2. **Create app route error boundary**

```tsx
// src/app/(app)/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-warm-600 mb-6">
        We couldn't load this page. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

### Short-term Actions (Priority 2)

3. **Add toast notification system**
   - Install sonner or react-hot-toast
   - Wrap mutations with toast feedback
   - Show success/error toasts for CRUD operations

4. **Create reusable ErrorState component**

```tsx
// src/components/ui/error-state.tsx
interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again later',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="text-center py-8">
      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
      <h3 className="font-semibold text-warm-900 mb-1">{title}</h3>
      <p className="text-sm text-warm-600 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
```

5. **Improve server error messages**
   - Replace "Internal server error" with user-friendly messages
   - Log detailed error server-side, return friendly message to client

### Medium-term Actions (Priority 3)

6. **Enhance sync failure UX**
   - Show which records failed to sync
   - Allow manual retry per record
   - Clear failure notification after success

7. **Add client-side error reporting**
   - Integrate Sentry or similar
   - Capture unhandled errors and rejections
   - Include user context (anonymized)

8. **Add delete error feedback**
   - Show toast on delete failure
   - Don't close dialog on error

---

## 7. Checklist for Implementation

- [ ] Create `src/app/global-error.tsx`
- [ ] Create `src/app/(app)/error.tsx`
- [ ] Create `src/app/(auth)/error.tsx`
- [ ] Install toast library (sonner recommended)
- [ ] Create `ErrorState` component
- [ ] Add retry buttons to all error states
- [ ] Replace "Internal server error" messages
- [ ] Add toast notifications to mutations
- [ ] Integrate error reporting service
- [ ] Add correlation IDs to API requests
- [ ] Standardize error styling with CSS variables

---

## 8. Files Reviewed

| File | Purpose | Assessment |
|------|---------|------------|
| `src/lib/errors.ts` | Error class definitions | Good - well-structured |
| `src/lib/logger.ts` | Logging implementation | Good - proper Pino setup |
| `src/lib/api/reptile.api.ts` | API client | Good - consistent error handling |
| `src/app/api/reptiles/route.ts` | API route | Good - proper error responses |
| `src/app/api/reptiles/[id]/route.ts` | API route | Good - handles all error types |
| `src/hooks/use-reptiles.ts` | Data hook | Acceptable - exposes error state |
| `src/hooks/use-feedings.ts` | Data hook | Acceptable - consistent pattern |
| `src/components/reptiles/feeding-history.tsx` | Component | Good error state, no retry |
| `src/components/reptiles/reptile-form.tsx` | Form | Good validation errors |
| `src/components/reptiles/photo-upload.tsx` | Upload | Good file validation |
| `src/components/layout/offline-indicator.tsx` | Sync UI | Acceptable - shows counts |
| `src/components/providers/sync-provider.tsx` | Sync logic | Good error capture |
| `src/services/sync.service.ts` | Sync service | Good - proper error mapping |

---

## Approved: No

**Reason:** Missing critical error boundaries that would cause blank screen crashes in production. High priority items must be addressed before deployment.

---

*Report generated by dev-auditor-errors*
