# Audit Summary Skill

---
name: audit-summary
description: |
  Analyze session logs and generate a summary report.
  Use for retrospective analysis, debugging patterns, and improvement.
disable-model-invocation: true
allowed-tools: Read, Glob, Write
---

You are analyzing audit trail data to generate insights about project activity.

## When to Use This Skill

- **Retrospectives** - Analyze what happened during a phase
- **Debugging** - Trace what led to a failure
- **Improvement** - Identify patterns for better processes
- **Reporting** - Generate summaries

## Process

### Step 1: Gather Audit Data

Use Glob to find available logs:

```
.claude/audit/sessions/*.md
.claude/audit/decisions/*.md
```

Ask user about scope:
- **All time** - All available logs
- **Recent** - Last 7 days (default)
- **Specific date** - User provides date

### Step 2: Read and Parse Logs

For each session log:
1. Read the file
2. Extract entries:
   - Agent delegations (name, task)
   - Agent completions (success/failure)
   - Tool failures (tool, error type)

For decision records:
1. Extract: date, id, decision summary

### Step 3: Analyze Patterns

Calculate:
- Total delegations by agent type
- Success/failure ratio per agent
- Most common failure types
- Decision trends by category

### Step 4: Generate Summary Report

Create report at: `.claude/audit/summary-{YYYY-MM-DD}.md`

```markdown
# Audit Summary Report

**Generated:** {timestamp}
**Period:** {start-date} to {end-date}

## Executive Summary

{2-3 sentence overview}

## Agent Activity

| Agent | Delegations | Success Rate |
|-------|-------------|--------------|
| {agent} | {n} | {%} |

## Failure Analysis

| Error Type | Count | Primary Source |
|------------|-------|----------------|
| {type} | {n} | {tool/agent} |

### Recommendations

- {Recommendation 1}
- {Recommendation 2}

## Decision Records

| Date | ID | Summary |
|------|------|---------|
| {date} | {id} | {summary} |

## Insights

- {Insight 1}
- {Insight 2}
```

### Step 5: Report

After generating, report:
- Summary file location
- Key highlights (3-5 bullets)
- Suggested follow-up

## Output Modes

### Default: Full Summary

Complete analysis as described.

### Quick Mode

When user says "quick":
- Top 3 patterns only
- Under 30 lines

### Failure Focus

When user mentions "debug":
- Focus on failures
- Include error excerpts
- Suggest fixes

## Error Handling

If no audit data:
- Report "No audit data found"
- Check hook configuration
- Verify `.claude/settings.json` has audit hooks
