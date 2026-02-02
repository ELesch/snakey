# Tailwind CSS v4 Knowledge

> Shared knowledge for Tailwind CSS v4 patterns. Referenced by multiple role agents.

## AI Training Context

| Aspect | Status |
|--------|--------|
| **AI Trained On** | 3.x |
| **Gap Level** | Major |
| **Confidence** | Low |
| **Context7** | Available |

**IMPORTANT:** AI confidence is LOW for Tailwind v4. Always verify patterns with Context7 when unsure.

**Training Gap Analysis:**
- AI has strong Tailwind 3.x patterns
- Tailwind 4.x is a complete rewrite: CSS-first configuration
- No more `tailwind.config.js` by default
- New CSS-based theme configuration
- Oxide engine for performance

---

## Critical Patterns (MUST FOLLOW)

### CSS-First Configuration

Tailwind 4 configures everything in CSS, not JavaScript:

```css
/* src/app/globals.css */

/* Import Tailwind */
@import "tailwindcss";

/* Configure theme with CSS */
@theme {
  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Custom colors accessible as utilities */
  --color-brand: #0ea5e9;
  --color-brand-light: #7dd3fc;
  --color-brand-dark: #0284c7;

  /* Spacing (extends default) */
  --spacing-18: 4.5rem;
  --spacing-128: 32rem;

  /* Font families */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-mono: "Fira Code", monospace;

  /* Border radius */
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;

  /* Shadows */
  --shadow-soft: 0 2px 15px rgba(0, 0, 0, 0.08);
}

/* Dark mode theme overrides */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-primary: #60a5fa;
    --color-secondary: #a78bfa;
  }
}
```

### Using Custom Properties

```html
<!-- Custom colors work as utilities -->
<div class="bg-brand text-brand-light hover:bg-brand-dark">
  Branded element
</div>

<!-- Custom spacing -->
<div class="p-18 max-w-128">
  Custom sized element
</div>

<!-- Custom radius and shadows -->
<div class="rounded-xl shadow-soft">
  Soft card
</div>
```

### @apply Still Works

```css
/* Component styles */
.btn-primary {
  @apply bg-primary text-white px-4 py-2 rounded-lg;
  @apply hover:bg-primary/90 transition-colors;
}
```

### Variants and Modifiers

Same as v3 but with CSS-native approach:

```html
<!-- Responsive -->
<div class="text-sm md:text-base lg:text-lg">Responsive text</div>

<!-- States -->
<button class="bg-blue-500 hover:bg-blue-600 active:bg-blue-700">
  Interactive
</button>

<!-- Dark mode -->
<div class="bg-white dark:bg-gray-900">Dark mode aware</div>

<!-- Group hover -->
<div class="group">
  <span class="group-hover:text-blue-500">Grouped</span>
</div>
```

### New Features in v4

```html
<!-- Container queries (native) -->
<div class="@container">
  <div class="@sm:flex @lg:grid">Container-aware</div>
</div>

<!-- Native cascade layers -->
<!-- Tailwind v4 uses @layer internally -->

<!-- Improved dark mode -->
<div class="dark:text-white dark:bg-gray-900">
  Uses CSS prefers-color-scheme
</div>

<!-- has-* variants -->
<div class="has-[:checked]:bg-blue-100">
  Styles based on descendant state
</div>
```

### PostCSS Configuration

```javascript
// postcss.config.js (if using PostCSS)
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

### Vite Integration

```javascript
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

---

## Do/Don't Table

| Do | Don't |
|----|-------|
| Configure theme in CSS with `@theme` | Create `tailwind.config.js` |
| Use `@import "tailwindcss"` | Use `@tailwind base/components/utilities` |
| Define custom colors as `--color-*` | Add colors in JavaScript config |
| Define spacing as `--spacing-*` | Extend theme in JS |
| Use `@tailwindcss/postcss` plugin | Use `tailwindcss` PostCSS plugin directly |
| Use `@tailwindcss/vite` for Vite | Add tailwindcss to PostCSS for Vite |
| Define dark mode colors in `@media (prefers-color-scheme: dark)` | Use `darkMode: 'class'` config |
| Use CSS custom properties for tokens | Use JavaScript for token definitions |

---

## Common Errors and Fixes

### Error: Unknown at-rule @theme

**Problem:** PostCSS not configured for Tailwind v4
**Fix:**
1. Install `@tailwindcss/postcss`
2. Update postcss.config.js to use it

### Error: tailwind.config.js not found

**Problem:** Looking for old config format
**Note:** This is expected in v4 - config is in CSS now

### Error: Class 'bg-primary' not generated

**Problem:** Custom color not defined correctly
**Fix:** Define as `--color-primary` in `@theme` block

### Error: Unknown plugin tailwindcss

**Problem:** Using wrong PostCSS plugin
**Fix:** Change to `@tailwindcss/postcss`

### Error: @tailwind directive not working

**Problem:** Old import syntax
**Fix:** Use `@import "tailwindcss"` instead

---

## Context7 Usage

**IMPORTANT:** Due to Low AI confidence, use Context7 frequently:

```
use context7 for tailwind v4 config
use context7 for tailwind css configuration
use context7 for tailwindcss theme
```

Context7 is especially useful for:
- Theme configuration syntax
- New directives and features
- Migration from v3
- Build tool integration

---

## Migration from Tailwind 3

### Breaking Changes

1. **No JavaScript config**: Use CSS `@theme` instead
2. **New import**: `@import "tailwindcss"` not `@tailwind`
3. **PostCSS plugin**: `@tailwindcss/postcss` not `tailwindcss`
4. **Dark mode**: CSS-native by default
5. **Vite plugin**: Separate `@tailwindcss/vite` package

### Migration Steps

1. Remove `tailwind.config.js`
2. Update CSS imports to `@import "tailwindcss"`
3. Add `@theme` block with custom values
4. Convert JS theme extensions to CSS variables:
   - `theme.extend.colors.brand` -> `--color-brand`
   - `theme.extend.spacing.18` -> `--spacing-18`
5. Update PostCSS config
6. Test build output

### Config Opt-In

If you need JavaScript config (legacy):

```css
@config "./tailwind.config.js";
@import "tailwindcss";
```

---

## Installation

```bash
# For new projects
npm install tailwindcss@next

# PostCSS integration
npm install @tailwindcss/postcss

# Vite integration (instead of PostCSS)
npm install @tailwindcss/vite
```

---

## Next.js Integration

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Your theme */
}
```

```javascript
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

---

## Complete Theme Example

```css
@import "tailwindcss";

@theme {
  /* Brand colors */
  --color-primary: oklch(0.6 0.2 250);
  --color-primary-light: oklch(0.8 0.15 250);
  --color-primary-dark: oklch(0.4 0.2 250);

  /* Semantic colors */
  --color-success: oklch(0.7 0.2 145);
  --color-warning: oklch(0.8 0.2 85);
  --color-error: oklch(0.6 0.25 25);
  --color-info: oklch(0.7 0.2 220);

  /* Neutral palette */
  --color-gray-50: oklch(0.98 0 0);
  --color-gray-100: oklch(0.96 0 0);
  --color-gray-900: oklch(0.15 0 0);

  /* Typography */
  --font-sans: "Inter var", system-ui, sans-serif;
  --font-display: "Cal Sans", var(--font-sans);

  /* Spacing */
  --spacing-gutter: 1.5rem;
  --spacing-section: 4rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-gray-50: oklch(0.15 0 0);
    --color-gray-100: oklch(0.2 0 0);
    --color-gray-900: oklch(0.98 0 0);
  }
}
```

---

## Verification Tasks

Before completing your work, verify:

- [ ] No `tailwind.config.js` exists (unless intentionally opted-in)
- [ ] Main CSS file uses `@import "tailwindcss"`
- [ ] Theme configured with `@theme` directive in CSS
- [ ] Custom colors use `--color-*` naming convention
- [ ] Custom spacing uses `--spacing-*` naming convention
- [ ] PostCSS uses `@tailwindcss/postcss` not `tailwindcss`
- [ ] Vite (if used) has `@tailwindcss/vite` plugin
- [ ] Build produces expected utility classes
