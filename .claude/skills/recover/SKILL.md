---
name: recover
description: Error recovery protocol when agents fail or tests break. Invoke immediately upon detecting failures.
disable-model-invocation: false
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Edit
---

# Error Recovery Protocol

**Invoke immediately** when:
- Agent returns errors
- Tests fail after agent completion
- Build breaks
- Unexpected state detected

**NEVER** end a session with unresolved failures.

## Step 1: Classify the Failure

| Type | Symptoms | Severity |
|------|----------|----------|
| **Test Failure** | Tests were passing, now failing | Medium |
| **Build Broken** | TypeScript errors, import failures | High |
| **Agent Error** | Agent reported failure | Medium |
| **Scope Violation** | Wrong files modified | High |
| **Conflict** | Merge conflict, concurrent changes | Medium |
| **Unknown** | Something is wrong but unclear | High |

**Current failure type:** _______________

## Step 2: Assess Impact

### Affected Files

```bash
# Check what changed recently
git status
git diff --stat HEAD~3
```

| Count | Category |
|-------|----------|
| ___ | Files with errors |
| ___ | Test files failing |
| ___ | Total files affected |

### Impact Scope

- [ ] **Isolated** - Single module affected
- [ ] **Limited** - 2-3 modules affected
- [ ] **Widespread** - Many modules affected

## Step 3: Choose Recovery Strategy

### Small Scope (< 5 files affected)

**Strategy: Targeted Fix**

1. Identify the specific issue
2. Delegate fix to the same agent type
3. Run `/verify-agent` after fix
4. Continue workflow

**Prompt template:**
```
@dev-backend Fix the failing tests in [module].

ISSUE: [Specific error message]
FILES: [Affected files]
CONSTRAINT: Only fix the identified issue, no other changes
OUTPUT: Run tests, confirm pass, report
```

### Large Scope (5+ files affected)

**Strategy: Rollback and Retry**

1. Stash or revert changes
2. Document what went wrong
3. Re-plan the approach
4. Try again with smaller scope

**Git commands:**
```bash
# Option A: Stash changes
git stash push -m "Recovery: [description]"

# Option B: Soft reset (keeps changes unstaged)
git reset --soft HEAD~1

# Option C: Hard reset (discards changes - dangerous)
git reset --hard HEAD~1
```

### Unknown Cause

**Strategy: Investigate First**

1. Spawn Research agent to diagnose
2. Do NOT attempt fix until cause is known
3. Document findings in BLOCKERS.md

## Step 4: Execute Recovery

### For Test Failures

```bash
# Run failing tests with verbose output
npm test -- --verbose --testPathPattern="<pattern>"

# Check test logs for specific error
npm test -- --testPathPattern="<pattern>" 2>&1 | head -50
```

**Common causes:**
- Missing mock/stub
- Changed interface not updated in test
- Async timing issue
- Import path changed

### For Build Failures

```bash
# Get full TypeScript errors
npm run typecheck 2>&1

# Check for import issues
npm run build 2>&1 | grep -i "error"
```

**Common causes:**
- Missing export
- Type mismatch
- Circular dependency
- Missing dependency

### For Scope Violations

1. Identify unauthorized changes: `git diff --name-only`
2. Revert unauthorized files: `git checkout HEAD -- <file>`
3. Document the violation
4. Re-delegate with stricter constraints

## Step 5: Document the Recovery

**Required documentation:**

### In BLOCKERS.md (if unresolved):
```markdown
## [Date] - Recovery in Progress

**Issue:** [Description]
**Status:** Investigating / Fixing / Blocked
**Affected:** [Files/modules]
**Root cause:** [If known]
**Attempted:** [What's been tried]
**Next:** [What to try next]
```

### In LEARNINGS.md (after resolved):
```markdown
## [Date] - Recovered from [Issue Type]

**What happened:** [Brief description]
**Root cause:** [What actually caused it]
**How fixed:** [Solution applied]
**Prevention:** [How to avoid in future]
```

## Step 6: Verify Recovery

After recovery actions:

1. [ ] Run full test suite: `npm test`
2. [ ] Build succeeds: `npm run build`
3. [ ] No TypeScript errors: `npm run typecheck`
4. [ ] Review changes: `git diff`
5. [ ] Run `/verify-agent` on the fix

## Decision Tree

```
Failure detected
    │
    ├─→ Can identify cause?
    │       │
    │       ├─→ YES: Is scope small?
    │       │         │
    │       │         ├─→ YES (<5 files): Targeted fix
    │       │         └─→ NO (5+ files): Rollback and retry
    │       │
    │       └─→ NO: Research agent to diagnose
    │
    └─→ Is session ending?
            │
            ├─→ YES: Document in BLOCKERS.md, commit safe state
            └─→ NO: Continue recovery
```

## Emergency Commands

```bash
# Save current state before risky recovery
git stash push -m "Pre-recovery backup $(date +%Y%m%d_%H%M%S)"

# View what stash contains
git stash show -p

# Restore from stash
git stash pop

# Discard recovery attempt and restore backup
git stash pop
```

## Never Do

- [ ] Push broken code to main
- [ ] End session with failing tests
- [ ] Ignore build errors
- [ ] Accumulate multiple failures
- [ ] Skip documentation of what went wrong

**Principle:** Fix forward with small, verified steps. Document everything.
