# Agent Roster: Snakey

Select the right agent for the task. Agents are defined in `.claude/agents/`.

---

## Domain Agents (Technology-Specific)

Domain agents have **embedded knowledge** for specific technologies where AI training may be outdated. **Use these FIRST** when working with their technology.

### The Four Agent Roles

Each technology has agents for different task types:

| Role | Prefix | Purpose | Tools | Write Scope |
|------|--------|---------|-------|-------------|
| Implementation | `dev-` | Build features, write code | Read, Grep, Edit, Write, Bash | Code (15 max) |
| Research | `explore-` | Investigate, understand | Read, Grep, Glob, WebFetch, WebSearch | Reports only |
| Debugging | `debug-` | Diagnose issues | Read, Grep, Glob, Bash | Reports only |
| Review | `audit-` | Code review, compliance | Read, Grep, Glob | Reports only |

### Domain Agents by Technology

| Technology | dev | explore | debug | audit | Confidence | Context7 |
|------------|-----|---------|-------|-------|------------|----------|
| Next.js 15 | ✓ | ✓ | ✓ | ✓ | Medium | Yes |
| Prisma 7 | ✓ | ✓ | ✓ | ✓ | Medium | Yes |
| Tailwind v4 | ✓ | ✓ | ✓ | ✓ | Low | Yes |

### Agent Selection Flow

```
1. What task type?
   ├── Building features → dev-{tech}
   ├── Research/understanding → explore-{tech}
   ├── Debugging issues → debug-{tech}
   └── Review/audit → audit-{tech}

2. What technology?
   ├── Next.js (routing, components, actions) → *-nextjs-15
   ├── Prisma (database, schema, queries) → *-prisma-7
   └── Tailwind (styling, theme) → *-tailwind-v4
```

### Research Task Decision Tree

Three concepts can cause confusion: the built-in `Explore` agent, custom `explore-*` agents, and the "Research" role. Use this decision tree:

```
Need to research/explore/understand something?
│
├─ Quick and simple? (pattern search, <5 files, simple question)
│  └─→ Built-in Explore agent
│       (Fast Haiku model, read-only, no domain knowledge)
│
├─ Technology-specific investigation?
│  ├─→ explore-{tech} agent exists?
│  │   └─ YES → Use explore-{tech}
│  │            (Has embedded patterns and gotchas)
│  │
│  └─→ NO → Customize Explore via prompt
│           (Add CONTEXT section with tech-specific knowledge)
│
├─ Diagnosing an error or bug?
│  ├─→ debug-{tech} agent exists?
│  │   └─ YES → Use debug-{tech}
│  │
│  └─→ NO → Customize Explore or general-purpose
│
└─ Need to understand architecture or patterns?
   ├─→ explore-{tech} exists?
   │   └─ YES → Use it
   │
   └─→ NO → Built-in Explore with @file references
```

**Key distinctions:**

| Agent Type | Domain Knowledge | Speed | Use When |
|------------|------------------|-------|----------|
| Built-in `Explore` | None | Fast (Haiku) | Simple searches, quick questions |
| Custom `explore-*` | Yes (embedded) | Normal | Technology-specific investigation |
| Custom `debug-*` | Yes (embedded) | Normal | Error diagnosis, tracing issues |
| Custom `audit-*` | Yes (embedded) | Normal | Pattern compliance review |

**Example decisions for Snakey:**

| Task | Use This | Why |
|------|----------|-----|
| "Find all uses of reptileId" | Explore | Simple grep, no domain knowledge needed |
| "How does offline sync work?" | explore-nextjs-15 | Needs Next.js + Serwist knowledge |
| "Why is Prisma throwing this error?" | debug-prisma-7 | Needs Prisma error patterns |
| "Does this code follow our patterns?" | audit-nextjs-15 | Pattern compliance check |

### Quick Reference

| User Request | Agent |
|--------------|-------|
| "Add a profile page" | `dev-nextjs-15` |
| "How does authentication work here?" | `explore-nextjs-15` |
| "Why is the form not saving?" | `debug-prisma-7` |
| "Review the API for patterns" | `audit-nextjs-15` |
| "Create database migration" | `dev-prisma-7` |
| "Find all N+1 queries" | `explore-prisma-7` |
| "Why are styles missing?" | `debug-tailwind-v4` |
| "Check v4 migration completeness" | `audit-tailwind-v4` |

### Supersession Rules

Domain agents **supersede** general agents for their specific technology:

| When Task Involves | Use This | Instead Of |
|--------------------|----------|------------|
| Next.js 15 async params, Server Actions | `dev-nextjs-15` | `dev-frontend` |
| Prisma 7 config, adapters, migrations | `dev-prisma-7` | `dev-migration` |
| Tailwind v4 @theme, CSS-first config | `dev-tailwind-v4` | `dev-frontend` |

### Shared Knowledge

All domain agents reference shared knowledge files in `.claude/agents/knowledge/`:

| Knowledge File | Technology | Referenced By |
|----------------|------------|---------------|
| `nextjs-15.md` | Next.js 15 | dev, explore, debug, audit |
| `prisma-7.md` | Prisma 7 | dev, explore, debug, audit |
| `tailwind-4.md` | Tailwind v4 | dev, explore, debug, audit |
| `logging-pino.md` | Cross-cutting | All domain agents |

### When to Use General Agents Instead

Use general agents (`dev-backend`, `dev-frontend`, `dev-test`) when:
- Task spans multiple technologies equally
- Task is about business logic, not framework-specific patterns
- Domain agent returns `RESEARCH_NEEDED` for cross-cutting concerns

### Fallback: No Domain Agent Exists

When no domain agent exists for a technology, **customize a built-in agent via the prompt** instead of working directly.

**IMPORTANT:** Custom agents created during a session aren't available until session restart. Don't create new agent files mid-task - instead, provide context through the prompt.

**Built-in agent selection:**

| Task Type | Agent | Use When |
|-----------|-------|----------|
| Research/investigate | `Explore` | Understanding code, finding patterns |
| Multi-step implementation | `general-purpose` | Building features, code changes |
| Run commands | `Bash` | Terminal operations |

**Effective prompt structure:**

```
Use {agent-type} agent to {task summary}.

CONTEXT:
- {Technology/patterns being used}
- {Reference files with @path notation}
- {Key conventions or constraints}

TASK:
- {Specific work to accomplish}
- {Expected changes}

CONSTRAINTS:
- {What NOT to modify}
- {Patterns to follow}

OUTPUT:
- {What to return to orchestrator}
- {Verification steps}
```

**Example - Adding Stripe integration (no domain agent):**

```
Use general-purpose agent to add Stripe payment processing.

CONTEXT:
- This project uses Next.js 15 with App Router
- API patterns in @src/app/api/
- Environment variables documented in @.env.example
- Use logger from @src/lib/logger.ts

TASK:
- Create Stripe checkout session endpoint
- Add webhook handler for payment events
- Follow existing API route patterns

CONSTRAINTS:
- Don't modify existing payment code if any
- Use server-only for Stripe secret key
- Add new env vars to .env.example

OUTPUT:
- List of created/modified files
- Env vars that need to be set
- Test the endpoint works
```

The prompt becomes a **temporary agent definition** providing the context that a custom agent would embed.

---

## Agent Role Classification

Agents are classified by their role to enforce context discipline:

| Role | Read Scope | Write Scope | Context Behavior |
|------|------------|-------------|------------------|
| **Research** | Broad (10+ files) | Documents only | CAN explore broadly |
| **Coding** | Focused (15 max) | Code files (15 max) | MUST stay focused, request research if stuck |
| **Testing** | Implementation + patterns | Test files only | MUST stay focused on test scope |
| **Review** | Broad read | Reports only | Read-only analysis |

## Implementation Agents (Coding Role)

| Agent | When to Use | Scope | Max Files | Notes |
|-------|-------------|-------|-----------|-------|
| `dev-backend` | Controllers, services, repositories, API endpoints | Backend source | 15 | General backend logic |
| `dev-frontend` | Components, hooks, pages, forms, styling | Frontend source | 15 | *Superseded by domain agents for Next.js/Tailwind* |
| `dev-migration` | CREATE/ALTER TABLE, foreign keys, data model | Migrations | 10 | *Superseded by `dev-prisma-7`* |
| `dev-integration` | OAuth 2.0, third-party APIs, webhooks | Integrations | 15 | |
| `dev-data` | ETL, data transformation, sync, import/export | Data services | 15 | |
| `dev-refactor` | Split large files, extract patterns | Structure | 15 | |
| `dev-docs` | Documentation, API docs, README | Documentation | 10 | |
| `dev-deploy` | Build config, CI/CD, deployment scripts | DevOps | 10 | |

## Testing Agent (Testing Role)

| Agent | When to Use | Scope | Max Files |
|-------|-------------|-------|-----------|
| `dev-test` | Writing tests, fixing failures, TDD red phase | Test files | 15 |

## Design & Architecture Agents (Research Role)

| Agent | When to Use | Output |
|-------|-------------|--------|
| `dev-designer` | App Design Phase - features, pages, user flows, components | Design documents |
| `dev-architect` | System architecture, module boundaries, ADRs | Design documents |
| `dev-api` | REST endpoint design, validation schemas, API contracts | API specifications |
| `dev-database` | Query optimization, EXPLAIN analysis, data modeling | Analysis reports |
| `dev-analyst` | Analyze plan vs results, extract learnings | Process reports |

## Quality & Review Agents (Review Role)

| Agent | When to Use | Focus |
|-------|-------------|-------|
| `dev-reviewer` | Code review, pattern compliance, pre-merge | Quality analysis |
| `dev-security` | Security audits, OWASP checks, auth review | Security report |
| `dev-ops` | Infrastructure review, operational concerns | Ops analysis |

## Auditor Agents (Review Role)

Specialized review agents for comprehensive audits. All auditors are **read-only** - they report issues but never modify code.

| Agent | When to Use | Focus Area | Checklist |
|-------|-------------|------------|-----------|
| `dev-auditor-performance` | Pre-deploy, after major features | N+1 queries, bundle size, renders, caching | `performance-review.md` |
| `dev-auditor-accessibility` | UI changes, pre-launch | WCAG 2.1 AA, keyboard nav, screen readers | `accessibility-review.md` |
| `dev-auditor-architecture` | Major refactors, new modules | Layer violations, coupling, boundaries | `architecture-review.md` |
| `dev-auditor-testing` | Coverage review, test quality | Gaps, flaky tests, edge cases | - |
| `dev-auditor-api` | New endpoints, API changes | REST conventions, consistency, status codes | `api-review.md` |
| `dev-auditor-docs` | Pre-release, onboarding review | README, API docs, code comments | - |
| `dev-auditor-dependencies` | Monthly, pre-deploy | CVEs, licenses, outdated, bloat | - |
| `dev-auditor-errors` | Post-incident, error UX review | Boundaries, messages, logging | - |
| `dev-auditor-responsive` | UI changes, mobile testing | Mobile-first CSS, touch targets, breakpoints | `responsive-review.md` |

### When to Use Auditors

**Pre-deployment review:**
```
dev-auditor-dependencies -> dev-auditor-security -> dev-auditor-performance
```

**Accessibility sprint:**
```
dev-auditor-accessibility -> [fix issues with dev-frontend] -> dev-auditor-accessibility (verify)
```

**Architecture health check:**
```
dev-auditor-architecture -> dev-auditor-testing -> [create remediation plan]
```

## SDLC Phase Mapping

```
APP DESIGN       ->  DESIGN           ->  TDD DEVELOP      ->  INTEGRATE  ->  REVIEW          ->  AUDIT           ->  DEPLOY
dev-designer        dev-architect       dev-test            dev-test      dev-reviewer       dev-auditor-*      dev-deploy
                    dev-api             dev-backend                       dev-security                          dev-docs
                    dev-migration       dev-frontend                      dev-refactor
                                        dev-integration
                                        dev-data
```

## TDD Workflow

The **main orchestrator** spawns agents in sequence (agents cannot spawn other agents):

```
1. dev-test     -> Write failing tests (RED)
2. dev-backend  -> Implement to pass (GREEN)
   dev-frontend
3. dev-test     -> Verify all pass
4. dev-refactor -> Improve structure (REFACTOR)
5. dev-reviewer -> Review quality
6. dev-analyst  -> Review plan vs results (optional)
7. Commit
```

## Agent Selection Quick Reference

**Building a feature?**
1. `dev-api` -> Design the API contract
2. `dev-migration` -> Create database schema
3. `dev-test` -> Write failing tests
4. `dev-backend` / `dev-frontend` -> Implement
5. `dev-reviewer` -> Review before merge

**Fixing a bug?**
1. `dev-test` -> Write test that reproduces bug
2. `dev-backend` / `dev-frontend` -> Fix it
3. `dev-test` -> Verify fix

**Integrating external API?**
1. `dev-integration` -> OAuth, API client
2. `dev-data` -> Sync/transform data
3. `dev-test` -> Test integration

**Performance issue?**
1. `dev-database` -> Query optimization
2. `dev-refactor` -> Code structure

**Pre-deployment?**
1. `dev-security` -> Security audit
2. `dev-reviewer` -> Final review
3. `dev-deploy` -> Deployment config

---

## Skills

Skills are reusable workflows that can be invoked by users or agents.

| Skill | Purpose | Who Can Invoke |
|-------|---------|----------------|
| `/app-design` | Guide through App Design Phase - features, pages, user flows | Users |
| `/capture` | Save important knowledge (tech gotchas, preferences, patterns) | Users and agents |
| `/tech-revalidate` | Check for AI knowledge drift and update validation | Users |
| `/commit` | Safe commit with secret scanning | Before any git commit |
| `/orchestrator-checkpoint` | Self-reminder for orchestrator role during long sessions | Orchestrator |
| `/verify-agent` | **MANDATORY** verification after every agent delegation | Orchestrator |
| `/recover` | Structured error recovery when agents fail or tests break | Orchestrator |
| `/parallel-check` | Pre-flight safety check before running agents in parallel | Orchestrator |
| `/audit-decision` | Record significant decisions with alternatives and rationale | Users |
| `/audit-summary` | Analyze session logs and generate summary report | Users |
| `/analyze-orchestrator` | Analyze sessions for orchestrator pattern compliance | Users |
| `/analyze-task` | Task-level compliance analysis (cross-session) | Users |

---

## MCP Servers (External Tools)

MCP (Model Context Protocol) servers provide live access to external tools and data.

| Server | Purpose | Trigger |
|--------|---------|---------|
| `context7` | Fetch current documentation for libraries | Say "use context7" in prompts |

### Using Context7

When working with libraries that have known AI training gaps (see `.claude/tech/stack.md`), use Context7 to fetch current documentation:

**In prompts:**
```
use context7 for Next.js routing
use context7 for Prisma client setup
use context7 for Tailwind v4 config
```

**When to use:**
- Library version is newer than AI training cutoff
- AI suggests deprecated or non-existent APIs
- Working with fast-moving frameworks (Next.js, Tailwind, Prisma)
- Confidence level in stack.md is Medium or Low
- Context7 column shows Yes in stack.md

**Supported libraries:** https://context7.com

**Note:** Requires Node.js >= 18.0.0 and MCP client support.

### Using /tech-revalidate

Run this skill when:
- Starting work after a long break (>7 days)
- After upgrading dependencies
- Claude's training cutoff may have changed
- AI suggests outdated patterns

```
/tech-revalidate
```

### Using /capture

When you or an agent discovers something important to remember:

```
/capture
Knowledge: {What was learned}
Category: tech | preference | practice | spec
Target: @{optional file path}
```

### Using /app-design

Run the App Design Phase before implementing a new project or major feature:

```
/app-design
```

This guides you through:
1. **Feature discovery** - User goals and acceptance criteria
2. **Page inventory** - Complete list of pages/screens
3. **User flows** - How users navigate key workflows
4. **Component hierarchy** - UI building blocks
5. **Data requirements** - What each component needs
6. **Implementation priority** - What to build first

**Output:** `.claude/design/app-design.md` - Blueprint for implementation agents

### Using /audit-decision

Record significant decisions with alternatives and rationale:

```
/audit-decision
```

Creates a permanent record in `.claude/audit/decisions/` that documents:
- What decision was made
- Alternatives considered (with pros/cons)
- Why this choice was made
- Constraints that influenced the decision

**When to use:**
- Technology choices
- Architecture decisions
- Trade-off resolutions
- Changing previous decisions

### Using /audit-summary

Analyze session logs and generate insights:

```
/audit-summary
```

Creates a report showing:
- Agent delegation patterns
- Failure frequency by type
- Recommendations for improvement

**Modes:**
- Default: Full summary
- "quick": Top 3 patterns only
- "debug": Focus on failures

### Using /analyze-orchestrator

Analyze session transcripts for orchestrator pattern compliance:

```bash
/analyze-orchestrator              # Analyze most recent session
/analyze-orchestrator --batch      # Analyze all sessions
/analyze-orchestrator --list       # List available sessions
```

**Rules evaluated:**
- Plan mode usage for non-trivial tasks
- Agent delegation (vs. direct work)
- File read limits (≤3 in main context)
- No direct code writes in main context
- Explore agent usage for >5 reads
- Batch file limits (≤20 per delegation)

**Output:** Reports saved to `.claude/audit/analysis/`

### Using /analyze-task

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

Session-level analysis can produce false violations when:
- Planning happens in session A, execution in session B
- User accepts plan (context clears for execution session)
- Multi-session workflows are used intentionally

**Task linkage signals:**

| Signal | Reliability | Description |
|--------|-------------|-------------|
| Slug match | High | Same slug across sessions |
| Plan content | Very High | `planContent` field in execution session |
| Transcript reference | High | Execution session references planning transcript |
| Timing proximity | Medium | Sessions within 5 minutes |

**Output:** Reports saved to `.claude/audit/analysis/task-{slug}.md`

---

## "Need More Research" Protocol

When a Coding or Testing agent encounters a knowledge gap:

```
Coding/Testing Agent encounters gap
    |
    |-> STOP immediately (do not explore)
    |-> Return: RESEARCH_NEEDED: {specific question}
    |
    v
Orchestrator receives request
    |
    |-> Spawn Research agent (dev-architect, dev-api, or dev-database)
    |
    v
Research Agent
    |
    |-> Answer specific question only
    |-> Return focused answer
    |
    v
Coding/Testing Agent resumes
    |
    --> Continue with targeted answer only
```

**Why this matters:** Prevents Coding agents from accumulating exploration context.

---

## Agent Coordination Rules

**Critical constraint:** Agents cannot spawn sub-agents. Only the orchestrator can delegate.

### Scope Limits per Agent

| Agent Type | Max Files | Max Scope | When to Batch |
|------------|-----------|-----------|---------------|
| Design (`dev-architect`, `dev-api`) | 1-2 | Single document | Never - focused output |
| Implementation (`dev-backend`, `dev-frontend`) | 15-20 | One module/feature | >20 files or multiple modules |
| Test (`dev-test`) | 10-15 | One module | >15 test files |
| Review (`dev-reviewer`, `dev-security`) | 1 | Report per review | Never - single report |
| Migration (`dev-migration`) | 5-10 | Related tables | >10 migrations |

### Parallel Execution Matrix

**Legend:** safe | conditional | never

| Agent A / B -> | backend | frontend | test | reviewer | security | migration |
|----------------|---------|----------|------|----------|----------|-----------|
| **backend** | never | conditional | never | safe | safe | never |
| **frontend** | conditional | never | never | safe | safe | safe |
| **test** | never | never | never | never | never | never |
| **reviewer** | safe | safe | never | never | safe | safe |
| **security** | safe | safe | never | safe | never | safe |
| **migration** | never | safe | never | safe | safe | never |

**Notes:**
- **reviewer + security**: Both read-only, different focus
- **auditor-* + auditor-***: All auditors can run in parallel (read-only)
- **backend + frontend**: Only if completely separate modules
- **test + anything**: Tests depend on implementation being stable
- **Same agent twice**: Never run same agent in parallel

---

## Mandatory Delegation Rules

**The orchestrator MUST delegate work—it must NOT do work directly.**

| If Task Requires... | Action |
|---------------------|--------|
| Reading >3 files | Delegate to Research agent (or fallback) |
| Writing any code files | Delegate to Coding agent (or fallback) |
| Analyzing code | Delegate to analyzer agent (or fallback) |
| Any specialized work | Delegate to appropriate agent |

### The Agent Creation Paradox

Custom agents created mid-session **won't be available until session restart**. This creates two scenarios:

| Scenario | Action |
|----------|--------|
| **Current task** | MUST use fallback pattern (customize built-in agent) |
| **Future sessions** | SHOULD create agent file (optional, for reuse) |

### When No Agent Exists

**For the current task:**
1. Choose the right built-in agent (`Explore`, `general-purpose`, or `Bash`)
2. Customize via structured prompt (CONTEXT, TASK, CONSTRAINTS, OUTPUT)
3. Delegate immediately using the Task tool

See [Fallback: No Domain Agent Exists](#fallback-no-domain-agent-exists) for the prompt structure.

**For future sessions (optional):**
1. After completing the task, create `.claude/agents/{task-name}.md`
2. Define the role (Research, Coding, Testing, or Review)
3. Specify constraints (file limits, scope boundaries)
4. The agent will be available in subsequent sessions

### Anti-Pattern: Direct Work

The orchestrator should NEVER:
- Read 10+ files to "understand" the codebase (delegate to Research agent)
- Edit ANY code files directly (delegate to Coding agent)
- Say "there's no agent for this" and do it directly (USE FALLBACK PATTERN)
- Create an agent file and try to use it immediately (WON'T WORK)
- Delay the task to discuss agent creation strategy

---

**Note:** Use `.claude/templates/plan.md` and `.claude/templates/results.md` to structure work.
