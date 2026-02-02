---
name: analyze-orchestrator
description: Analyze Claude Code session transcripts for orchestrator pattern compliance
disable-model-invocation: true
allowed-tools: Read, Bash, Write
---

# /analyze-orchestrator

Analyze Claude Code session transcripts to evaluate orchestrator pattern compliance and detect anti-patterns.

## Usage

```
/analyze-orchestrator [session-id] [options]
```

## Options

| Option | Description |
|--------|-------------|
| `session-id` | Specific session ID to analyze (default: most recent) |
| `--batch` | Analyze all sessions for this project |
| `--project path` | Specify project path (default: current directory) |
| `--list` | List available sessions |

## Examples

```bash
# Analyze most recent session
/analyze-orchestrator

# Analyze specific session
/analyze-orchestrator abc123-def456

# List available sessions
/analyze-orchestrator --list

# Batch analysis of all sessions
/analyze-orchestrator --batch
```

## Process

When invoked, follow these steps:

### Step 1: Locate Session(s)

1. If `--list` specified, list available sessions and stop
2. If session ID provided, find that specific session
3. Otherwise, use the most recent session for the current project
4. If `--batch` specified, collect all sessions

Session location: `~/.claude/projects/{project-hash}/{sessionId}.jsonl`

### Step 2: Run the Analyzer

Run the session analyzer:

```bash
node .claude/scripts/analyze-session.mjs [session-id] [options]
```

Options:
- `--list` - List available sessions
- `--batch` - Analyze all sessions
- `--json` - Output raw JSON instead of report

The analyzer will:
- Parse the session transcript(s)
- Extract tool calls and metrics
- Evaluate against orchestrator rules
- Generate markdown report(s)

### Step 3: Review Results

The analyzer evaluates sessions against these rules:

| Rule | Detection | Severity |
|------|-----------|----------|
| Plan Mode Usage | `EnterPlanMode` tool call | warning |
| Agent Delegation | `Task` tool calls present | error |
| File Read Limit | ≤3 consecutive reads in main | warning |
| No Direct Code Write | No Write/Edit to code files in main | error |
| Explore Agent Usage | Explore agent for >5 reads | warning |
| Batch File Limit | ≤20 files per agent delegation | warning |

### Step 4: Output Summary

The analyzer displays a summary and saves the report to `.claude/audit/analysis/`:

```
Orchestrator Analysis Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session: {session-id}
Duration: {duration}
Score: {score}%
Violations: {count} ({errors} errors, {warnings} warnings)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Violations:
  ❌ Agent Delegation: No agent delegation in non-trivial task
  ⚠️ Plan Mode Usage: Non-trivial task did not enter plan mode

Report saved to: .claude/audit/analysis/{session-id}-analysis.md
```

## Rules Evaluated

### PLAN_MODE_USAGE (Warning)

Non-trivial tasks should enter plan mode. A task is trivial if:
- ≤3 tool calls total
- ≤1 file touched
- <2 minutes duration

### AGENT_DELEGATION (Error)

Non-trivial tasks must delegate to specialized agents. The orchestrator's job is to COORDINATE, not to DO the work.

### FILE_READ_LIMIT (Warning)

Orchestrator should not read more than 3 files consecutively without delegating to a Research or Explore agent.

### NO_DIRECT_CODE_WRITE (Error)

Orchestrator should never write code files directly in main context. All code changes must be delegated to Coding agents.

### EXPLORE_AGENT_USAGE (Warning)

When reading >5 files for exploration, use the Explore subagent (fast, read-only).

### BATCH_FILE_LIMIT (Warning)

Each agent delegation should handle ≤20 files to prevent context overflow.

## Output Format

### Single Session Report

```markdown
# Orchestrator Analysis: {session_id}

## Scorecard

| Metric | Value | Status |
|--------|-------|--------|
| Plan Mode | Yes/No | ✅ Pass / ❌ VIOLATION |
| Agent Delegations | {n} | ✅ Pass / ❌ VIOLATION |
| Direct File Reads | {n} | ✅ Pass / ⚠️ Warning |
| Direct Code Writes | {n} | ✅ Pass / ❌ VIOLATION |

**Overall Score:** {0-100}%

## Violations
- Detailed violation information with file references

## Recommendations
- Actionable improvements
```

### Batch Report

```markdown
# Batch Orchestrator Analysis

## Summary
| Metric | Value |
| Average Score | {avg}% |
| Total Violations | {n} |

## Session Breakdown
| Session | Score | Errors | Warnings |

## Most Common Violations
Ranked by frequency

## Improvement Recommendations
Based on pattern analysis
```

## Scoring

Score is calculated as weighted rule compliance:
- **Error** rules: 3x weight
- **Warning** rules: 1x weight
- **Info** rules: 0.5x weight

Formula: `(passed_weight / total_weight) * 100`

## When to Use

- After completing a project creation or migration
- During retrospectives to identify improvement areas
- Before committing to check orchestrator compliance
- Periodically to track compliance trends (`--batch`)

## Integration with Audit Trail

This skill complements the audit trail system:
- `/audit-decision` - Manual decision recording
- `/audit-summary` - Session retrospectives
- `/analyze-orchestrator` - Automated compliance analysis (this skill)

Analysis reports are stored alongside other audit data in `.claude/audit/analysis/`.
