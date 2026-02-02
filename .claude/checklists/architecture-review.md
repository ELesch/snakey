# Architecture Review Checklist

> Target: Maintainable, scalable codebase

## Pre-Review
- [ ] Understand project's architectural goals
- [ ] Review existing ADRs (if any)

## Layer Architecture

### Separation of Concerns
- [ ] UI layer contains only presentation logic
- [ ] Business logic in service/domain layer
- [ ] Data access isolated in repository layer
- [ ] No business logic in controllers

### Dependency Direction
- [ ] Dependencies point inward (UI → Service → Domain)
- [ ] Domain has no external dependencies
- [ ] Infrastructure adapts to domain interfaces

### Cross-Cutting Concerns
- [ ] Logging centralized
- [ ] Error handling consistent
- [ ] Authentication middleware-based
- [ ] Validation in appropriate layer

## Module Design

### Cohesion
- [ ] Modules have single, clear purpose
- [ ] Related functionality grouped together
- [ ] Module boundaries match domain boundaries

### Coupling
- [ ] Low coupling between modules
- [ ] Communication through defined interfaces
- [ ] No direct database access across modules
- [ ] Shared state minimized

### Dependencies
- [ ] No circular dependencies
- [ ] Clear dependency graph
- [ ] External services behind abstractions

## Code Organization

### File Structure
- [ ] Consistent naming conventions
- [ ] Logical folder hierarchy
- [ ] Feature-based or layer-based (not mixed)
- [ ] Clear public API (index exports)

### Dead Code
- [ ] No unused exports
- [ ] No unreachable code paths
- [ ] No commented-out code
- [ ] No deprecated unused code

### Complexity
- [ ] Functions < 50 lines (generally)
- [ ] Files < 500 lines (generally)
- [ ] Cyclomatic complexity reasonable
- [ ] No deeply nested conditions

## SOLID Principles

### Single Responsibility
- [ ] Classes/modules have one reason to change
- [ ] Functions do one thing

### Open/Closed
- [ ] Extensible without modification
- [ ] Strategy/plugin patterns where appropriate

### Liskov Substitution
- [ ] Subtypes substitutable for base types
- [ ] No violated expectations

### Interface Segregation
- [ ] Interfaces are focused
- [ ] No forced unused dependencies

### Dependency Inversion
- [ ] High-level modules don't depend on low-level
- [ ] Both depend on abstractions

## Scalability Considerations

- [ ] Stateless services where possible
- [ ] Database queries scalable
- [ ] Caching strategy defined
- [ ] Background jobs for heavy operations

## Sign-Off
- Reviewer: _______
- Date: _______
- Issues: [ ] None [ ] See below

| Severity | Issue | Principle | Location | Fix |
|----------|-------|-----------|----------|-----|
| | | | | |
