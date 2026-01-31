---
name: capture
description: Save important knowledge (tech gotchas, preferences, patterns) to project files
disable-model-invocation: false
allowed-tools: Read, Edit, Grep
---

# Knowledge Capture Skill

Persist important discoveries to the appropriate project file.

## Usage

```
/capture
Knowledge: {What was learned}
Category: tech | preference | practice | spec
Target: @{optional file path}
```

## Categories

| Category | Target File | What Goes Here |
|----------|-------------|----------------|
| `tech` | `.claude/tech/stack.md` | Version gotchas, API changes, patterns |
| `preference` | `CLAUDE.md` (conventions section) | Code style, naming, user choices |
| `practice` | `.claude/LEARNINGS.md` | Best practices, patterns that work |
| `spec` | `.claude/REQUIREMENTS.md` | Requirements, specifications |

## Process

1. **Parse the capture request** - Extract knowledge and category
2. **Determine target file** - Use explicit target or category default
3. **Read the target file** - Get current content
4. **Find appropriate section** - Match category to file section
5. **Check for duplicates** - Skip if knowledge already exists
6. **Insert or update** - Add to appropriate section (don't blindly append)
7. **Confirm** - Report what was captured and where

## Intelligent Insertion Rules

- **tech**: Add to "Version Gotchas" or appropriate technology section
- **preference**: Add to "Project-Specific Conventions" section
- **practice**: Add to most relevant section in LEARNINGS.md
- **spec**: Add to most relevant section in REQUIREMENTS.md

## Example

**Input:**
```
/capture
Knowledge: Prisma 7 requires the adapter to be passed at runtime, not in config
Category: tech
```

**Action:**
1. Open `.claude/tech/stack.md`
2. Find "Prisma" section in gotchas
3. Add entry if not already present

**Output:**
```
Captured to .claude/tech/stack.md:
Added Prisma adapter runtime configuration gotcha
```

## Deduplication

Before adding, check if:
- Exact text already exists
- Semantically equivalent knowledge is present
- Entry would be redundant with existing content

If duplicate found, report "Already captured" and skip.
