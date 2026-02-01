# Agents

Custom agents for Snakey development. Agents are specialized sub-processes spawned by the orchestrator.

## Available Agents

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
