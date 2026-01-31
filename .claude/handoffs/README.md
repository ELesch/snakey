# Handoffs

Structured documents for passing context between agents.

## Templates

| Template | Max Lines | When to Use |
|----------|-----------|-------------|
| `research-to-coding.md` | 100 | Full phase transition (Research -> Coding) |
| `mini-research.md` | 20 | Targeted research request |

## Purpose

Handoffs prevent context bloat by:
- Limiting what gets passed between agents
- Focusing on actionable information
- Dropping exploration tangents

## Usage

Research agents produce handoffs. Coding agents consume them.
