# Agents

Custom agents for Snakey development. Agents are specialized sub-processes spawned by the orchestrator.

## Available Agents

### Domain Agents (Technology-Specific)

Domain agents have **embedded knowledge** for technologies with AI training gaps. **Use these FIRST** for their specific technology.

Each technology has four agent roles:

| Technology | Implementation | Research | Debugging | Review | Confidence |
|------------|----------------|----------|-----------|--------|------------|
| Next.js 15 | `dev-nextjs-15` | `explore-nextjs-15` | `debug-nextjs-15` | `audit-nextjs-15` | Medium |
| Prisma 7 | `dev-prisma-7` | `explore-prisma-7` | `debug-prisma-7` | `audit-prisma-7` | Medium |
| Tailwind v4 | `dev-tailwind-v4` | `explore-tailwind-v4` | `debug-tailwind-v4` | `audit-tailwind-v4` | Low |

**Role Descriptions:**

| Role | Prefix | Purpose | Write Scope |
|------|--------|---------|-------------|
| Implementation | `dev-` | Build features, write code | Code files |
| Research | `explore-` | Investigate, find patterns | Reports only |
| Debugging | `debug-` | Diagnose issues, trace errors | Reports only |
| Review | `audit-` | Check compliance, review patterns | Reports only |

**Shared Knowledge:** `.claude/agents/knowledge/`
- `nextjs-15.md` - Next.js 15 patterns
- `prisma-7.md` - Prisma 7 patterns
- `tailwind-4.md` - Tailwind v4 patterns
- `logging-pino.md` - Logging patterns (cross-cutting)

### Implementation Agents (Coding Role)

| Agent | Purpose |
|-------|---------|
| `dev-backend` | Services, repositories, API routes |
| `dev-frontend` | Components, hooks, pages |
| `dev-migration` | Database migrations, schema changes |
| `dev-integration` | Third-party API integrations |
| `dev-data` | Data sync, ETL, offline logic |
| `dev-refactor` | Code structure improvements |
| `dev-docs` | Documentation |
| `dev-deploy` | CI/CD, deployment |

### Testing Agent (Testing Role)

| Agent | Purpose |
|-------|---------|
| `dev-test` | Writing and running tests |

### Design Agents (Research Role)

| Agent | Purpose |
|-------|---------|
| `dev-designer` | App Design Phase - features, pages, flows |
| `dev-architect` | System design, ADRs |
| `dev-api` | API contract design |
| `dev-database` | Query optimization, data modeling |
| `dev-analyst` | Process analysis |

### Review Agents (Review Role)

| Agent | Purpose |
|-------|---------|
| `dev-reviewer` | Code review |
| `dev-security` | Security audits |
| `dev-ops` | Operational concerns |

### Auditor Agents (Review Role)

| Agent | Purpose |
|-------|---------|
| `dev-auditor-performance` | Performance bottlenecks |
| `dev-auditor-accessibility` | WCAG compliance |
| `dev-auditor-architecture` | Structural issues |
| `dev-auditor-testing` | Test coverage gaps |
| `dev-auditor-api` | API consistency |
| `dev-auditor-docs` | Documentation quality |
| `dev-auditor-dependencies` | CVEs, licenses |
| `dev-auditor-errors` | Error handling |

## Usage

Agents are spawned by the orchestrator via the Task tool:

```
@dev-backend Create the ReptileService

TASK: CRUD operations for reptile profiles
CONTEXT: Follow existing service patterns. See @.claude/tech/stack.md for Prisma patterns.
CONSTRAINTS: Stay within reptile module
OUTPUT: Write service + tests, run tests
```

## Coordination Rules

See `.claude/roster.md` for:
- Agent role classifications
- Scope limits
- Parallel execution rules
- Batching strategies
