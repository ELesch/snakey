# Agent Roster: Snakey

Select the right agent for the task. Agents are defined in `.claude/agents/`.

## Agent Role Classification

Agents are classified by their role to enforce context discipline:

| Role | Read Scope | Write Scope | Context Behavior |
|------|------------|-------------|------------------|
| **Research** | Broad (10+ files) | Documents only | CAN explore broadly |
| **Coding** | Focused (15 max) | Code files (15 max) | MUST stay focused, request research if stuck |
| **Testing** | Implementation + patterns | Test files only | MUST stay focused on test scope |
| **Review** | Broad read | Reports only | Read-only analysis |

## Implementation Agents (Coding Role)

| Agent | When to Use | Scope | Max Files |
|-------|-------------|-------|-----------|
| `dev-backend` | Controllers, services, repositories, API endpoints | Backend source | 15 |
| `dev-frontend` | Components, hooks, pages, forms, styling | Frontend source | 15 |
| `dev-migration` | CREATE/ALTER TABLE, foreign keys, data model | Migrations | 10 |
| `dev-integration` | OAuth 2.0, third-party APIs, webhooks | Integrations | 15 |
| `dev-data` | ETL, data transformation, sync, import/export | Data services | 15 |
| `dev-refactor` | Split large files, extract patterns | Structure | 15 |
| `dev-docs` | Documentation, API docs, README | Documentation | 10 |
| `dev-deploy` | Build config, CI/CD, deployment scripts | DevOps | 10 |

## Testing Agent (Testing Role)

| Agent | When to Use | Scope | Max Files |
|-------|-------------|-------|-----------|
| `dev-test` | Writing tests, fixing failures, TDD red phase | Test files | 15 |

## Design & Architecture Agents (Research Role)

| Agent | When to Use | Output |
|-------|-------------|--------|
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
DESIGN           ->  TDD DEVELOP      ->  INTEGRATE  ->  REVIEW          ->  AUDIT           ->  DEPLOY
dev-architect       dev-test            dev-test      dev-reviewer       dev-auditor-*      dev-deploy
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
| `/capture` | Save important knowledge (tech gotchas, preferences, patterns) | Users and agents |
| `/tech-revalidate` | Check for AI knowledge drift and update validation | Users |
| `/commit` | Safe commit with secret scanning | Before any git commit |
| `/orchestrator-checkpoint` | Self-reminder for orchestrator role during long sessions | Orchestrator |

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

## Mandatory Agent Creation Rules

**The orchestrator MUST NOT work directly when an agent could be created.**

| If Task Requires... | Action |
|---------------------|--------|
| Reading >3 files | Create or use Research agent |
| Writing any code files | Create or use Coding agent |
| Analyzing code | Create or use analyzer agent |
| Any specialized work | Create agent with context |

### When No Agent Exists

If no existing agent covers the task:

1. **Create a new agent** at `.claude/agents/{task-name}.md`
2. **Define the role** (Research, Coding, Testing, or Review)
3. **Specify constraints** (file limits, scope boundaries)
4. **Delegate immediately** using the Task tool

---

**Note:** Use `.claude/templates/plan.md` and `.claude/templates/results.md` to structure work.
