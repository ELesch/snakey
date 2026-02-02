# Agent Failure Recovery

Runbook for handling failed agent delegations and broken tests.

## Quick Reference

| Failure Type | First Action | Recovery |
|--------------|--------------|----------|
| Test failures | Check error message | Re-delegate with fix |
| Build broken | Check TypeScript errors | Fix imports/types |
| Agent timeout | Check scope | Reduce scope, retry |
| Scope violation | Review diff | Revert unauthorized |
| Unknown error | Research agent | Diagnose first |

## Severity Levels

| Level | Definition | Response Time |
|-------|------------|---------------|
| **Critical** | Build completely broken | Immediate |
| **High** | Tests failing, cannot merge | Same session |
| **Medium** | Partial failure, workaround exists | Before session end |
| **Low** | Cosmetic, doesn't block work | Next session |

---

## Runbook: Test Failures

### Symptoms
- Previously passing tests now fail
- New tests fail immediately
- Intermittent test failures

### Steps

1. **Get failure details**
   ```bash
   npm test -- --verbose 2>&1 | tail -100
   ```

2. **Identify failing tests**
   ```bash
   npm test -- --listTests --testNamePattern="<pattern>"
   ```

3. **Check recent changes**
   ```bash
   git log --oneline -10
   git diff HEAD~1 -- "*.test.*"
   ```

4. **Delegate fix**
   ```
   @dev-test Fix the failing test in [file].

   ERROR: [Paste error message]
   CONTEXT: [What changed that might have caused it]
   CONSTRAINT: Only fix the test, do not modify implementation
   ```

5. **Verify fix**
   - Run `/verify-agent`
   - Ensure all tests pass

### Common Causes

| Cause | Fix |
|-------|-----|
| Interface changed | Update test to match new interface |
| Mock missing | Add mock for new dependency |
| Async timing | Add await or increase timeout |
| Import path changed | Update import in test file |

---

## Runbook: Build Failures

### Symptoms
- TypeScript compilation errors
- Import/export failures
- Module resolution errors

### Steps

1. **Get full error list**
   ```bash
   npm run typecheck 2>&1 > /tmp/errors.txt
   cat /tmp/errors.txt | head -50
   ```

2. **Count errors by file**
   ```bash
   grep "error TS" /tmp/errors.txt | cut -d'(' -f1 | sort | uniq -c | sort -rn
   ```

3. **Fix in order of dependency**
   - Start with base modules (utils, types)
   - Move to services
   - End with controllers/components

4. **Delegate fix**
   ```
   @dev-backend Fix TypeScript errors in [module].

   ERRORS: [List specific TS errors]
   CONSTRAINT: Only fix type errors, no functional changes
   ```

5. **Verify fix**
   - `npm run typecheck` passes
   - `npm run build` succeeds

### Common Causes

| Cause | Fix |
|-------|-----|
| Missing export | Add export to index.ts |
| Type mismatch | Update type definition |
| Circular dependency | Restructure imports |
| Missing dependency | Install or import |

---

## Runbook: Agent Timeout/Failure

### Symptoms
- Agent runs too long
- Agent reports error
- Agent produces incomplete output

### Steps

1. **Review agent prompt**
   - Was scope clear?
   - Was scope too large?
   - Were constraints specified?

2. **Check agent output**
   - What was completed?
   - Where did it stop?
   - What error was reported?

3. **Reduce scope and retry**
   ```
   @dev-backend [REDUCED SCOPE] Implement only [specific piece].

   SCOPE: Just [X], not [Y] or [Z]
   CONSTRAINT: Maximum 5 files
   CONTEXT: Previous attempt failed at [point]
   ```

4. **If still failing**
   - Split into even smaller pieces
   - Run research agent first
   - Consider different approach

---

## Runbook: Scope Violation

### Symptoms
- Agent modified files outside stated scope
- Unexpected changes in `git status`
- Unrelated tests affected

### Steps

1. **Identify unauthorized changes**
   ```bash
   git diff --name-only
   # Compare to expected files
   ```

2. **Revert unauthorized files**
   ```bash
   git checkout HEAD -- path/to/unauthorized/file
   ```

3. **Document the violation**
   - Note in LEARNINGS.md
   - Update agent prompt for future

4. **Re-delegate with stricter constraints**
   ```
   @dev-backend [STRICT SCOPE] Implement [task].

   ALLOWED FILES: [explicit list]
   NOT ALLOWED: Any file not listed above
   VERIFY: Before any edit, confirm file is in allowed list
   ```

---

## Runbook: Unknown Error

### Symptoms
- Something is broken but cause unclear
- Error messages not helpful
- Multiple things seem wrong

### Steps

1. **Don't guess - research first**
   ```
   @dev-analyst Investigate the current error state.

   SYMPTOMS: [What you observe]
   QUESTION: What is the root cause?
   OUTPUT: Diagnosis report with recommended fix
   ```

2. **Check system state**
   ```bash
   git status
   npm test 2>&1 | tail -20
   npm run build 2>&1 | tail -20
   ```

3. **Review recent history**
   ```bash
   git log --oneline -10
   git diff HEAD~3 --stat
   ```

4. **Once cause identified, apply appropriate runbook**

---

## Recovery Decision Matrix

| Affected Files | Tests Status | Action |
|----------------|--------------|--------|
| 1-2 | Failing | Targeted fix |
| 3-5 | Failing | Fix or mini-rollback |
| 5+ | Failing | Rollback and retry |
| Any | Passing | Verify quality only |

---

## Post-Recovery Checklist

After any recovery:

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Types check: `npm run typecheck`
- [ ] Changes reviewed: `git diff`
- [ ] Documented in LEARNINGS.md (if significant)
- [ ] BLOCKERS.md updated (if unresolved items remain)

---

## Escalation

Escalate to user when:
- Recovery attempts fail 3+ times
- Unclear which approach to take
- Risk of data loss
- Outside agent capabilities
- Need architectural decision

**How to escalate:**
1. Document current state in BLOCKERS.md
2. Summarize attempts made
3. Present options with tradeoffs
4. Ask user for direction
