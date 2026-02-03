#!/usr/bin/env node
/**
 * Task-Level Orchestrator Analyzer
 *
 * CLI tool to analyze Claude Code tasks for orchestrator pattern compliance.
 * Analyzes at the task level (which may span multiple sessions) rather than
 * individual sessions, preventing false positives when planning happens in
 * one session and execution in another.
 *
 * Usage:
 *   node analyze-task.mjs [options]
 */

import { findTasks, findTaskBySlug, findTaskForSession } from './task-linker.mjs';
import { evaluateTaskRules, generateTaskReport } from './task-rules.mjs';
import { formatDuration } from './transcript-parser.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
Task-Level Orchestrator Analyzer

Analyze Claude Code tasks for orchestrator pattern compliance.
Tasks may span multiple sessions (planning in one, execution in another).

Usage:
  node analyze-task.mjs [options]

Options:
  --slug <slug>     Analyze task by slug (e.g., goofy-twirling-orbit)
  --session <id>    Analyze task containing this session
  --list            List all tasks with summaries
  --timeline        Show task timeline visualization
  --batch           Analyze all tasks
  --project path    Project path (default: current directory)
  --output path     Output directory (default: .claude/audit/analysis)
  --json            Output raw JSON instead of markdown
  --help            Show this help

Examples:
  node analyze-task.mjs                           # Analyze most recent task
  node analyze-task.mjs --slug goofy-twirling-orbit
  node analyze-task.mjs --session c497b649        # Find and analyze task containing session
  node analyze-task.mjs --list                    # List all tasks
  node analyze-task.mjs --timeline                # Show timeline
  node analyze-task.mjs --batch                   # Analyze all tasks

Task-Level vs Session-Level Analysis:
  Session-level analysis can produce false violations when:
  - Planning happens in session A, execution in session B
  - User accepts plan (clearing context for execution session)
  - Multi-session workflows are used intentionally

  Task-level analysis groups related sessions and evaluates compliance
  across the full task lifecycle.
`);
}

async function listTasks(projectPath, outputJson) {
  const { tasks, linkages } = await findTasks(projectPath);

  if (outputJson) {
    console.log(JSON.stringify({
      summary: {
        totalTasks: tasks.length,
        multiSessionTasks: tasks.filter(t => t.sessions.length > 1).length,
        linkages: linkages.length
      },
      tasks: tasks.map(t => ({
        taskId: t.taskId,
        slug: t.slug,
        status: t.status,
        sessions: t.sessions.length,
        duration: t.totalDuration,
        delegations: t.agentDelegations?.length || 0,
        description: t.description?.substring(0, 100)
      }))
    }, null, 2));
    return;
  }

  console.log(`\nTask Analysis Summary`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Total Tasks: ${tasks.length}`);
  console.log(`Multi-Session Tasks: ${tasks.filter(t => t.sessions.length > 1).length}`);
  console.log(`Cross-Session Linkages: ${linkages.length}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Group by status
  const byStatus = {};
  for (const task of tasks) {
    if (!byStatus[task.status]) byStatus[task.status] = [];
    byStatus[task.status].push(task);
  }

  for (const [status, statusTasks] of Object.entries(byStatus)) {
    console.log(`\n## ${status.toUpperCase()} (${statusTasks.length})\n`);

    for (const task of statusTasks.slice(0, 10)) {
      const shortId = task.taskId.substring(0, 8);
      const slug = task.slug ? `[${task.slug}]` : '';
      const sessions = task.sessions.length > 1 ? `(${task.sessions.length} sessions)` : '';
      const duration = formatDuration(task.totalDuration);
      const delegations = task.agentDelegations?.length || 0;

      console.log(`${shortId}... ${slug} ${sessions}`);
      console.log(`  Duration: ${duration} | Delegations: ${delegations} | Plan: ${task.planModeUsed ? '✓' : '✗'}`);
      if (task.description) {
        console.log(`  ${task.description.substring(0, 70)}...`);
      }
      console.log('');
    }

    if (statusTasks.length > 10) {
      console.log(`  ... and ${statusTasks.length - 10} more ${status} tasks\n`);
    }
  }
}

async function showTimeline(projectPath, outputJson) {
  const { tasks } = await findTasks(projectPath);

  // Sort by start time (newest first)
  const sortedTasks = [...tasks].sort((a, b) => b.startTime - a.startTime);

  if (outputJson) {
    console.log(JSON.stringify(sortedTasks.map(t => ({
      taskId: t.taskId,
      slug: t.slug,
      startTime: t.startTime,
      endTime: t.endTime,
      sessions: t.sessions.map(s => ({
        sessionId: s.sessionId,
        phase: s.phase,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    })), null, 2));
    return;
  }

  console.log(`\nTask Timeline (Most Recent First)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  for (const task of sortedTasks.slice(0, 15)) {
    const date = task.startTime?.toISOString().split('T')[0] || 'unknown';
    const time = task.startTime?.toISOString().split('T')[1]?.substring(0, 5) || '';
    const slug = task.slug ? `[${task.slug}]` : '';
    const status = task.status.toUpperCase().padEnd(15);

    console.log(`${date} ${time}  ${status}  ${slug}`);

    // Show session timeline
    for (let i = 0; i < task.sessions.length; i++) {
      const session = task.sessions[i];
      const isLast = i === task.sessions.length - 1;
      const connector = isLast ? '└──' : '├──';
      const phaseIcon = session.phase === 'planning' ? '📝' : session.phase === 'execution' ? '⚡' : '🔄';

      console.log(`            ${connector} ${phaseIcon} ${session.phase}: ${session.sessionId.substring(0, 8)}...`);
    }

    console.log('');
  }

  if (sortedTasks.length > 15) {
    console.log(`... and ${sortedTasks.length - 15} more tasks\n`);
  }
}

async function analyzeTask(task, projectPath, outputDir, outputJson) {
  const result = evaluateTaskRules(task);

  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  const report = generateTaskReport(result, task);

  // Save report
  const filename = task.slug
    ? `task-${task.slug}.md`
    : `task-${task.taskId.substring(0, 8)}.md`;
  const outputPath = join(outputDir, filename);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(outputPath, report);

  // Console summary
  console.log(`\nTask Analysis Complete`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Task: ${task.slug || task.taskId}`);
  console.log(`Status: ${task.status}`);
  console.log(`Sessions: ${task.sessions.length}`);
  console.log(`Duration: ${formatDuration(task.totalDuration)}`);
  console.log(`Score: ${result.score}%`);
  console.log(`Violations: ${result.violations} (${result.errorCount} errors, ${result.warningCount} warnings)`);

  if (result.unknown > 0) {
    console.log(`Unknown: ${result.unknown} rule(s) could not be evaluated`);
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // Show session breakdown
  console.log(`\nSessions:`);
  for (const session of task.sessions) {
    const phaseIcon = session.phase === 'planning' ? '📝' : session.phase === 'execution' ? '⚡' : '🔄';
    console.log(`  ${phaseIcon} ${session.sessionId.substring(0, 8)}... [${session.phase}]`);
  }

  if (result.violations > 0) {
    console.log(`\nViolations:`);
    for (const v of result.results.filter(r => r.passed === false)) {
      const icon = v.severity === 'error' ? '❌' : '⚠️';
      console.log(`  ${icon} ${v.ruleName}: ${v.message}`);
    }
  }

  console.log(`\nReport saved to: ${outputPath}`);

  return result;
}

async function batchAnalyze(projectPath, outputDir, outputJson) {
  const { tasks } = await findTasks(projectPath);

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const results = [];
  console.log(`Analyzing ${tasks.length} tasks...\n`);

  for (const task of tasks) {
    try {
      const result = evaluateTaskRules(task);
      results.push(result);

      const slug = task.slug || task.taskId.substring(0, 8);
      const scoreStr = `${result.score}%`.padStart(4);
      const violations = result.violations > 0 ? `${result.violations} violations` : 'clean';

      console.log(`  ${slug.padEnd(25)} ${scoreStr}  ${violations}`);
    } catch (e) {
      console.log(`  ${task.taskId.substring(0, 8)}... Error: ${e.message}`);
    }
  }

  if (results.length === 0) {
    console.error('\nNo tasks could be analyzed');
    process.exit(1);
  }

  // Generate batch report
  const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  const totalViolations = results.reduce((sum, r) => sum + r.violations, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
  const multiSessionTasks = results.filter(r => r.task.sessionCount > 1).length;

  if (outputJson) {
    console.log(JSON.stringify({
      summary: {
        tasksAnalyzed: results.length,
        averageScore: avgScore,
        totalViolations,
        totalErrors,
        multiSessionTasks
      },
      results
    }, null, 2));
    return;
  }

  // Save batch report
  const dateStr = new Date().toISOString().split('T')[0];
  const outputPath = join(outputDir, `task-batch-analysis-${dateStr}.md`);

  const report = generateBatchReport(results);
  writeFileSync(outputPath, report);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Batch Analysis Summary`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Tasks Analyzed: ${results.length}`);
  console.log(`Multi-Session Tasks: ${multiSessionTasks}`);
  console.log(`Average Score: ${avgScore}%`);
  console.log(`Total Violations: ${totalViolations} (${totalErrors} errors)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\nReport saved to: ${outputPath}`);
}

function generateBatchReport(results) {
  const lines = [];

  const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  const totalViolations = results.reduce((sum, r) => sum + r.violations, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0);
  const multiSessionTasks = results.filter(r => r.task.sessionCount > 1).length;

  lines.push('# Task-Level Batch Orchestrator Analysis');
  lines.push('');
  lines.push(`**Analysis Date:** ${new Date().toISOString()}`);
  lines.push(`**Tasks Analyzed:** ${results.length}`);
  lines.push(`**Multi-Session Tasks:** ${multiSessionTasks}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Average Score | ${avgScore}% |`);
  lines.push(`| Total Violations | ${totalViolations} |`);
  lines.push(`| Total Errors | ${totalErrors} |`);
  lines.push(`| Total Warnings | ${totalWarnings} |`);
  lines.push(`| Multi-Session Tasks | ${multiSessionTasks} |`);
  lines.push('');

  lines.push('## Task Breakdown');
  lines.push('');
  lines.push('| Task | Score | Errors | Warnings | Sessions | Delegations |');
  lines.push('|------|-------|--------|----------|----------|-------------|');

  for (const r of results) {
    const taskName = r.slug || r.taskId.substring(0, 8);
    lines.push(`| ${taskName} | ${r.score}% | ${r.errorCount} | ${r.warningCount} | ${r.task.sessionCount} | ${r.task.delegationCount} |`);
  }

  lines.push('');

  // Most common violations
  const violationCounts = {};
  for (const r of results) {
    for (const v of r.results.filter(x => x.passed === false)) {
      violationCounts[v.ruleId] = (violationCounts[v.ruleId] || 0) + 1;
    }
  }

  const sortedViolations = Object.entries(violationCounts).sort((a, b) => b[1] - a[1]);

  if (sortedViolations.length > 0) {
    lines.push('## Most Common Violations');
    lines.push('');
    lines.push('| Rule | Occurrences |');
    lines.push('|------|-------------|');

    for (const [ruleId, count] of sortedViolations) {
      lines.push(`| ${ruleId} | ${count} |`);
    }

    lines.push('');
  }

  // Cross-session analysis note
  lines.push('## Cross-Session Analysis Benefits');
  lines.push('');
  lines.push('This analysis evaluates tasks at the **task level** rather than session level.');
  lines.push('');
  lines.push('**Benefits:**');
  lines.push('- Planning in one session, execution in another is correctly recognized');
  lines.push('- Plan mode compliance is evaluated across the full task lifecycle');
  lines.push('- Reduces false positives from session boundary artifacts');
  lines.push('');
  lines.push(`**Multi-session tasks in this analysis:** ${multiSessionTasks} of ${results.length} tasks`);
  lines.push('');

  return lines.join('\n');
}

async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const projectPath = args.includes('--project')
    ? args[args.indexOf('--project') + 1]
    : process.cwd();

  const outputDir = args.includes('--output')
    ? args[args.indexOf('--output') + 1]
    : join(projectPath, '.claude', 'audit', 'analysis');

  const outputJson = args.includes('--json');

  try {
    if (args.includes('--list')) {
      await listTasks(projectPath, outputJson);
      return;
    }

    if (args.includes('--timeline')) {
      await showTimeline(projectPath, outputJson);
      return;
    }

    if (args.includes('--batch')) {
      await batchAnalyze(projectPath, outputDir, outputJson);
      return;
    }

    // Analyze specific task
    let task = null;

    if (args.includes('--slug')) {
      const slug = args[args.indexOf('--slug') + 1];
      task = await findTaskBySlug(slug, projectPath);
      if (!task) {
        console.error(`No task found with slug: ${slug}`);
        process.exit(1);
      }
    } else if (args.includes('--session')) {
      const sessionId = args[args.indexOf('--session') + 1];
      const result = await findTaskForSession(sessionId, projectPath);
      if (!result.task) {
        console.error(`No task found containing session: ${sessionId}`);
        process.exit(1);
      }
      task = result.task;
      console.log(`Session ${sessionId.substring(0, 8)}... belongs to task ${task.slug || task.taskId.substring(0, 8)}\n`);
    } else {
      // Analyze most recent task
      const { tasks } = await findTasks(projectPath);
      if (tasks.length === 0) {
        console.error('No tasks found');
        process.exit(1);
      }
      task = tasks[0]; // Most recent
    }

    await analyzeTask(task, projectPath, outputDir, outputJson);
  } catch (e) {
    console.error(e.message);
    if (args.includes('--debug')) {
      console.error(e.stack);
    }
    process.exit(1);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
