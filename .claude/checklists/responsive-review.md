# Responsive Design Review Checklist

> Target: Mobile-first, cross-device compatibility

## Pre-Review

- [ ] Design specs available (`.claude/design/ui-design.md`)
- [ ] Breakpoints defined
- [ ] Testing tools ready (DevTools, real devices)

## Mobile-First CSS

### Base Styles (Mobile)
- [ ] Default styles work on 320px viewport
- [ ] No breakpoint needed for mobile layout
- [ ] Font sizes are readable (>= 16px base)
- [ ] Touch targets meet minimum (44x44px)

### Breakpoint Usage
- [ ] Using `min-width` media queries (not `max-width`)
- [ ] Tailwind: using `sm:`, `md:`, `lg:` prefixes correctly
- [ ] Breakpoints match design spec
- [ ] No duplicate or conflicting breakpoints

## Viewport & Meta Tags

- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">` present
- [ ] No `maximum-scale=1` (allows user zoom)
- [ ] No `user-scalable=no` (accessibility violation)
- [ ] `viewport-fit=cover` if using safe areas

## Touch Targets

### Sizes
- [ ] Buttons: >= 44x44px
- [ ] Links: >= 44px height with padding
- [ ] Form inputs: >= 44px height
- [ ] Icon buttons: >= 44x44px including padding
- [ ] Checkboxes/radios: >= 44x44px tap area

### Spacing
- [ ] >= 8px gap between adjacent touch targets
- [ ] No overlapping tap areas
- [ ] Adequate margin around interactive elements

## Navigation

### Mobile Navigation (< 768px)
- [ ] Mobile-specific nav implemented
- [ ] Menu toggle accessible (ARIA expanded)
- [ ] Menu items large enough to tap
- [ ] Close button or overlay click to close
- [ ] Focus trapped when menu open
- [ ] Menu closes on navigation

### Tablet/Desktop Navigation
- [ ] Smooth transition from mobile nav
- [ ] No awkward in-between states
- [ ] Active state visible
- [ ] Dropdown menus accessible

## Typography

### Readability
- [ ] Base font size >= 16px
- [ ] Line height >= 1.5 for body text
- [ ] Line length 45-75 characters on desktop
- [ ] No horizontal scrolling to read text

### Scaling
- [ ] Headings scale proportionally
- [ ] Mobile headings not too large
- [ ] Desktop headings appropriately sized
- [ ] Text doesn't break words badly

## Layout

### Flexible Containers
- [ ] No fixed pixel widths that break on mobile
- [ ] Max-width containers on large screens
- [ ] Padding/margin scales appropriately
- [ ] Grid columns stack on mobile

### Overflow
- [ ] No horizontal scroll on mobile
- [ ] Long content handled (truncation or wrap)
- [ ] Tables have scroll or card strategy
- [ ] Code blocks scrollable

### Safe Areas
- [ ] iPhone notch doesn't cover content
- [ ] Home indicator space respected
- [ ] Floating action buttons avoid safe areas

## Images & Media

### Responsive Images
- [ ] `max-width: 100%` on images
- [ ] `height: auto` to maintain aspect ratio
- [ ] `srcset` for different resolutions
- [ ] `sizes` attribute for responsive selection

### Performance
- [ ] Lazy loading for below-fold images
- [ ] Appropriate image formats (WebP, AVIF)
- [ ] Mobile-optimized image sizes served
- [ ] No layout shift from loading images

### Video/Embeds
- [ ] Videos responsive (aspect-ratio or wrapper)
- [ ] Iframes contained properly
- [ ] No fixed width embeds

## Forms

### Input Styling
- [ ] Inputs >= 44px height
- [ ] Labels above inputs on mobile
- [ ] Full-width inputs on mobile
- [ ] Multi-column on tablet/desktop

### Input Types
- [ ] `type="email"` for email fields
- [ ] `type="tel"` for phone numbers
- [ ] `type="number"` for numbers
- [ ] `inputmode` for keyboard hint

### Validation
- [ ] Error messages visible without scrolling
- [ ] Error state clearly visible on mobile
- [ ] Success state visible

### Submit
- [ ] Submit button accessible on mobile
- [ ] Loading state visible
- [ ] Button not hidden by keyboard

## Tables

### Strategy
- [ ] Tables have responsive approach
  - [ ] Horizontal scroll container
  - [ ] OR card layout on mobile
  - [ ] OR hide non-essential columns

### Implementation
- [ ] Headers remain visible if scrolling
- [ ] Cell content doesn't overflow
- [ ] Actions in cells are tappable

## Modals & Dialogs

- [ ] Full screen on mobile (or nearly)
- [ ] Close button in accessible location
- [ ] Content scrollable if tall
- [ ] Focus trapped properly
- [ ] Backdrop click closes (optional)

## Performance

### Mobile Optimization
- [ ] Critical CSS fast-loading
- [ ] JavaScript bundle not excessive
- [ ] Lazy load non-critical content
- [ ] Reduced motion respected

### Core Web Vitals
- [ ] LCP < 2.5s on mobile
- [ ] FID < 100ms
- [ ] CLS < 0.1 (no layout shift)

## Testing Verification

### Viewports Tested
- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone 12/13/14)
- [ ] 414px (iPhone Plus/Max)
- [ ] 768px (iPad portrait)
- [ ] 1024px (iPad landscape)
- [ ] 1280px (laptop)
- [ ] 1536px (desktop)

### Orientations
- [ ] Portrait (primary)
- [ ] Landscape (no breaking issues)

### Real Devices (recommended)
- [ ] iOS device tested
- [ ] Android device tested
- [ ] Tablet tested

## Sign-Off

- Reviewer: _______
- Date: _______
- Issues: [ ] None [ ] See below

| Severity | Issue | Breakpoint | Location | Fix |
|----------|-------|------------|----------|-----|
| | | | | |
