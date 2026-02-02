---
name: parallel-check
description: Pre-flight safety check before running agents in parallel. Invoke before any parallel delegation.
disable-model-invocation: false
user-invocable: true
allowed-tools: Read
---

# Parallel Execution Safety Check

**Run this check BEFORE** launching agents in parallel.

## Input Required

Fill in before checking:

| Field | Value |
|-------|-------|
| **Agent A** | _______________ |
| **Agent A Scope** | _______________ |
| **Agent A Files** | _______________ |
| **Agent B** | _______________ |
| **Agent B Scope** | _______________ |
| **Agent B Files** | _______________ |

## Safety Checks

### Check 1: Agent Compatibility Matrix

Reference the compatibility matrix in `roster.md`:

| Combination | Safe? | Notes |
|-------------|-------|-------|
| backend + backend | NEVER | Same codebase |
| frontend + frontend | NEVER | Same codebase |
| backend + frontend | CONDITIONAL | Only if different modules |
| test + anything | NEVER | Tests depend on stable code |
| reviewer + reviewer | NEVER | Avoid confusion |
| reviewer + security | SAFE | Both read-only |
| auditor + auditor | SAFE | All read-only |
| auditor + implementation | SAFE | Read vs write |

**Your combination:** Agent A (___) + Agent B (___)

**Matrix result:** [ ] SAFE  [ ] CONDITIONAL  [ ] NEVER

### Check 2: Directory Conflict Detection

List directories each agent will touch:

| Agent A Directories | Agent B Directories | Overlap? |
|---------------------|---------------------|----------|
| _______________ | _______________ | [ ] Yes [ ] No |
| _______________ | _______________ | [ ] Yes [ ] No |
| _______________ | _______________ | [ ] Yes [ ] No |

**If ANY overlap:** Cannot run in parallel.

### Check 3: File Conflict Detection

List specific files each agent will modify:

| Agent A Files | Agent B Files | Conflict? |
|---------------|---------------|-----------|
| _______________ | _______________ | [ ] Yes [ ] No |
| _______________ | _______________ | [ ] Yes [ ] No |

**If ANY conflict:** Cannot run in parallel.

### Check 4: Dependency Check

Does Agent B need Agent A's output?

- [ ] No - Agent B can work independently
- [ ] Yes - Agent B needs files Agent A creates
- [ ] Yes - Agent B needs information from Agent A

**If Agent B depends on Agent A:** Must run sequentially.

Does Agent A need Agent B's output?

- [ ] No - Agent A can work independently
- [ ] Yes - Bidirectional dependency

**If bidirectional dependency:** STOP - rethink the approach.

### Check 5: Resource Contention

Will both agents:

- [ ] Run the same test suite? -> Cannot parallel
- [ ] Modify the same config file? -> Cannot parallel
- [ ] Touch the same database tables? -> Cannot parallel
- [ ] Generate to the same output directory? -> Cannot parallel

## Decision

Based on all checks:

### SAFE - Proceed with Parallel

All conditions met:
- [ ] Matrix says SAFE or CONDITIONAL (with condition met)
- [ ] No directory overlap
- [ ] No file conflicts
- [ ] No dependencies between agents
- [ ] No resource contention

**You may launch both agents in parallel.**

### CONDITIONAL - Proceed with Caution

Conditions:
- Matrix says CONDITIONAL
- Minimal overlap with clear boundaries
- No hard dependencies

**Proceed with explicit scope boundaries:**
```
Agent A: Only touch src/modules/user/
Agent B: Only touch src/modules/contact/
Neither: Do not touch src/lib/ or shared files
```

### UNSAFE - Run Sequentially

Any of:
- Matrix says NEVER
- Directory/file overlap exists
- One agent depends on other's output
- Resource contention detected

**Run sequentially:** Agent A -> verify -> Agent B

## Parallel Execution Template

If SAFE or CONDITIONAL, use this delegation pattern:

```
I will run two agents in parallel:

AGENT A: @{agent-name}
SCOPE: {explicit directories/files}
BOUNDARY: Do NOT touch {excluded areas}

AGENT B: @{agent-name}
SCOPE: {explicit directories/files}
BOUNDARY: Do NOT touch {excluded areas}

SHARED CONSTRAINT: Neither agent should modify {shared areas}
```

## Common Safe Parallel Patterns

| Pattern | Agents | Why Safe |
|---------|--------|----------|
| Parallel review | dev-reviewer + dev-security | Both read-only |
| Parallel audit | dev-auditor-* + dev-auditor-* | All read-only |
| Module isolation | dev-backend(users) + dev-frontend(contacts) | Different modules |
| Docs while review | dev-docs + dev-reviewer | Different outputs |

## Common Unsafe Patterns

| Pattern | Agents | Why Unsafe |
|---------|--------|------------|
| Same module | dev-backend(users) + dev-test(users) | Test depends on implementation |
| Same agent | dev-backend + dev-backend | Always conflicts |
| Shared utils | Any two modifying src/lib/ | Shared code |
| Schema changes | dev-migration + anything | DB state changes |

## After Parallel Execution

When both agents complete:

1. **Verify no conflicts:** Check for merge conflicts or overwrites
2. **Run tests:** Full test suite, not just module tests
3. **Build check:** Ensure both sets of changes compile together
4. **Integration check:** Test that components work together

If issues found:
- Document which parallel combination caused the issue
- Run `/recover`
- Update this check with new unsafe pattern
