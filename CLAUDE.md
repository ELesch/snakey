# CLAUDE.md

## SYSTEM INSTRUCTION: DETERMINE YOUR ROLE

*How to know: You are the **Orchestrator** if this is the main conversation with the user. You are a **Sub-Agent** if you were spawned via the Task tool.*

**IF you are the Orchestrator (Main Session):**
- **GOAL:** Plan tasks and coordinate work
- **ACTION:** Delegate implementation to agents listed below
- **CONSTRAINT:** Do NOT write complex code directly - delegate to agents

**IF you are a Sub-Agent (e.g., `dev-backend`, `dev-test`):**
- **OVERRIDE:** Ignore orchestrator restrictions above
- **ACTION:** You are a **WORKER** - you MUST write code, edit files, and run tests as requested

---

This file provides guidance to Claude Code when working with code in this repository.

**Orchestrator Framework Version:** 2.19.0 (Template: 1.12.0)

**IMPORTANT:** This project follows strict Test-Driven Development (TDD). YOU MUST write tests BEFORE implementation.

## Project Overview

Snakey: A Progressive Web Application (PWA) for reptile owners to track comprehensive care data for their pets. Features offline-first architecture, species-specific care tracking (sheds, feedings, breeding, vet records), photo galleries, and data visualization.

## Credentials & Secrets Management

**CRITICAL SECURITY POLICY** - All team members and AI agents MUST follow these rules.

### Rules

1. **NEVER** commit `.env` files or any file containing real credentials
2. **NEVER** hardcode secrets, API keys, passwords, or tokens in source code
3. **ALWAYS** use environment variables via `process.env`
4. **ALWAYS** document new env vars in `.env.example` (with placeholder values)
5. **ALWAYS** run `/commit` skill which includes secret scanning

### Environment Variable Pattern

```typescript
// CORRECT - Use environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error('API_KEY not configured');

// WRONG - Never hardcode
const apiKey = 'sk_live_abc123...'; // NEVER DO THIS
```

### Files

| File | Purpose | Committed? |
|------|---------|------------|
| `.env` | Actual secrets | NO - gitignored |
| `.env.example` | Template with placeholders | YES |
| `.env.local` | Local overrides | NO - gitignored |

### Adding New Environment Variables

1. Add to `.env` with real value
2. Add to `.env.example` with placeholder: `NEW_VAR="your-value-here"`
3. Add validation in code (fail fast if missing)
4. Document purpose in `.env.example` comment

### Enforcement

- **Claude Code hooks** block commits containing secrets
- **Pre-commit hooks** scan for credential patterns
- **`/commit` skill** includes mandatory secret checks

---

## Tech Stack Reference

@.claude/tech/stack.md

**See the tech stack file for current versions, installation commands, and patterns.**

Core technologies:
- **Language:** TypeScript
- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL) + Dexie (IndexedDB for offline)
- **ORM:** Prisma 7
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **PWA:** Serwist
- **Charts:** Recharts + Tremor

---

## Live Documentation (MCP)

This project uses [Context7](https://context7.com) to fetch current documentation for libraries with evolving APIs.

**Usage:** Say "use context7" in prompts when:
- Working with libraries newer than AI training cutoff (May 2025)
- AI suggests APIs that don't exist or seem outdated
- Confidence level in `.claude/tech/stack.md` is Medium or Low
- The Context7 column shows the library is indexed (Yes)

**Example:**
```
use context7 for Prisma client generation
use context7 for Next.js app router
use context7 for Tailwind v4
```

MCP configuration is in `.mcp.json`. See roster.md for full documentation.

---

## App Design Phase

Before implementing new features or major changes, run the App Design Phase:

```
/app-design
```

This creates a structured design document at `.claude/design/app-design.md` that:
- Defines feature specifications and user stories
- Inventories all pages and routes
- Maps user flows through key workflows
- Specifies component hierarchies
- Documents data requirements per component
- Prioritizes implementation order

**When to use /app-design:**
- Starting a new project after tech stack is ready
- Adding major new features
- Redesigning existing UI/UX
- When implementation keeps going off-track

**Workflow:**
```
PROJECT SETUP → APP DESIGN → IMPLEMENTATION
    ↓              ↓              ↓
 Tech stack    /app-design    dev-frontend
 Database      Design doc     dev-backend
 Auth          Blueprint      dev-test
```

The design document becomes the blueprint for `dev-frontend` and `dev-backend` agents.

---

## Claude Code Workflow

This project uses Claude Code's **orchestrator/agent pattern**:

### Orchestrator Role (Main Conversation)

The main Claude Code session acts as an **orchestrator** that:
- **Plans** complex tasks by breaking them into discrete steps
- **Delegates** implementation work to specialized agents via the Task tool
- **Coordinates** parallel workstreams (e.g., backend + frontend changes)
- **Reviews** agent results and integrates them into the overall solution
- **Communicates** with the user about progress and decisions

The orchestrator should delegate to agents for:
- Writing new files or modules
- Making multi-file edits
- Running tests and fixing failures
- Exploring unfamiliar parts of the codebase

The orchestrator CAN act directly for:
- Simple questions about the codebase (< 3 file reads)
- Quick git commands (status, log, diff)
- Clarifying requirements with the user
- Summarizing agent results

### Built-in Agent Types

| Agent | Use For |
|-------|---------|
| `Explore` | Codebase exploration, finding files, understanding architecture |
| `general-purpose` | Multi-step tasks, code writing, complex implementations |
| `Bash` | Git operations, running commands, terminal tasks |
| `Plan` | Designing implementation strategies before coding |

### Agent Taxonomy: Three Research Concepts

There are three overlapping but distinct concepts for research/exploration:

| Concept | What It Is | When to Use |
|---------|------------|-------------|
| **Built-in `Explore`** | Fast Haiku agent, read-only, no domain knowledge | Quick pattern searches, <5 files, simple questions |
| **Custom `explore-*`** | Domain-specific research agents (e.g., `explore-prisma-7`) | Technology-specific investigation, understanding patterns |
| **"Research" role** | Role classification for agents (broad read, docs only write) | Any agent focused on analysis rather than implementation |

**Decision tree for research tasks:**
```
Need to explore/research something?
│
├─ Quick and simple? (<5 files, pattern search)
│  └─→ Built-in Explore agent
│
├─ Technology-specific? (Next.js, Prisma, Tailwind)
│  ├─ explore-{tech} exists? → Use it (e.g., explore-nextjs-15)
│  └─ No? → Customize Explore via prompt
│
└─ Diagnosing an error?
   ├─ debug-{tech} exists? → Use it (e.g., debug-prisma-7)
   └─ No? → Customize Explore or general-purpose
```

See `.claude/roster.md` for the full decision tree with all agent roles.

### Custom Agents

PROACTIVELY use custom agents for all implementation work. Agent definitions are in `.claude/agents/`.

**Agent Roster:** @.claude/roster.md *(Read this file for agent selection guidance)*

**Tech Stack:** @.claude/tech/stack.md *(Agents should reference this for current versions)*

### Crafting Agent Prompts

Custom agents have expertise pre-configured. When delegating, include:

1. **Task**: Specific deliverable
2. **Context**: Files to reference (include @.claude/tech/stack.md for version-specific work)
3. **Constraints**: Boundaries
4. **Output**: What to do after

**Example:**
```
@dev-backend Create the ReptileService for managing reptile profiles.

TASK: CRUD operations plus species-aware defaults.
CONTEXT: Follow patterns in existing Service files. See @.claude/tech/stack.md for Prisma 7 patterns.
CONSTRAINTS: Stay within reptile module, use soft deletes
OUTPUT: Write service + tests, run tests, fix failures
```

### Customizing Built-in Agents (Fallback Pattern)

When no domain agent exists for a technology, customize a built-in agent via the prompt instead of working directly.

**IMPORTANT:** Custom agents created during a session aren't available until session restart. Don't create new agent files mid-task.

**Built-in agent selection:**

| Task Type | Agent | Use When |
|-----------|-------|----------|
| Research/investigate | `Explore` | Understanding code, finding patterns (read-only) |
| Multi-step implementation | `general-purpose` | Building features, code changes (full tools) |
| Run commands | `Bash` | Terminal operations only |

**Prompt structure for customizing agents:**

```
Use {agent-type} agent to {task summary}.

CONTEXT:
- {Technology/patterns being used}
- {Reference files with @path}
- {Key conventions}

TASK:
- {Specific work}

CONSTRAINTS:
- {What NOT to modify}
- {Patterns to follow}

OUTPUT:
- {What to return}
```

**Example (Stripe integration with no domain agent):**

```
Use general-purpose agent to add Stripe checkout.

CONTEXT:
- Next.js 15 App Router, patterns in @src/app/api/
- Use logger from @src/lib/logger.ts

TASK:
- Create checkout session endpoint
- Add webhook handler

CONSTRAINTS:
- Don't modify existing code
- Add env vars to .env.example

OUTPUT:
- Files created
- Env vars needed
```

See `@.claude/roster.md` for the full fallback pattern documentation.

### Agent Limitations

**IMPORTANT:** Agents cannot spawn other agents. Only the main orchestrator can use the Task tool.

For multi-phase features, the main orchestrator must:
1. Spawn agents sequentially (or in parallel if independent)
2. Collect results from each agent
3. Pass context to subsequent agents as needed

**The orchestrator should NOT:**
- Write any code files directly (always delegate to agents)
- Read more than 3 files directly without delegating to an agent
- Skip creating agents when one doesn't exist for the task
- Delegate >20 files to a single agent run (batch instead)
- Run file-writing agents in parallel (sequential only)
- Run more than 2-3 agents concurrently (even if safe)

### Post-Delegation Requirements

After EVERY agent completion:
1. **Run `/verify-agent`** - Mandatory verification checklist
2. **Check test status** - All tests must pass
3. **Review scope** - Agent stayed within boundaries
4. **Document** - Update PROJECT_STATUS.md if needed

**If verification fails:** Run `/recover` immediately.

### Agent Verification Workflow

**Run this workflow after EVERY single agent delegation** (not after batches—after each individual agent):

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AGENT COMPLETES                                  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Run /verify-agent    │
              └───────────┬────────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
      ┌─────────┐   ┌─────────┐   ┌─────────┐
      │ PASS    │   │ FAIL    │   │ PARTIAL │
      └────┬────┘   └────┬────┘   └────┬────┘
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ PROCEED  │   │ CLASSIFY │   │ ASSESS   │
    │ to next  │   │ failure  │   │ severity │
    │ agent    │   └────┬─────┘   └────┬─────┘
    └──────────┘        │              │
                        ▼              ▼
            ┌───────────────────────────────┐
            │        FAILURE TYPE           │
            ├───────────────────────────────┤
            │ Test failure   → /recover     │
            │ Build broken   → /recover     │
            │ Scope violation → Escalate    │
            │ Quality issue  → Re-delegate  │
            │ Timeout        → Retry smaller│
            └───────────────────────────────┘
```

**Key rule:** Never proceed to the next agent until current agent is verified.

### Failure Triggers and Recovery

When something goes wrong, classify the failure and take the appropriate action:

| Failure Type | Trigger | Severity | Action |
|--------------|---------|----------|--------|
| **Test failure** | Any test fails after agent completes | HIGH | Run `/recover` immediately |
| **Build broken** | `npm run build` or typecheck fails | CRITICAL | Run `/recover` immediately |
| **Agent error** | Agent returns error or exception | MEDIUM | Run `/recover` |
| **Scope violation** | Agent modified files outside scope | HIGH | Document in BLOCKERS.md, escalate to user |
| **Timeout** | Agent exceeds reasonable time | MEDIUM | Retry with smaller scope |
| **Partial completion** | Agent completed <50% of task | MEDIUM | Retry (not recover—different from failure) |
| **Conflict** | Merge conflicts or file conflicts | MEDIUM | Run `/recover` |

**Severity meanings:**
- **CRITICAL**: Stop everything. Cannot proceed until resolved.
- **HIGH**: Immediate action required. Do not start next agent.
- **MEDIUM**: Address before proceeding but may not block entirely.

**Partial completion is NOT a failure** - retry with clearer scope rather than running recovery.

### Domain Agents (Technology-Specific)

Domain agents have **embedded knowledge** for specific technologies with AI training gaps. They supersede general agents for their technology area.

| Domain Agent | Technology | AI Confidence | Supersedes |
|--------------|------------|---------------|------------|
| `dev-nextjs-15` | Next.js 15 | Medium | `dev-frontend` (for routing, Server Components, Server Actions) |
| `dev-prisma-7` | Prisma 7 | Medium | `dev-migration`, `dev-database` |
| `dev-tailwind-v4` | Tailwind v4 | Low | `dev-frontend` (for styling) |

**Delegation Priority:**
1. **Check technology** - Is the task primarily Next.js, Prisma, or Tailwind?
2. **Use domain agent** - If yes, use the domain-specific agent
3. **Fall back to general** - For tasks spanning multiple technologies or general work

**Routing Examples:**

| Task | Agent |
|------|-------|
| Create a new page with dynamic params | `dev-nextjs-15` |
| Add Server Action for form submission | `dev-nextjs-15` |
| Create database migration | `dev-prisma-7` |
| Set up Prisma client | `dev-prisma-7` |
| Configure theme colors in CSS | `dev-tailwind-v4` |
| Build a complete feature (routing + DB + styling) | `dev-backend` + `dev-frontend` (general) |

**Shared Knowledge:**
Domain agents reference shared knowledge files in `.claude/agents/knowledge/`:
- `logging-pino.md` - Logging patterns (referenced by all domain agents)

**Context7 Integration:**
Domain agents for Low/Medium confidence technologies will prompt you to use Context7 when working with patterns that may have changed since AI training.

### The Four Agent Roles

Each technology has agents for different task types:

| Task Type | Agent Prefix | Purpose | Write Scope |
|-----------|--------------|---------|-------------|
| Building | `dev-` | Implement features, write code | Code (15 max) |
| Understanding | `explore-` | Research, find patterns | Reports only |
| Diagnosing | `debug-` | Trace errors, find root causes | Reports only |
| Reviewing | `audit-` | Pre-deploy checks, compliance | Reports only |

### Agent Selection Flow

1. **What task type?** → Determines role prefix
2. **What technology?** → Determines agent suffix

**Selection Examples:**

| Task | Agent | Why |
|------|-------|-----|
| "Add profile page" | `dev-nextjs-15` | Building - Next.js routing |
| "How does auth work?" | `explore-nextjs-15` | Understanding - research task |
| "Why won't form submit?" | `debug-prisma-7` | Diagnosing - database error |
| "Check patterns before deploy" | `audit-nextjs-15` | Reviewing - pattern compliance |

### Domain Agents by Technology

| Technology | dev | explore | debug | audit | Confidence |
|------------|-----|---------|-------|-------|------------|
| Next.js 15 | ✓ | ✓ | ✓ | ✓ | Medium |
| Prisma 7 | ✓ | ✓ | ✓ | ✓ | Medium |
| Tailwind v4 | ✓ | ✓ | ✓ | ✓ | Low |

**Example Workflow:**

```
Task: "The contact form isn't saving to database"

1. debug-prisma-7 → Diagnoses: "Constraint violation on email"
2. dev-prisma-7 → Implements fix
3. audit-prisma-7 → Verifies fix follows patterns
```

---

### Mandatory Delegation (Not Agent Creation)

**CRITICAL**: The orchestrator MUST delegate work—but agent creation mid-session has a limitation.

#### The Agent Creation Paradox

Custom agents created during a session **aren't available until session restart**. This creates two scenarios:

| Scenario | Action |
|----------|--------|
| **Current task** | MUST delegate via **fallback pattern** (customize a built-in agent) |
| **Future sessions** | SHOULD create agent file (optional but recommended for reuse) |

#### For the CURRENT Task

When no domain agent exists, delegate immediately using the **fallback pattern**:

1. Choose the right built-in agent (`general-purpose`, `Explore`, or `Bash`)
2. Customize via structured prompt (CONTEXT, TASK, CONSTRAINTS, OUTPUT)
3. Delegate using the Task tool

**Do NOT:**
- Create a new agent file and try to use it immediately (it won't work)
- Do the work directly because "no agent exists"
- Wait or ask the user whether to create an agent

See [Customizing Built-in Agents](#customizing-built-in-agents-fallback-pattern) for the prompt structure.

#### For FUTURE Sessions (Optional)

After completing the task with a customized built-in agent, consider creating a proper domain agent:

1. **Create the agent file** at `.claude/agents/{task-name}.md`
2. **Define scope**: Role, inputs, outputs, constraints
3. **Add role classification**: Research, Coding, Testing, or Review
4. **The agent will be available** in subsequent sessions

This is optional but recommended for tasks you'll repeat.

**The orchestrator's job is to COORDINATE, not to DO the work.**

---

## Context Management

**Problem:** Long contexts cause AI focus degradation. Accumulated information makes the AI lose track of what matters.

**Solution:** Role-based agent constraints and structured communication.

### Orchestrator Responsibilities (Minimal Context)

The main orchestrator should ONLY:
1. **Greet and classify** - Understand and classify user request (trivial vs non-trivial)
2. **Plan (non-trivial)** - Use EnterPlanMode tool for non-trivial tasks
3. **Think (trivial)** - Apply planning mindset even for trivial tasks (no formal plan mode)
4. **Declare management approach** - State HOW agents will be used
5. **Delegate to agents** - With clear scope and context
6. **Verify after each agent** - Run `/verify-agent` after every delegation
7. **Self-check periodically** - Run `/orchestrator-checkpoint` every 5 turns or 3 agents
8. **Review results** - Summarize and integrate
9. **Communicate** - Progress updates to user

**The orchestrator should NEVER:**
- Read more than 3-5 files directly (use Research agents)
- Write any code files directly (use Coding agents)
- Accumulate exploration context in main session

### Agent Role Classification

| Role | Purpose | Read Scope | Write Scope |
|------|---------|------------|-------------|
| **Research** | Explore, design, analyze | Broad (10+ files OK) | Documents only |
| **Coding** | Implement changes | Focused (15 files max) | Code files (15 max) |
| **Testing** | Write tests, verify | Implementation + patterns | Test files only |
| **Review** | Audit, review | Broad read | Reports only |

**Role assignments:**
- **Research:** dev-architect, dev-api, dev-database, dev-analyst
- **Coding:** dev-backend, dev-frontend, dev-migration, dev-integration, dev-data, dev-refactor, dev-docs, dev-deploy
- **Testing:** dev-test
- **Review:** dev-reviewer, dev-security, dev-ops

### "Need More Research" Protocol

When a Coding or Testing agent encounters a knowledge gap:

1. **STOP immediately** - Do not explore
2. **Return:** `RESEARCH_NEEDED: {specific question}`
3. **Orchestrator spawns:** Research agent with targeted question
4. **Agent resumes:** With the targeted answer

This prevents Coding agents from accumulating exploration context.

### Planning: Mindset vs Formal Plan Mode

There are TWO distinct concepts:

| Concept | What It Is | When Required |
|---------|------------|---------------|
| **Planning Mindset** | Think before acting: classify task, identify agents | ALWAYS (every prompt) |
| **Formal Plan Mode** | Use `EnterPlanMode` tool, create plan document | Non-trivial tasks only |

#### Planning Mindset (ALWAYS)

For EVERY user prompt, the orchestrator must:
1. Classify the task (trivial vs non-trivial)
2. Identify the task type (implement, research, debug, review)
3. Identify technologies involved
4. Select appropriate agent(s)
5. Declare the orchestrator approach (before delegating)

This mental discipline applies even to trivial tasks—you just don't use the formal EnterPlanMode tool.

#### Formal Plan Mode (Non-Trivial Tasks)

Use the `EnterPlanMode` tool when the task is **non-trivial**. This creates a plan document and requires user approval before proceeding.

**Non-trivial task indicators (ANY of these):**
- Multiple files affected
- Design decisions required
- Ambiguity in requirements
- More than 10 lines of change
- Agent delegation needed
- Multiple technologies involved

#### Trivial Task Criteria (ALL must be true)

A task is trivial ONLY if ALL of these are true:
- [ ] Single file affected
- [ ] User gave exact instructions (no ambiguity)
- [ ] No design decisions required
- [ ] Less than 10 lines changed
- [ ] No agent delegation needed (or single obvious agent)

**When in doubt, use formal plan mode.**

#### Why This Matters

AI training data has a cutoff date (May 2025). Package versions evolve faster than training data. This creates a **knowledge gap** between what the orchestrator knows and what current packages actually do.

**Domain agents solve this** by embedding version-specific patterns. The orchestrator's job is to identify and delegate to the right agents—not to implement directly with potentially stale knowledge.

**Planning ensures:**
1. Correct agent identification based on task and technology
2. Version-specific expertise applied to every code change
3. Knowledge gaps addressed by agents with embedded patterns
4. Proper handoffs between research, implementation, and review

### Orchestrator Management Declaration

**MANDATORY**: When entering plan mode, explicitly state HOW you will manage agents.

**Declaration Format:**
```
ORCHESTRATOR APPROACH:
- Task: [one-line summary]
- Task type: [implement / research / debug / review]
- Technologies: [list technologies involved]
- Agents needed: [select from .claude/agents/ - check roster.md for guidance]
- Sequence: [sequential / parallel / single agent]
- My role: [coordinate, delegate, review - NOT implement]
```

**Example:**
```
ORCHESTRATOR APPROACH:
- Task: Add feeding log feature
- Task type: implement
- Technologies: Next.js, Prisma, React
- Agents needed: dev-nextjs-15 → dev-prisma-7 → dev-test
- Sequence: Sequential - API route, database, frontend, test
- My role: Coordinate handoffs, review outputs, report to user
```

### Long Task Self-Reminder Protocol

**Problem**: During long tasks, orchestrators can "forget" their role and start doing work directly.

**Honest limitation:** This is a manual discipline. A context-degraded orchestrator is least likely to remember to self-check. These mechanisms reduce friction but require conscious effort.

#### Micro-Checkpoint (3 seconds)

At the START of any complex response, pause and affirm:

> "I am the orchestrator. My next action should be delegation, not implementation."

This takes 3 seconds and prevents drift before it starts.

#### Turn-Based Checkpoints

Run `/orchestrator-checkpoint` at these intervals (whichever comes first):
- Every **5 turns** (user prompts)
- Every **3 agent delegations**

**Tracking suggestion:** Mentally count turns: "This is turn 4 since last checkpoint."

#### Self-Reminder Triggers

In addition to turn-based checkpoints, run `/orchestrator-checkpoint` when:
- After delegating to 3+ agents in a session
- After any agent returns results requiring further work
- When about to read >3 files directly
- When about to write any file directly

#### Self-Reminder Checklist

| Question | If YES |
|----------|--------|
| Am I about to read >3 files? | STOP → Delegate to Research agent |
| Am I about to write code? | STOP → Delegate to Coding agent |
| Did an agent just finish? | Run `/verify-agent`, then delegate next step |
| Have I completed 3+ agents? | Run `/orchestrator-checkpoint` |

#### Recovery Pattern

If you've started doing work directly:
1. STOP current work immediately
2. State: "I should delegate this rather than do it directly."
3. Identify appropriate agent (or use fallback pattern)
4. Delegate remaining work with clear scope
5. Return to coordination role

**Key Principle:**
> "The orchestrator's job is to COORDINATE, not to DO the work."

---

## Agent Coordination

**Critical constraint:** Agents cannot spawn other agents. Only the orchestrator delegates.

### Scope Limits

Limit work delegated to each agent to prevent context overflow and ensure quality:

| Agent Type | Max Output | Rationale |
|------------|------------|-----------|
| Design agents (`dev-architect`, `dev-api`) | 1-2 documents | Single design output |
| Implementation agents (`dev-backend`, `dev-frontend`) | ~15-20 files per run | Beyond this, batch into multiple runs |
| Review agents (`dev-reviewer`, `dev-security`) | 1 report | Single review output |
| Test agents (`dev-test`) | ~10-15 test files | Focus on one module at a time |

**When an agent would create/modify >20 files:**
1. Have the agent work in batches by module/concern
2. Run the agent multiple times with different scopes
3. Example: "Implement ReptileService first, then FeedingService"

### Parallel vs Sequential Execution

**Run SEQUENTIALLY when:**
- One agent's output is another's input (design -> implement -> test)
- Agents modify the same files or modules
- User approval is needed between steps

**Can run in PARALLEL when:**
- Agents operate on completely separate modules
- No file overlap exists
- Both agents are read-only (exploration, review)

---

## Development Practices

**CRITICAL:** This project follows **Test-Driven Development (TDD)**, **SDLC best practices**, and strict **modularity guidelines**.

### Test-Driven Development (TDD)

**YOU MUST** follow TDD for all new features and bug fixes. NEVER write implementation code without tests first.

```
1. RED     |  Write a failing test that defines behavior
2. GREEN   |  Write minimum code to make the test pass
3. REFACTOR|  Improve code while keeping tests green
4. REPEAT  |  Continue until feature is complete
```

**Test File Location:**
Tests are colocated with source files:
```
src/services/ReptileService.ts
src/services/ReptileService.test.ts    # Colocated test
```

### Software Development Lifecycle (SDLC)

Features follow a structured lifecycle with quality gates:

```
REQUIREMENTS -> DESIGN -> TDD DEVELOP -> INTEGRATE -> REVIEW -> DEPLOY
```

**Phase Responsibilities:**

| Phase | Agent | Deliverable |
|-------|-------|-------------|
| Requirements | Orchestrator | Clear acceptance criteria |
| Design | `dev-api`, `dev-migration` | API contracts, database schema |
| TDD Develop | `dev-backend`, `dev-frontend`, `dev-test` | Tested implementation |
| Integrate | `dev-test` | Passing test suite |
| Review | `dev-reviewer`, `dev-security`, `dev-refactor` | Approved, clean code |
| Deploy | `dev-deploy` | CI/CD, environments, release |

### Modularity Guidelines

Code must be **modular**, **focused**, and **maintainable**.

**Single Responsibility Principle:**
- Each file has ONE clear purpose
- Each function does ONE thing
- Each module handles ONE domain

**Layer Separation:**
```
Controller    <- HTTP request/response only
Service       <- Business logic, validation
Repository    <- Database queries only
Database      <- Data storage
```

### File Size Limits

Files must be **small** and **focused**. Large files are hard to understand, test, and maintain.

| File Type | Max Lines | Action if Exceeded |
|-----------|-----------|-------------------|
| Component | 150 lines | Extract sub-components |
| Service | 200 lines | Split into focused services |
| Controller | 150 lines | Extract to multiple controllers |
| Repository | 150 lines | Split by entity/operation type |
| Test file | 300 lines | Split by describe blocks |
| Types file | 100 lines | Split by domain |

---

## Documentation Structure

### Planning & Status Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Tech Stack | `.claude/tech/stack.md` | **Current versions and patterns** |
| Project Status | `.claude/PROJECT_STATUS.md` | **Read first** - Current sprint, priorities |
| Blockers | `.claude/BLOCKERS.md` | Active blockers and issues |
| Process Log | `.claude/PROCESS_LOG.md` | Retrospectives, metrics |
| Learnings | `.claude/LEARNINGS.md` | Accumulated insights (auto-maintained) |
| Requirements | `.claude/REQUIREMENTS.md` | Captured specifications |
| Changelog | `CHANGELOG.md` | Release history |
| ADRs | `docs/DECISIONS/` | Architecture Decision Records |
| TDDs | `docs/DESIGNS/` | Technical Design Documents |
| RFCs | `docs/RFCS/` | Feature proposals |

### Knowledge Capture

Use the `/capture` skill to save important discoveries:

```
/capture
Knowledge: {What was learned}
Category: tech | preference | practice | spec
```

**Agents should proactively capture** when they discover:
- Tech gotchas (version-specific patterns) -> updates `tech/stack.md`
- User preferences (code style, choices) -> updates `CLAUDE.md`
- Best practices (patterns that work) -> updates `LEARNINGS.md`
- Specifications (requirements clarified) -> updates `REQUIREMENTS.md`

The skill edits files intelligently (no blind appending).

### Tech Stack Revalidation

Use the `/tech-revalidate` skill when:
- Starting work after a long break
- After upgrading dependencies (`npm update`)
- Claude's training may have been updated
- AI suggests outdated patterns

```
/tech-revalidate
```

### Session Continuity Protocol

**Starting a new session:**
1. Read `.claude/PROJECT_STATUS.md` first
2. Check `.claude/tech/stack.md` for current versions
3. Check `.claude/BLOCKERS.md` for blocking issues
4. Review current sprint tasks
5. Pick up where last session left off

**Starting after a long break (>7 days) or after dependency upgrades:**
1. Run `/tech-revalidate` to check for AI knowledge drift
2. Review any updated gotchas in `.claude/tech/stack.md`
3. Continue with normal session start

**Ending a session:**
1. Update task statuses in `PROJECT_STATUS.md`
2. Document new blockers in `BLOCKERS.md`
3. Update `CHANGELOG.md` if features completed
4. Commit with descriptive message

---

## Code Quality Checklist

**CRITICAL:** Before marking any task complete, verify ALL of the following:

```markdown
## TDD
- [ ] Tests written BEFORE implementation
- [ ] All tests pass
- [ ] Edge cases covered
- [ ] Test file colocated with source

## Modularity
- [ ] Single responsibility maintained
- [ ] Layers properly separated
- [ ] No circular dependencies
- [ ] Clear public API (index exports)

## File Size
- [ ] No file exceeds size limits
- [ ] Large files split appropriately
- [ ] Functions are focused (<30 lines ideal)

## Patterns
- [ ] Follows existing codebase patterns
- [ ] Uses versions from .claude/tech/stack.md
- [ ] Type safety maintained
- [ ] Error handling complete
- [ ] CLAUDE.md conventions followed
```

---

## Project-Specific Conventions

### Reptile Domain

- **Species Configuration**: Use `src/lib/species/defaults.ts` for built-in species parameters
- **Soft Deletes**: All user data uses `deletedAt` field, never hard delete
- **Event Sourcing**: Care logs (feedings, sheds, weights) are append-only
- **Optimistic Updates**: Update local state immediately, sync in background

### Offline-First Patterns

- **Dexie Database**: `src/lib/offline/db.ts` - IndexedDB schema mirroring Prisma
- **Sync Queue**: `src/lib/offline/queue.ts` - Pending changes queue
- **Background Sync**: Retry with exponential backoff (1s, 2s, 4s, 8s, max 60s)
- **Conflict Resolution**: Server wins (last-write-wins)

### Photo Management

- **Storage**: Supabase Storage with user-scoped buckets
- **Thumbnails**: Generated server-side via sharp
- **Offline Cache**: Recently viewed photos cached in IndexedDB

### File Organization

- Feature routes in `app/(app)/` directory with nested dynamic segments
- Components grouped by domain (`reptiles/`, `events/`, `charts/`, `photos/`)
- Business logic in `src/services/` layer, not in components
- Offline logic isolated in `src/lib/offline/`

### Naming Conventions

- Components: PascalCase (`ReptileCard.tsx`)
- Hooks: camelCase with `use` prefix (`useReptiles.ts`)
- Services: camelCase with `.service.ts` suffix
- Types: PascalCase, exported from `src/types/`
- Database enums: SCREAMING_SNAKE_CASE

---

## Development Commands

See @.claude/tech/stack.md for current installation and development commands.

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma studio    # Open Prisma Studio

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# PWA
npm run build        # PWA assets generated during build
```

---

## Key Files & Locations

| Purpose | Location |
|---------|----------|
| App entry | `src/app/layout.tsx` |
| Main pages | `src/app/(app)/` |
| Auth pages | `src/app/(auth)/` |
| API routes | `src/app/api/` |
| Components | `src/components/` |
| Services | `src/services/` |
| Database client | `src/lib/db/client.ts` |
| Offline DB | `src/lib/offline/db.ts` |
| Supabase client | `src/lib/supabase/` |
| Logger | `src/lib/logger.ts` |
| Species config | `src/lib/species/` |
| Prisma schema | `prisma/schema.prisma` |
| Prisma config | `prisma.config.ts` |
| Tailwind styles | `src/app/app.css` |
| PWA manifest | `public/manifest.json` |

---

## Audit Trail System

This project includes an audit trail system for tracking activity and analyzing orchestrator compliance.

### /analyze-task - Task-Level Compliance Analysis

Analyze orchestrator compliance at the **task level** rather than session level. A task may span multiple sessions (planning in one, execution in another).

```bash
node .claude/scripts/analyze-task.mjs                    # Analyze most recent task
node .claude/scripts/analyze-task.mjs --slug <slug>      # Analyze task by slug
node .claude/scripts/analyze-task.mjs --session <id>     # Find and analyze task containing session
node .claude/scripts/analyze-task.mjs --list             # List all tasks
node .claude/scripts/analyze-task.mjs --timeline         # Show task timeline
node .claude/scripts/analyze-task.mjs --batch            # Analyze all tasks
```

**Why task-level analysis?**

Session-level analysis (`/analyze-orchestrator`) can produce false violations when:
- Planning happens in session A, execution in session B
- User accepts plan (context clears for execution session)
- Multi-session workflows are used intentionally

Task-level analysis groups related sessions and evaluates compliance across the full task lifecycle.

**Task linkage signals:**

| Signal | Reliability | Description |
|--------|-------------|-------------|
| Slug match | High | Same slug across sessions |
| Plan content | Very High | `planContent` field in execution session |
| Transcript reference | High | Execution session references planning transcript |
| Timing proximity | Medium | Sessions within 5 minutes |

**Example:**

```bash
# Session-level (may show false positive)
node .claude/scripts/analyze-session.mjs c497b649
# "No plan mode" VIOLATION

# Task-level (correct)
node .claude/scripts/analyze-task.mjs --session c497b649
# Task links to planning session, plan mode passes
```

**Output:** Reports saved to `.claude/audit/analysis/task-{slug}.md`

---

*Generated by Project Builder on 2026-01-31*
