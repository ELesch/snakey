# Audit Decision Skill

---
name: audit-decision
description: |
  Record a significant decision with alternatives considered and rationale.
  Use when making technology choices, architecture decisions, or trade-offs
  that future developers should understand.
disable-model-invocation: true
allowed-tools: Read, Write, Glob
---

You are recording a significant decision for the audit trail. This creates a permanent record that helps future developers understand why choices were made.

## When to Use This Skill

Record decisions when:
- Choosing between technologies (database, framework, library)
- Making architecture decisions (patterns, module boundaries)
- Resolving trade-offs (performance vs. simplicity, cost vs. features)
- Changing a previous decision (with rationale for the change)

## Process

### Step 1: Gather Decision Information

Ask the user (if not provided):

1. **What decision was made?** - Clear, one-line summary
2. **What alternatives were considered?** - At least 2 options
3. **What are the pros/cons of each?** - Objective analysis
4. **Why was this choice made?** - The decisive factors
5. **What constraints influenced the decision?** - Time, budget, skills, etc.

### Step 2: Create Decision Record

Generate a unique ID based on topic:
- Technology choice: `tech-{technology}`
- Architecture: `arch-{component}`
- Trade-off: `tradeoff-{topic}`
- Other: `decision-{number}`

Create the file at: `.claude/audit/decisions/{YYYY-MM-DD}-{id}.md`

### Step 3: Write Decision Record

Use this format:

```markdown
# Decision: {One-line summary}

**Date:** {YYYY-MM-DD}
**ID:** {id}
**Status:** Accepted
**Context:** {Project phase or what prompted this decision}

## Question

{What question or problem needed to be resolved?}

## Alternatives Considered

### Option 1: {Name}

**Description:** {Brief description}

**Pros:**
- {Pro 1}
- {Pro 2}

**Cons:**
- {Con 1}
- {Con 2}

### Option 2: {Name}

**Description:** {Brief description}

**Pros:**
- {Pro 1}
- {Pro 2}

**Cons:**
- {Con 1}
- {Con 2}

{Add more options as needed}

## Decision

**Chosen:** {Option name}

**Rationale:** {Why this option was selected. What made it the best choice given the constraints?}

## Constraints

- {Constraint 1}
- {Constraint 2}

## Consequences

**Expected benefits:**
- {Benefit 1}
- {Benefit 2}

**Potential risks:**
- {Risk 1}
- {Risk 2}

## Related Decisions

- {Link to related decision records if any}
```

### Step 4: Confirm Creation

Report:
- File path created
- Decision summary
- Reminder about updating if decision changes

## Examples

### Example 1: Database Choice

User: "We chose Supabase over Firebase"

**Creates:** `.claude/audit/decisions/2026-01-31-tech-supabase.md`

### Example 2: Architecture Pattern

User: "Using feature-based module structure"

**Creates:** `.claude/audit/decisions/2026-01-31-arch-module-structure.md`

## Guidelines

### What Makes a Good Decision Record

1. **Objective** - Present alternatives fairly
2. **Complete** - Include context for future readers
3. **Honest** - Acknowledge risks
4. **Actionable** - Include follow-up actions

### Updating Decisions

If a decision is later reversed:
1. DO NOT delete the original record
2. Create a new decision record referencing the original
3. Update the original's status to "Superseded by {new-id}"
