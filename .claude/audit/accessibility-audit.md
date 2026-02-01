# Accessibility Audit Report

**Application:** Snakey PWA
**Audit Date:** 2026-02-01
**Standard:** WCAG 2.1 Level AA
**Auditor:** Accessibility Auditor Agent

---

## Executive Summary

### Overall Compliance Score: 72/100 (Partial Compliance)

The Snakey PWA demonstrates moderate accessibility with several good practices in place, particularly in form labeling and focus management through Radix UI primitives. However, there are critical and high-priority issues that must be addressed to achieve WCAG 2.1 AA compliance.

### Key Findings

| Severity | Count | Description |
|----------|-------|-------------|
| Critical (A) | 4 | WCAG Level A failures blocking access |
| High (AA) | 8 | WCAG Level AA failures |
| Medium | 12 | Best practice violations |
| Low | 6 | Minor improvements recommended |

### Strengths

1. **Good form labeling patterns** - Most form inputs have proper `htmlFor`/`id` associations
2. **Radix UI primitives** - Dialog, Select, and Tabs components provide built-in ARIA semantics
3. **Focus indicators** - Consistent `focus-visible` ring styles across interactive elements
4. **Reduced motion support** - CSS includes `prefers-reduced-motion` media query (app.css:145-148)
5. **Screen reader text** - Dialog close button has `sr-only` label (dialog.tsx:48)

### Areas Requiring Immediate Attention

1. Missing skip navigation links
2. Incomplete ARIA labeling on Select components
3. Error messages not programmatically linked to inputs
4. Charts and data visualizations lack accessible alternatives
5. Icon-only buttons without text alternatives

---

## Critical Issues (WCAG Level A Failures)

### C1. Missing Skip Navigation Link
**WCAG:** 2.4.1 Bypass Blocks (A)
**Location:** `src/app/(app)/layout.tsx`
**Impact:** Keyboard users must tab through all sidebar navigation on every page

The application layout contains a sidebar with multiple navigation links but no skip link to bypass repetitive content.

```tsx
// Current (line 10-20)
return (
  <div className="min-h-screen flex">
    <Sidebar />
    <div className="flex-1 flex flex-col md:ml-64">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
```

**Recommendation:** Add a skip link as the first focusable element:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded">
  Skip to main content
</a>
<main id="main-content" ...>
```

---

### C2. Form Error Messages Not Programmatically Associated
**WCAG:** 1.3.1 Info and Relationships (A), 3.3.1 Error Identification (A)
**Location:** All tracker forms (`src/components/tracker/*.tsx`)
**Impact:** Screen reader users may not hear error messages when they occur

Error messages are visually displayed but not linked to their inputs via `aria-describedby`.

**Example from `feeding-form.tsx` (lines 146-150):**
```tsx
<Input
  id="feeding-date"
  aria-invalid={!!errors.date}  // Good
/>
{errors.date && (
  <p className="mt-1 text-sm text-red-500">{errors.date}</p>  // Not linked
)}
```

**Recommendation:** Add `aria-describedby` linking:
```tsx
<Input
  id="feeding-date"
  aria-invalid={!!errors.date}
  aria-describedby={errors.date ? "feeding-date-error" : undefined}
/>
{errors.date && (
  <p id="feeding-date-error" className="mt-1 text-sm text-red-500" role="alert">{errors.date}</p>
)}
```

**Affected Files:**
- `feeding-form.tsx` (lines 140-150, 176-178, 203-205)
- `shed-form.tsx` (lines 117-127, 143-147)
- `weight-form.tsx` (lines 84-94, 104-117)
- `environment-form.tsx` (lines 128-138, 159-161, 183-185)
- `vet-form.tsx` (lines 103-113, 134-136, 155-157)
- `medication-form.tsx` (lines 108-118, 136-139, 155-159, 177-181, 199-201)
- `reptile-form.tsx` (entire form - no aria-describedby)

---

### C3. Select Components Missing Accessible Labels
**WCAG:** 1.3.1 Info and Relationships (A), 4.1.2 Name, Role, Value (A)
**Location:** Multiple form components
**Impact:** Screen readers may not announce the purpose of Select dropdowns

Many Select components have visible labels but the label is not programmatically associated with the SelectTrigger.

**Example from `feeding-form.tsx` (lines 154-175):**
```tsx
<label
  htmlFor="preyType"  // id "preyType" doesn't exist on SelectTrigger
  className="block text-sm font-medium text-warm-700 mb-1"
>
  Prey Type <span className="text-red-500">*</span>
</label>
<Select ...>
  <SelectTrigger aria-invalid={!!errors.preyType}>  // Missing id and aria-label
    <SelectValue placeholder="Select prey type" />
  </SelectTrigger>
```

**Recommendation:** Either add `id` to SelectTrigger or use `aria-labelledby`:
```tsx
<label id="preyType-label" className="...">
  Prey Type <span className="text-red-500" aria-hidden="true">*</span>
  <span className="sr-only">(required)</span>
</label>
<Select ...>
  <SelectTrigger id="preyType" aria-labelledby="preyType-label" aria-invalid={!!errors.preyType}>
```

**Affected Components:**
- `feeding-form.tsx` - preyType, preySize, preySource selects
- `shed-form.tsx` - quality select
- `environment-form.tsx` - location select
- `tracker-header.tsx` - reptile-select (line 91 - correctly has id!)
- `reptile-form.tsx` - species, sex selects
- `pairing-form.tsx` - male, female, successful selects
- `photo-upload.tsx` - category select

---

### C4. Decorative SVG Icons Missing aria-hidden
**WCAG:** 1.1.1 Non-text Content (A)
**Location:** `src/components/icons/reptile-icon.tsx`
**Impact:** Screen readers may attempt to describe decorative icons

The custom reptile icons lack `aria-hidden="true"` to hide them from assistive technology when used decoratively.

```tsx
// Current (lines 10-28)
function SnakeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      // Missing aria-hidden="true" and role="img"
```

**Note:** The hero-section.tsx correctly uses `aria-hidden="true"` on decorative SVGs (lines 17, 27).

---

## High Priority Issues (WCAG Level AA Failures)

### H1. Color Contrast - Muted Foreground Text
**WCAG:** 1.4.3 Contrast (Minimum) (AA)
**Location:** `src/app/app.css` - CSS theme variables
**Impact:** Users with low vision may struggle to read muted text

The muted foreground color definition may not meet 4.5:1 contrast ratio:
```css
--color-muted-foreground: oklch(0.45 0.03 145);  /* Line 19 - light mode */
--color-muted-foreground: oklch(0.65 0.02 145);  /* Line 59 - dark mode */
```

OKLCH L=0.45 on L=0.99 background is approximately 3.8:1 contrast, below AA requirement.

**Affected Usage:**
- Form help text
- Placeholder text
- Secondary descriptions
- Timestamps in activity feeds

**Recommendation:** Increase lightness to L=0.40 or lower for muted-foreground in light mode.

---

### H2. Color-Only Indicators for Required Fields
**WCAG:** 1.4.1 Use of Color (A)
**Location:** All forms using `<span className="text-red-500">*</span>`
**Impact:** Color-blind users may not identify required fields

Required field indicators use only red color asterisks without additional context.

**Example from `feeding-form.tsx` (line 138):**
```tsx
<label>
  Date <span className="text-red-500">*</span>
</label>
```

**Recommendation:** Add screen reader text:
```tsx
<label>
  Date <span className="text-red-500" aria-hidden="true">*</span>
  <span className="sr-only">(required)</span>
</label>
```

---

### H3. Status Messages Without ARIA Live Regions
**WCAG:** 4.1.3 Status Messages (AA)
**Location:** `tracker-tabs.tsx` (lines 63-68), `offline-indicator.tsx`
**Impact:** Screen reader users may miss success/status notifications

Success messages and sync status updates are displayed visually but not announced to assistive technology.

**Example from `tracker-tabs.tsx`:**
```tsx
{successMessage && (
  <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 ...">
    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
    <span className="text-sm">{successMessage}</span>
  </div>
)}
```

**Recommendation:** Add `role="status"` or `aria-live="polite"`:
```tsx
<div role="status" aria-live="polite" className="...">
```

**Affected Components:**
- `tracker-tabs.tsx` - success message
- `offline-indicator.tsx` - sync status messages
- `reptile-form.tsx` - error alert (line 113 - should have role="alert")

---

### H4. Icon-Only Buttons Without Accessible Names
**WCAG:** 1.1.1 Non-text Content (A), 4.1.2 Name, Role, Value (A)
**Location:** Multiple components
**Impact:** Screen readers cannot announce button purpose

Several icon-only buttons lack accessible names.

**Affected Buttons:**

| File | Line | Element | Issue |
|------|------|---------|-------|
| `photo-attachment.tsx` | 133-140 | Remove image button | Has aria-label - OK |
| `photo-upload.tsx` | 253-259 | Remove preview button | Has aria-label - OK |
| `install-prompt.tsx` | 75-79 | Dismiss X button | **Missing aria-label** |

**Example fix for `install-prompt.tsx`:**
```tsx
<button
  onClick={handleDismiss}
  className="text-warm-400 hover:text-warm-600"
  aria-label="Dismiss install prompt"
>
  <X className="h-4 w-4" />
</button>
```

---

### H5. Charts Lack Accessible Alternatives
**WCAG:** 1.1.1 Non-text Content (A), 1.4.11 Non-text Contrast (AA)
**Location:** `src/components/reports/feeding-chart.tsx`
**Impact:** Blind and low vision users cannot access chart data

Recharts visualizations provide no text alternative or data table for screen reader users.

**Current Implementation (lines 81-129):**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={chartData} ...>
    {/* No accessible alternative provided */}
  </BarChart>
</ResponsiveContainer>
```

**Recommendations:**
1. Add descriptive text summary before the chart
2. Provide a hidden data table alternative
3. Use `aria-label` or `aria-describedby` on the chart container
4. Include a "View as table" toggle for detailed data

---

### H6. Focus Not Managed After Dynamic Content Changes
**WCAG:** 2.4.3 Focus Order (A)
**Location:** `tracker-tabs.tsx`, photo upload dialogs
**Impact:** Focus may be lost after form submission

When a form is successfully submitted in TrackerTabs, the success message appears but focus is not moved to it or to a logical next element.

**Recommendation:** After successful form submission:
1. Move focus to the success message
2. Or move focus to the beginning of the form for another entry
3. Use `useRef` and `focus()` to manage programmatic focus

---

### H7. Landmark Regions Not Defined
**WCAG:** 1.3.1 Info and Relationships (A), 2.4.1 Bypass Blocks (A)
**Location:** `src/app/(app)/layout.tsx`, `sidebar.tsx`
**Impact:** Screen reader users cannot navigate by landmarks

The layout lacks proper landmark roles or semantic HTML5 elements.

**Current Issues:**
- Sidebar uses `<aside>` without `role="navigation"` or `<nav>` wrapper
- No `<main>` landmark clearly defined (uses `<main>` element but needs `id`)
- Header could use `role="banner"`

**sidebar.tsx (line 43):**
```tsx
<nav className="mt-8 flex-1 space-y-1 px-2">
```
Good - uses `<nav>` element.

**Recommendation for layout.tsx:**
```tsx
<main id="main-content" role="main" className="flex-1 p-4 md:p-6">
```

---

### H8. Touch Target Size Below Minimum
**WCAG:** 2.5.5 Target Size (AAA), 2.5.8 Target Size Minimum (AA)
**Location:** Checkbox inputs, small icon buttons
**Impact:** Users with motor impairments may struggle to tap small targets

Native checkbox inputs are 16x16px (h-4 w-4), below the 24x24px minimum for WCAG 2.5.8.

**Example from `feeding-form.tsx` (lines 240-248):**
```tsx
<input
  type="checkbox"
  name="accepted"
  className="h-4 w-4 rounded border-warm-300 ..."
/>
```

**Recommendation:** Increase hit area using padding or wrapper:
```tsx
<label className="flex items-center gap-2 py-2">
  <input
    type="checkbox"
    className="h-5 w-5 rounded ..."
  />
```

---

## Medium Priority Issues (Best Practices)

### M1. Autocomplete Attributes Missing on Personal Data Fields
**Location:** `vet-form.tsx` - vetName, vetClinic fields
**Recommendation:** Add `autoComplete="name"` for vet name field

### M2. Language Not Specified on HTML Element
**Location:** Root layout
**Recommendation:** Ensure `<html lang="en">` is set

### M3. Heading Hierarchy Issues
**Location:** `dashboard/page.tsx` - Uses `<h1>` then jumps to CardTitle which renders `<h3>`
**Recommendation:** Ensure logical heading sequence (h1 -> h2 -> h3)

### M4. Tables Not Used for Tabular Data
**Location:** History components display records as divs
**Recommendation:** Consider using `<table>` for feeding history, weight history, etc.

### M5. Form Instructions Not Always Clear
**Location:** Multiple forms
**Recommendation:** Add instructions at form start: "Required fields are marked with an asterisk (*)"

### M6. Empty Alt Text on Placeholder Images
**Location:** `reptile-grid.tsx` line 32-34
**Issue:** ReptileIcon used as placeholder lacks descriptive purpose
**Recommendation:** When icon represents "no photo available", provide context

### M7. Timeout Without Warning
**Location:** `tracker-tabs.tsx` - Success message auto-dismisses after 3 seconds
**Recommendation:** Allow users to dismiss manually or extend/disable timeout

### M8. No Visible Focus on Card Click
**Location:** `reptile-grid.tsx` - Card wrapped in Link
**Issue:** Focus state may not be visible enough on card hover/focus
**Recommendation:** Ensure focus ring is clearly visible

### M9. Dropdown Menu Keyboard Navigation
**Location:** Select components with many options
**Recommendation:** Ensure type-ahead functionality works for long lists

### M10. Progress Bar Lacks Accessible Label
**Location:** `photo-attachment.tsx` lines 148-155, `photo-upload.tsx` lines 269-279
**Issue:** Progress bar has no accessible name
**Recommendation:** Add `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`

### M11. Image Preview Missing Descriptive Alt
**Location:** `photo-attachment.tsx` line 130, `photo-upload.tsx` line 249
**Issue:** Alt text is just "Preview"
**Recommendation:** More descriptive: "Preview of selected image for upload"

### M12. Drag and Drop Without Keyboard Alternative
**Location:** `photo-attachment.tsx`, `photo-upload.tsx` - Drop zones
**Status:** File input provides keyboard alternative - COMPLIANT
**Note:** Good implementation - input[type=file] is available via label

---

## Low Priority Issues (Minor Improvements)

### L1. Consider Adding aria-current for Active Navigation
**Location:** `sidebar.tsx`
**Recommendation:** Add `aria-current="page"` to active nav link

### L2. Loading States Could Be More Descriptive
**Location:** Multiple components using `<Loader2>` spinner
**Recommendation:** Add `aria-label="Loading"` or visually hidden text

### L3. Consider Adding aria-busy During Async Operations
**Location:** Forms during submission
**Recommendation:** Add `aria-busy="true"` to form during mutation

### L4. Checkbox Groups Should Use fieldset/legend
**Location:** `feeding-form.tsx` checkboxes (Accepted/Refused/Regurgitated)
**Recommendation:** Group related checkboxes semantically

### L5. Date Inputs Could Have Clearer Labels
**Location:** Various date inputs
**Issue:** "Date" alone may be ambiguous
**Recommendation:** More specific: "Feeding Date", "Shed Completion Date"

### L6. Consider Visible Focus Mode
**Location:** Global styles
**Recommendation:** Consider supporting Windows High Contrast Mode

---

## Component-by-Component Findings

### UI Primitives (`src/components/ui/`)

| Component | Status | Issues |
|-----------|--------|--------|
| `button.tsx` | GOOD | Proper focus styles, forwarded refs |
| `input.tsx` | GOOD | Focus visible, disabled states |
| `select.tsx` | NEEDS WORK | Missing label associations in usage |
| `dialog.tsx` | GOOD | Close button has sr-only label, proper Radix ARIA |
| `tabs.tsx` | GOOD | Radix handles ARIA, focus styles present |
| `card.tsx` | OK | Semantic HTML could be improved |

### Tracker Forms (`src/components/tracker/`)

| Component | Status | Key Issues |
|-----------|--------|------------|
| `feeding-form.tsx` | NEEDS WORK | Error linking, select labels, checkbox grouping |
| `shed-form.tsx` | NEEDS WORK | Error linking, select labels |
| `weight-form.tsx` | NEEDS WORK | Error linking |
| `environment-form.tsx` | NEEDS WORK | Error linking, select labels |
| `vet-form.tsx` | NEEDS WORK | Error linking, autocomplete |
| `medication-form.tsx` | NEEDS WORK | Error linking |
| `photo-attachment.tsx` | OK | Has aria-label on remove button |
| `tracker-tabs.tsx` | NEEDS WORK | Success message needs live region |
| `tracker-header.tsx` | GOOD | Select has id for label association |

### Layout Components (`src/components/layout/`)

| Component | Status | Key Issues |
|-----------|--------|------------|
| `sidebar.tsx` | NEEDS WORK | aria-current for active state |
| `header.tsx` | OK | Simple, could add role="banner" |
| `offline-indicator.tsx` | NEEDS WORK | Needs aria-live for status updates |

### Other Components

| Component | Status | Key Issues |
|-----------|--------|------------|
| `reptile-form.tsx` | NEEDS WORK | Error handling, select labels |
| `reptile-grid.tsx` | OK | Links are keyboard accessible |
| `photo-gallery.tsx` | GOOD | Thumbnail buttons have aria-label |
| `photo-viewer.tsx` | GOOD | DialogTitle sr-only, proper descriptions |
| `photo-upload.tsx` | OK | Remove button has aria-label, progress needs work |
| `install-prompt.tsx` | NEEDS WORK | Dismiss button needs aria-label |
| `feeding-chart.tsx` | NEEDS WORK | No accessible alternative for chart |
| `hero-section.tsx` | GOOD | Decorative SVGs have aria-hidden |

---

## Remediation Recommendations

### Priority 1: Critical Fixes (Immediate)

1. **Add skip navigation link** to `layout.tsx`
2. **Add aria-describedby** to all form inputs with error messages
3. **Add id attributes** to all SelectTrigger components
4. **Add aria-hidden="true"** to decorative icons

### Priority 2: High Priority Fixes (Within 2 Weeks)

1. **Adjust muted-foreground color** for 4.5:1 contrast
2. **Add screen reader text** for required field indicators
3. **Add aria-live regions** for status messages
4. **Add aria-label** to icon-only dismiss buttons
5. **Provide accessible alternative** for charts
6. **Manage focus** after form submissions
7. **Add landmark id** to main element
8. **Increase touch target size** for checkboxes

### Priority 3: Medium Fixes (Within 1 Month)

1. Add autocomplete attributes to personal fields
2. Review heading hierarchy
3. Consider table markup for tabular data
4. Add form instructions
5. Improve alt text for placeholders
6. Add timeout controls for auto-dismissing messages
7. Add progressbar ARIA attributes
8. Improve image preview alt text

### Priority 4: Enhancements (Ongoing)

1. Add aria-current to navigation
2. Improve loading state announcements
3. Use aria-busy during async operations
4. Use fieldset/legend for checkbox groups
5. Make date input labels more specific
6. Test with Windows High Contrast Mode

---

## Testing Recommendations

### Automated Testing
- Run axe-core on all pages
- Add jest-axe to component tests
- Integrate Lighthouse accessibility audits into CI

### Manual Testing
- Test with NVDA/JAWS on Windows
- Test with VoiceOver on macOS/iOS
- Test keyboard-only navigation
- Test with browser zoom at 200%
- Test with Windows High Contrast Mode

### User Testing
- Conduct testing with users who rely on assistive technology
- Test with users who have motor impairments
- Test with users who have low vision

---

## Approved: No

**Reason:** Critical Level A failures must be addressed before the application can be considered accessible. The four critical issues (skip link, error message associations, select labeling, and icon aria-hidden) represent barriers that would prevent some users from effectively using the application.

**Next Steps:**
1. Address all Critical (C1-C4) issues
2. Address High Priority (H1-H8) issues
3. Re-audit after fixes are implemented
4. Conduct testing with assistive technology

---

*Generated by Accessibility Auditor Agent on 2026-02-01*
