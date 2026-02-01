---
name: app-design
description: Guide through App Design Phase - designing features, pages, user flows, and components before implementation
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
---

# App Design Phase

You are now entering the **App Design Phase**. This phase happens AFTER your tech stack is ready but BEFORE any implementation begins.

## Why This Phase Matters

Jumping straight to code leads to:
- Incomplete features
- Inconsistent UI
- Rework and refactoring
- Missing pages discovered late
- Unclear data requirements

This phase ensures you have a clear blueprint before writing any code.

## What We'll Design Together

1. **Features** - What does the app do? What are the user stories?
2. **Pages** - Complete inventory of every page/screen
3. **User Flows** - How users navigate through key workflows
4. **Components** - UI building blocks for each page
5. **Data** - What information each component needs
6. **Priority** - What to build first

## Getting Started

First, let me read your project brief to understand what we're building.

@.claude/projects/

I'll ask you questions about each aspect of your app, then create a design document that implementation agents will follow.

## Questions

I'll guide you through these questions:

### 1. Core Features
- What are the 3-5 most important things users need to do?
- Walk me through a typical user session.
- What's the first thing users see after logging in?

### 2. Pages
For each feature, we'll identify:
- Which pages are needed
- The URL structure
- What components appear on each page

### 3. User Experience
- Any reference apps you like the design of?
- Minimal/clean or feature-rich/powerful?
- Mobile-first or desktop-first?
- Accessibility requirements?

### 4. Data & Interactions
- What info do users need at a glance?
- What actions should be one-click vs. multi-step?
- Any real-time updates needed?

## Output

At the end, I'll create `.claude/design/app-design.md` containing:
- Feature specifications
- Complete page inventory
- User flow diagrams
- Component hierarchies
- Data requirements
- Implementation priority

This becomes the blueprint for `dev-frontend` and `dev-backend` agents.

## Let's Begin

**First question:** Looking at your project, what are the 3-5 most important things users should be able to do? (Not features, but user goals - what are they trying to accomplish?)
