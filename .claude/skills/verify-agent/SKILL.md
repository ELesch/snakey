---
name: verify-agent
description: Mandatory verification after agent delegation. Run after every Task tool completion to verify agent output.
disable-model-invocation: false
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
---

# Agent Output Verification

**MANDATORY** after every agent delegation. Do NOT proceed without verification.

## Verification Checklist

### 1. File Inventory

| Expected | Actual | Status |
|----------|--------|--------|
| Files created: ___ | Files found: ___ | [ ] Match |
| Files modified: ___ | Changed: ___ | [ ] Match |

**Check:**
- [ ] All expected files were created
- [ ] No unexpected files were created
- [ ] Files are in the correct locations

### 2. Test Verification

Run tests for the affected modules:

```bash
# Run relevant tests
npm test -- --testPathPattern="<module-pattern>"
```

| Metric | Value |
|--------|-------|
| Tests passed | ___ / ___ |
| Tests failed | ___ |
| Coverage | ___% |

**Check:**
- [ ] All existing tests still pass
- [ ] New tests were added (if implementation agent)
- [ ] No test files left in failing state

### 3. Code Quality

**Check for forbidden patterns:**
- [ ] No `console.log` left in production code
- [ ] No commented-out code blocks
- [ ] No TODO markers without tickets
- [ ] No hardcoded secrets or credentials
- [ ] Error handling is complete

**Check for required patterns:**
- [ ] TypeScript strict mode satisfied (no `any` escapes)
- [ ] Consistent naming conventions
- [ ] Follows patterns in `CLAUDE.md`

### 4. Scope Verification

**Critical:** Agent must stay within delegated scope.

- [ ] Only touched files within stated scope
- [ ] Did not modify unrelated modules
- [ ] Did not add unrequested features
- [ ] Respects layer boundaries (service/repo/controller)

### 5. Integration Check

- [ ] No broken imports
- [ ] Application builds successfully: `npm run build`
- [ ] Type checking passes: `npm run typecheck` (if available)

## Decision Tree

```
All checks pass?
    │
    ├─→ YES: Proceed to next agent or complete task
    │
    └─→ NO: Classify failure
            │
            ├─→ Test failures → Invoke /recover
            ├─→ Scope violation → Document in BLOCKERS.md, escalate to user
            ├─→ Quality issues → Delegate fix to same agent
            └─→ Build broken → Invoke /recover
```

## Quick Verification Commands

```bash
# Check for debug code
grep -r "console.log" src/ --include="*.ts" --include="*.tsx" | grep -v ".test."

# Check for TODO markers
grep -r "TODO" src/ --include="*.ts" --include="*.tsx"

# Run type check
npm run typecheck 2>&1 || echo "Type errors found"

# Run build
npm run build 2>&1 || echo "Build failed"

# Run affected tests
npm test -- --coverage --changedSince=HEAD~1
```

## Verification Report Template

After verification, document:

```markdown
## Verification: [Agent Name] - [Task Summary]

**Date:** [Current Date]
**Agent:** [Agent Name]

### Files
- Created: X files
- Modified: Y files
- Unexpected: (none | list)

### Tests
- Status: PASS / FAIL
- New tests: X added
- Coverage: X%

### Quality
- Issues found: (none | list)
- Fixed: (yes/no/pending)

### Scope
- Stayed within scope: YES / NO
- Violations: (none | list)

### Result
- [ ] VERIFIED - Proceed
- [ ] NEEDS FIX - Re-delegate
- [ ] BLOCKED - Escalate

### Next Action
[What to do next]
```

## If Verification Fails

1. **Document the failure** clearly
2. **Classify the severity:**
   - Minor: Fix in next agent run
   - Major: Invoke `/recover`
   - Blocking: Update BLOCKERS.md, notify user
3. **Never proceed** with unverified work
4. **Never accumulate** failures across agents

**Principle:** Catch problems early. One verified agent at a time.

## Post-Verification Reminder

After completing verification, check if you need a checkpoint:

```
┌─────────────────────────────────────────────────────────┐
│  CHECKPOINT CHECK                                        │
│                                                          │
│  Have you completed 3+ agents since last checkpoint?    │
│  ├─ YES → Run /orchestrator-checkpoint                  │
│  └─ NO  → Proceed to next agent                         │
│                                                          │
│  Has it been 5+ turns since last checkpoint?            │
│  ├─ YES → Run /orchestrator-checkpoint                  │
│  └─ NO  → Proceed to next agent                         │
└─────────────────────────────────────────────────────────┘
```

**Reminder:** The orchestrator's job is to COORDINATE, not to DO the work. If you're about to read many files or write code directly—stop and delegate instead.
