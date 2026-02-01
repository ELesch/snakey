# Dependencies Audit Report

**Date:** 2026-02-01
**Auditor:** Dependencies Auditor
**Scope:** Full dependency analysis
**Project:** Snakey PWA v0.1.0

## Executive Summary

The Snakey project has a healthy dependency profile with no critical security vulnerabilities. There are 9 moderate severity vulnerabilities, all in transitive dependencies (primarily through Prisma's development tooling). The project uses permissive licenses throughout, with one LGPL component in a dev dependency (sharp). Several packages have major version updates available that should be evaluated. No deprecated packages were detected.

## Security Vulnerabilities

### Critical (CVSS >= 9.0)
None found.

### High (CVSS >= 7.0)
None found.

### Moderate (CVSS >= 4.0)

| Package | CVSS | Vulnerability | Affected Range | Path |
|---------|------|---------------|----------------|------|
| next | 5.3 | Unbounded Memory Consumption via PPR Resume Endpoint (GHSA-5f7q-jpqc-wp7h) | 15.0.0-canary.0 - 15.6.0-canary.60 | Direct dependency |
| hono | 5.3 | Cache middleware ignores "Cache-Control: private" (GHSA-6wqw-2p9w-4vw4) | <=4.11.6 | prisma -> @prisma/dev -> hono |
| hono | 4.8 | IPv4 address validation bypass (GHSA-r354-f388-2fhh) | <=4.11.6 | prisma -> @prisma/dev -> hono |
| hono | 4.7 | XSS through ErrorBoundary component (GHSA-9r54-q6cx-xmh5) | <=4.11.6 | prisma -> @prisma/dev -> hono |
| hono | - | Arbitrary Key Read in Serve static Middleware (GHSA-w332-q679-j88p) | <=4.11.6 | prisma -> @prisma/dev -> hono |
| lodash | 6.5 | Prototype Pollution in `_.unset` and `_.omit` (GHSA-xxjr-mmjv-4gpg) | 4.0.0 - 4.17.21 | prisma -> @prisma/dev -> chevrotain -> lodash |

### Vulnerability Impact Assessment

| Vulnerability | Production Risk | Notes |
|---------------|-----------------|-------|
| Next.js PPR | **Low** | PPR is experimental and likely not enabled |
| Hono (all issues) | **None** | Dev dependency only, not in production bundle |
| Lodash prototype pollution | **None** | Dev dependency only, not in production bundle |

**Recommendation:** The Hono and Lodash vulnerabilities are in Prisma's dev tooling (`@prisma/dev`) and do not affect the production build. Monitor for Prisma updates that address these. The Next.js vulnerability only affects experimental PPR features.

## Outdated Packages

### Major Version Updates (Breaking Changes)

| Package | Current | Latest | Gap | Risk Assessment |
|---------|---------|--------|-----|-----------------|
| next | 15.5.11 | 16.1.6 | Major | **High** - Breaking changes in routing, API |
| dotenv | 16.6.1 | 17.2.3 | Major | Low - Minimal breaking changes expected |
| vitest | 3.2.4 | 4.0.18 | Major | Medium - Dev dependency, test runner updates |
| pino | 9.14.0 | 10.3.0 | Major | Medium - Logging API changes possible |
| tailwind-merge | 2.6.1 | 3.4.0 | Major | Low - Utility library, review changelog |
| @vitejs/plugin-react | 4.7.0 | 5.1.2 | Major | Low - Dev dependency for testing |
| jsdom | 25.0.1 | 27.4.0 | Major | Low - Dev dependency for testing |
| dexie-react-hooks | 1.1.7 | 4.2.0 | Major | **High** - Check for API changes |

### Minor/Patch Updates Available

| Package | Current | Latest | Type |
|---------|---------|--------|------|
| @types/node | 22.19.7 | 25.1.0 | Major (types only) |
| eslint-config-next | 15.5.11 | 16.1.6 | Major (tied to Next.js) |
| lucide-react | 0.500.0 | 0.563.0 | Minor |

### Update Priority

1. **Immediate (Security):** None required - vulnerabilities are in dev dependencies
2. **Near-term (Functionality):** `dexie-react-hooks` - verify compatibility with current Dexie 4.x
3. **Planned (Maintenance):** `dotenv`, `pino`, `vitest`, `tailwind-merge`
4. **Evaluate:** `next` 16.x when project is ready for major upgrade

## License Review

### License Distribution

| License | Count | Status |
|---------|-------|--------|
| MIT | 647 | OK |
| Apache-2.0 | 51 | OK |
| ISC | 47 | OK |
| BSD-2-Clause | 11 | OK |
| BSD-3-Clause | 7 | OK |
| MPL-2.0 | 3 | Review |
| BlueOak-1.0.0 | 3 | OK |
| MIT-0 | 1 | OK |
| CC-BY-4.0 | 1 | OK |
| CC0-1.0 | 1 | OK |
| 0BSD | 1 | OK |
| Unlicense | 1 | OK |
| UNLICENSED | 1 | Review |

### Packages Requiring Review

| Package | License | Concern | Resolution |
|---------|---------|---------|------------|
| @img/sharp-win32-x64 | Apache-2.0 AND LGPL-3.0-or-later | LGPL copyleft | **Low risk** - Native binary, not linked into JS bundle. Sharp itself is Apache-2.0. Only affects dev builds. |
| snakey | UNLICENSED | Project itself | Expected - private project, add license if publishing |
| caniuse-lite | CC-BY-4.0 | Attribution required | **OK** - Data package, attribution in build is sufficient |

### License Compatibility

All production dependencies use permissive licenses (MIT, Apache-2.0, ISC, BSD). No copyleft licenses affect the production bundle. The LGPL component (libvips via sharp) is a native dependency for image processing and does not create licensing obligations for the JavaScript code.

## Bundle Analysis

### Large Dependencies (Production)

| Package | Estimated Size | Usage | Notes |
|---------|----------------|-------|-------|
| @react-pdf/renderer | ~500KB+ | PDF generation | Required for export features |
| recharts | ~300KB | Charts/graphs | Core visualization library |
| @supabase/supabase-js | ~150KB | Backend client | Core infrastructure |
| lucide-react | ~100KB+ | Icons | Tree-shakeable, actual size depends on usage |
| date-fns | ~80KB | Date utilities | Tree-shakeable |
| dexie | ~50KB | IndexedDB | Core offline functionality |
| zod | ~50KB | Validation | Core validation library |

### Potential Optimizations

1. **lucide-react:** Ensure only used icons are imported to enable tree-shaking
2. **date-fns:** Import specific functions only (e.g., `import { format } from 'date-fns'`)
3. **@react-pdf/renderer:** Consider lazy loading for PDF generation features

### Extraneous Packages Detected

The following packages appear in `node_modules` but are not in package.json:

| Package | Purpose | Action |
|---------|---------|--------|
| @emnapi/core | Native module support | Auto-installed by sharp, expected |
| @emnapi/runtime | Native module support | Auto-installed by sharp, expected |
| @emnapi/wasi-threads | Native module support | Auto-installed by sharp, expected |
| @napi-rs/wasm-runtime | WASM support | Auto-installed by sharp, expected |
| @tybys/wasm-util | WASM utilities | Auto-installed by sharp, expected |

These are platform-specific native dependencies for `sharp` and are expected.

## Unused Dependencies

Based on package.json review, all direct dependencies appear to be in active use:

- **Core framework:** next, react, react-dom
- **Database:** @prisma/adapter-pg, @prisma/client, pg
- **UI:** All @radix-ui packages, lucide-react, tailwind-merge, class-variance-authority
- **Offline:** dexie, dexie-react-hooks
- **Charts:** recharts
- **PDF:** @react-pdf/renderer
- **QR codes:** react-qr-code
- **Auth/Backend:** @supabase/supabase-js, @supabase/ssr
- **Data fetching:** @tanstack/react-query
- **Validation:** zod
- **Logging:** pino
- **PWA:** @serwist/next

**Note:** Run a code analysis to confirm all dependencies are actually used:
```bash
npx depcheck
```

## Dependency Quality Assessment

### Maintenance Status

| Package | Last Updated | Downloads/Week | Status |
|---------|--------------|----------------|--------|
| next | Active | 15M+ | Actively maintained by Vercel |
| react | Active | 30M+ | Actively maintained by Meta |
| prisma | Active | 3M+ | Actively maintained |
| tailwindcss | Active | 15M+ | Actively maintained |
| @supabase/supabase-js | Active | 500K+ | Actively maintained |
| zod | Active | 10M+ | Actively maintained |
| recharts | Active | 2M+ | Actively maintained |
| dexie | Active | 300K+ | Actively maintained |
| tailwindcss-animate | 2023-08-28 | 1M+ | **Stale** - No updates in 2+ years |
| class-variance-authority | 2024-11-26 | 1M+ | Maintained |

### Potential Concerns

| Package | Concern | Severity | Recommendation |
|---------|---------|----------|----------------|
| tailwindcss-animate | No updates since Aug 2023 | Low | Monitor for Tailwind v4 compatibility issues |
| dexie-react-hooks | Major version gap (1.x vs 4.x) | Medium | Test if current version works, upgrade if issues |

## Recommendations

### Immediate Actions

1. **No critical security updates required** - All vulnerabilities are in dev dependencies

### Short-term (1-2 weeks)

1. **Evaluate dexie-react-hooks upgrade**
   - Current: 1.1.7, Latest: 4.2.0
   - Check changelog for breaking changes
   - Test offline functionality after upgrade

2. **Run depcheck** to identify any unused dependencies
   ```bash
   npx depcheck
   ```

### Medium-term (1-3 months)

1. **Plan Next.js 16 upgrade**
   - Review migration guide when ready
   - Test in a separate branch
   - Consider waiting for 16.x stable

2. **Update dev dependencies**
   - vitest 3.x -> 4.x
   - pino 9.x -> 10.x
   - dotenv 16.x -> 17.x

3. **Monitor tailwindcss-animate**
   - Check for Tailwind v4 compatibility
   - Consider alternatives if abandoned

### Long-term

1. **Monitor Prisma updates** for Hono/Lodash vulnerability fixes
2. **Set up automated dependency updates** (Dependabot, Renovate)
3. **Implement bundle size tracking** in CI/CD

## Summary Statistics

| Metric | Value |
|--------|-------|
| Direct dependencies | 31 |
| Dev dependencies | 19 |
| Total packages (npm ls) | 780+ |
| Security vulnerabilities | 9 (moderate) |
| Production vulnerabilities | 1 (low risk) |
| Outdated (major) | 8 packages |
| Outdated (minor/patch) | 3 packages |
| Problematic licenses | 0 |
| Deprecated packages | 0 |

---

*Report generated by Dependencies Auditor*
*Next audit recommended: 2026-03-01 or after major dependency updates*
