# Audit Trail System

This directory contains audit logs and decision records for tracking activity during development.

## Purpose

The audit trail captures **process** rather than just **outcomes**:

- **What happened** - Agent delegations, tool usage, failures
- **Why decisions were made** - Alternatives considered, rationale
- **When things occurred** - Timestamps for debugging
- **What went wrong** - Failure details for improvement

## Directory Structure

```
.claude/audit/
├── README.md           # This file
├── sessions/           # Auto-generated session logs (by date)
│   └── YYYY-MM-DD.md   # Daily session log
└── decisions/          # Manual decision records
    └── YYYY-MM-DD-{id}.md
```

## Session Logs (Automatic)

Session logs are automatically created by hooks when:

- Agents are delegated to (`SubagentStart`)
- Agents complete (`SubagentStop`)
- Tools fail (`PostToolUseFailure`)
- Sessions start/end

### Session Log Format

```markdown
## Session: 2026-01-31T10:00:00

### 10:15:00 - Agent Delegated: dev-backend

| Field | Value |
|-------|-------|
| Task | Implement user service endpoints |
| Scope | src/modules/user/ |
| Status | In Progress |

### 10:30:00 - Agent Completed: dev-backend

| Field | Value |
|-------|-------|
| Duration | 15m |
| Status | Success |
| Files Modified | 8 |
```

## Decision Records (Manual via /audit-decision)

Use the `/audit-decision` skill to record significant decisions:

```
/audit-decision
```

Creates a structured record of:
- What decision was made
- Alternatives considered (with pros/cons)
- Why the choice was made
- Context and constraints

### When to Record Decisions

- Technology choices (library, pattern, approach)
- Architecture decisions (module boundaries, API design)
- Trade-off decisions (performance vs. simplicity)
- Reversals (changing previous decisions)

## Audit Summary (via /audit-summary)

Use the `/audit-summary` skill to analyze session logs:

```
/audit-summary
```

Generates:
- Agent delegation patterns
- Failure frequency and types
- Recommendations for improvement

## Usage

1. **Daily work** - Session logs are automatic
2. **Key decisions** - Use `/audit-decision` to record
3. **Retrospectives** - Use `/audit-summary` to analyze

## Privacy

- Session logs may contain file paths and error messages
- These files are gitignored by default
- Share only sanitized summaries externally

## Retention

- Session logs: Keep for project lifetime
- Decision records: Keep permanently (they document architecture)
