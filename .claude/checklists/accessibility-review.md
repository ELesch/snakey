# Accessibility Review Checklist

> Target: WCAG 2.1 AA compliance

## Pre-Review
- [ ] Know target user base
- [ ] Have testing tools ready (axe, WAVE, keyboard)

## WCAG 2.1 Level A (Minimum)

### 1.1 Text Alternatives
- [ ] All `<img>` have meaningful alt text
- [ ] Decorative images use `alt=""`
- [ ] Complex images have long descriptions

### 1.2 Time-based Media
- [ ] Videos have captions
- [ ] Audio has transcripts

### 1.3 Adaptable
- [ ] Content has logical heading hierarchy (h1 → h2 → h3)
- [ ] Lists use proper `<ul>`, `<ol>`, `<dl>`
- [ ] Tables have headers (`<th>`, scope)
- [ ] Form fields have associated labels

### 1.4 Distinguishable
- [ ] Color is not the only indicator
- [ ] Audio can be paused/stopped

### 2.1 Keyboard Accessible
- [ ] All functionality available via keyboard
- [ ] No keyboard traps
- [ ] Focus order is logical

### 2.2 Enough Time
- [ ] Timeouts can be extended/disabled
- [ ] Auto-updating content can be paused

### 2.4 Navigable
- [ ] Pages have descriptive titles
- [ ] Focus is visible
- [ ] Link purpose is clear

### 3.1 Readable
- [ ] Page language is set (`<html lang="en">`)

### 3.2 Predictable
- [ ] Focus doesn't cause unexpected changes
- [ ] Input doesn't cause unexpected changes

### 3.3 Input Assistance
- [ ] Errors identified and described
- [ ] Labels or instructions provided

### 4.1 Compatible
- [ ] HTML is valid (no duplicate IDs)
- [ ] Custom controls have name, role, value

## WCAG 2.1 Level AA (Target)

### 1.3 Adaptable
- [ ] Orientation not restricted
- [ ] Input purpose identified (autocomplete)

### 1.4 Distinguishable
- [ ] Text contrast >= 4.5:1 (normal), 3:1 (large)
- [ ] Text can resize to 200%
- [ ] Content reflows at 400% zoom
- [ ] Non-text contrast >= 3:1 (UI, graphics)
- [ ] Text spacing adjustable

### 2.4 Navigable
- [ ] Multiple ways to find pages
- [ ] Headings and labels descriptive
- [ ] Focus visible (custom styles OK)

### 2.5 Input Modalities
- [ ] Touch targets >= 44x44px
- [ ] Motion not required (can disable)

### 3.1 Readable
- [ ] Language of parts identified

### 3.3 Input Assistance
- [ ] Error suggestions provided
- [ ] Error prevention for important data

### 4.1 Compatible
- [ ] Status messages announced to screen readers

## Interactive Elements

- [ ] Buttons use `<button>` or `role="button"` + keyboard handlers
- [ ] Links use `<a href>` for navigation
- [ ] Custom components have ARIA attributes
- [ ] Modals trap focus correctly
- [ ] Dropdown menus keyboard navigable

## Sign-Off
- Reviewer: _______
- Date: _______
- Issues: [ ] None [ ] See below

| Severity | Issue | WCAG | Location | Fix |
|----------|-------|------|----------|-----|
| | | | | |
