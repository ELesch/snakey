---
name: tech-revalidate
description: Check for AI knowledge drift and update technology validation
disable-model-invocation: true
allowed-tools: Read, Edit, WebSearch, Bash
---

# Tech Revalidation Skill

Detect and handle technology validation drift.

## Usage

```
/tech-revalidate
```

## When to Use

- Starting work after a long break (>7 days)
- After upgrading dependencies
- Claude's training cutoff may have changed
- AI suggests patterns that seem outdated

## Detection Logic

1. **Check if stack.md exists** - If not, full validation needed
2. **Check AI training cutoff** - Compare to manifest's recorded cutoff
3. **Check tech versions** - Compare manifest to package.json/package-lock.json
4. **Check validation age** - If >90 days, revalidation recommended

## Process

1. **Read `.claude/manifest.json`** - Get techValidation section
2. **Read `package.json`** - Get current dependency versions
3. **Compare versions** - Identify changed technologies
4. **Determine validation type**:
   - **Full**: Stack.md missing OR AI cutoff changed OR >90 days
   - **Targeted**: Only specific technologies changed

### For Full Validation

1. Research current versions of all stack technologies
2. Assess AI confidence levels
3. Generate new gotchas for Medium/Low confidence
4. Update `.claude/tech/stack.md` completely
5. Update `.claude/manifest.json` techValidation section

### For Targeted Validation

1. Research only changed technologies
2. Update relevant sections in stack.md
3. Update only changed entries in manifest.json

## Output

Report:
- What triggered revalidation
- Which technologies were revalidated
- What changed (new gotchas, confidence level changes)
- Updated files

## Example Output

```
Tech Revalidation Complete
==========================

Trigger: Dependency versions changed (package.json)

Changed Technologies:
- Next.js: 15.0.0 -> 15.1.0 (Minor update, no gotcha changes)
- Prisma: 7.0.0 -> 7.2.0 (Minor update, added new feature note)

Updated Files:
- .claude/manifest.json (techValidation section)
- .claude/tech/stack.md (version table, Prisma section)

New Gotchas: None

Recommendation: Review Prisma 7.2 release notes for new features.
```
