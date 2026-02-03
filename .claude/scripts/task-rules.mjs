#!/usr/bin/env node
/**
 * Task Rules - Task-level compliance rules for orchestrator analysis
 *
 * Evaluates tasks (which may span multiple sessions) against orchestrator pattern rules.
 * This differs from session-level rules by considering the full task lifecycle.
 *
 * Usage:
 *   import { evaluateTaskRules, generateTaskReport, TASK_RULES } from './task-rules.mjs';
 *   const result = evaluateTaskRules(task);
 *   const report = generateTaskReport(result);
 */

import { formatDuration } from './transcript-parser.mjs';

/**
 * Severity levels for rule violations
 */
export const SEVERITY = {
  ERROR: 'error',      // Must fix - clear violation
  WARNING: 'warning',  // Should fix - suboptimal pattern
  INFO: 'info'         // Informational - notable but acceptable
};

/**
 * Compare semantic versions (returns -1, 0, or 1)
 */
function compareVersions(v1, v2) {
  if (!v1 || !v2) return 0;
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const a = parts1[i] || 0;
    const b = parts2[i] || 0;
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
}

/**
 * Get the orchestrator version from a task (from any session's metrics)
 * @param {Object} task - Task object
 * @returns {string|null}
 */
function getTaskVersion(task) {
  for (const session of task.sessions || []) {
    if (session.metrics?.orchestratorVersion) {
      return session.metrics.orchestratorVersion;
    }
  }
  return null;
}

/**
 * Task-level rule definitions
 *
 * These rules evaluate the entire task lifecycle, not individual sessions.
 * A task passes plan mode if ANY session used plan mode.
 */
export const TASK_RULES = {
  PLAN_MODE_USED: {
    id: 'PLAN_MODE_USED',
    name: 'Plan Mode Used',
    description: 'Plan mode was used in at least one session of the task',
    severity: SEVERITY.WARNING,
    evaluate: (task) => {
      const version = getTaskVersion(task);

      // Check if plan mode was used in any session
      const planModeUsed = task.planModeUsed ||
        task.sessions.some(s => s.metrics?.planModeEntered);

      if (planModeUsed) {
        return {
          passed: true,
          message: 'Plan mode was used in task lifecycle',
          details: task.sessions
            .filter(s => s.metrics?.planModeEntered)
            .map(s => `Session ${s.sessionId.substring(0, 8)}... (${s.phase})`)
            .join(', ')
        };
      }

      // Special handling for execution-only sessions that reference a planning session
      if (task.status === 'unknown_planning') {
        return {
          passed: null, // Unknown - can't determine
          message: 'Execution session with no linked planning session',
          recommendation: 'Planning may have occurred in an unlinked session. Check for sessions with matching slug.'
        };
      }

      // Severity depends on version
      const severity = version && compareVersions(version, '2.15.0') >= 0
        ? SEVERITY.ERROR
        : SEVERITY.WARNING;

      return {
        passed: false,
        message: 'No plan mode used in any task session',
        recommendation: 'Use EnterPlanMode to plan implementation approach before executing',
        severity
      };
    }
  },

  PLAN_APPROVED: {
    id: 'PLAN_APPROVED',
    name: 'Plan Approved',
    description: 'ExitPlanMode was called (plan was approved by user)',
    severity: SEVERITY.WARNING,
    evaluate: (task) => {
      if (task.planApproved) {
        return {
          passed: true,
          message: 'Plan was approved via ExitPlanMode'
        };
      }

      if (!task.planModeUsed && !task.sessions.some(s => s.metrics?.planModeEntered)) {
        return {
          passed: null, // N/A - no plan mode used
          message: 'Not applicable - no plan mode used',
          severity: SEVERITY.INFO
        };
      }

      // Check if this is an execution session that implies approval happened elsewhere
      if (task.sessions.some(s => s.phase === 'execution' && s.planContent)) {
        return {
          passed: true,
          message: 'Execution session implies plan was approved (planContent present)',
          details: 'Plan approval occurred in planning session, execution session has plan content'
        };
      }

      return {
        passed: false,
        message: 'Plan mode entered but not completed with ExitPlanMode',
        recommendation: 'Complete planning phase with ExitPlanMode to get user approval'
      };
    }
  },

  AGENTS_DELEGATED: {
    id: 'AGENTS_DELEGATED',
    name: 'Agent Delegation',
    description: 'Implementation work was delegated to agents',
    severity: SEVERITY.ERROR,
    evaluate: (task) => {
      const delegationCount = task.agentDelegations?.length || 0;

      // Calculate total complexity from all sessions
      const totalToolCalls = task.sessions.reduce((sum, s) =>
        sum + (s.metrics?.totalToolCalls || 0), 0);
      const uniqueFilesTouched = new Set(
        task.sessions.flatMap(s => {
          const m = s.metrics;
          if (!m) return [];
          return [
            ...(m.mainCodeWrites || []),
            ...(m.mainCodeEdits || [])
          ];
        })
      ).size;

      // Determine if task was trivial
      const isTrivial = totalToolCalls <= 5 && uniqueFilesTouched <= 1 && task.totalDuration < 180;

      if (delegationCount > 0) {
        return {
          passed: true,
          message: `Delegated to ${delegationCount} agent(s) across ${task.sessions.length} session(s)`,
          details: task.agentDelegations.slice(0, 5)
            .map(d => `${d.agentType}: ${d.description}`)
            .join('\n') +
            (task.agentDelegations.length > 5 ? `\n... and ${task.agentDelegations.length - 5} more` : '')
        };
      }

      if (isTrivial) {
        return {
          passed: true,
          message: 'Trivial task - delegation optional'
        };
      }

      return {
        passed: false,
        message: 'No agent delegation in non-trivial task',
        recommendation: 'Delegate implementation work to specialized agents (dev-*, explore-*, etc.)'
      };
    }
  },

  NO_DIRECT_CODE_WRITES: {
    id: 'NO_DIRECT_CODE_WRITES',
    name: 'No Direct Code Writes',
    description: 'Orchestrator did not write code files directly across all sessions',
    severity: SEVERITY.ERROR,
    evaluate: (task) => {
      let totalCodeWrites = 0;
      let totalCodeEdits = 0;
      const codeFiles = [];

      for (const session of task.sessions) {
        if (!session.metrics) continue;
        totalCodeWrites += session.metrics.mainCodeWriteCount || 0;
        totalCodeEdits += session.metrics.mainCodeEditCount || 0;
        if (session.metrics.mainCodeWrites) {
          codeFiles.push(...session.metrics.mainCodeWrites);
        }
        if (session.metrics.mainCodeEdits) {
          codeFiles.push(...session.metrics.mainCodeEdits);
        }
      }

      const totalChanges = totalCodeWrites + totalCodeEdits;

      if (totalChanges === 0) {
        return {
          passed: true,
          message: 'No direct code writes in main context across all sessions'
        };
      }

      return {
        passed: false,
        message: `${totalChanges} code file(s) written/edited directly across ${task.sessions.length} session(s)`,
        details: [...new Set(codeFiles)].join('\n'),
        recommendation: 'Delegate all code changes to Coding agents - orchestrator coordinates only'
      };
    }
  },

  FILE_EXPLORATION_DELEGATED: {
    id: 'FILE_EXPLORATION_DELEGATED',
    name: 'File Exploration Delegated',
    description: 'Heavy file exploration was delegated to Explore agent',
    severity: SEVERITY.WARNING,
    evaluate: (task) => {
      let totalMainReads = 0;
      let exploreAgentUsed = false;

      for (const session of task.sessions) {
        if (!session.metrics) continue;
        totalMainReads += session.metrics.mainReadCount || 0;
        if (session.metrics.exploreAgentUsed) {
          exploreAgentUsed = true;
        }
      }

      if (totalMainReads <= 10) {
        return {
          passed: true,
          message: `${totalMainReads} total main context reads - exploration delegation optional`
        };
      }

      if (exploreAgentUsed) {
        return {
          passed: true,
          message: 'Explore agent was used for codebase exploration'
        };
      }

      return {
        passed: false,
        message: `${totalMainReads} file reads in main context without Explore agent`,
        recommendation: 'Use Task tool with subagent_type="Explore" for heavy codebase exploration'
      };
    }
  },

  TASK_COMPLETED: {
    id: 'TASK_COMPLETED',
    name: 'Task Completion',
    description: 'Task reached completion status (not abandoned)',
    severity: SEVERITY.INFO,
    evaluate: (task) => {
      if (task.status === 'completed') {
        return {
          passed: true,
          message: 'Task completed successfully'
        };
      }

      if (task.status === 'unknown_planning') {
        return {
          passed: null,
          message: 'Execution session without linked planning - unable to determine completion'
        };
      }

      if (task.status === 'planning' || task.status === 'approved') {
        return {
          passed: null,
          message: `Task in ${task.status} phase - not yet executed`
        };
      }

      return {
        passed: false,
        message: `Task status: ${task.status}`,
        recommendation: 'Ensure tasks are completed before starting new work'
      };
    }
  }
};

/**
 * Evaluate all task rules against a task
 * @param {Object} task - Task object from task-linker
 * @returns {Object} - Evaluation results
 */
export function evaluateTaskRules(task) {
  const results = [];
  let totalWeight = 0;
  let passedWeight = 0;
  let unknownCount = 0;

  const weights = {
    [SEVERITY.ERROR]: 3,
    [SEVERITY.WARNING]: 1,
    [SEVERITY.INFO]: 0.5
  };

  for (const rule of Object.values(TASK_RULES)) {
    const evaluation = rule.evaluate(task);
    const effectiveSeverity = evaluation.severity || rule.severity;

    // Handle unknown/N/A results (passed === null)
    if (evaluation.passed === null) {
      unknownCount++;
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        description: rule.description,
        severity: effectiveSeverity,
        passed: null,
        message: evaluation.message,
        details: evaluation.details,
        recommendation: evaluation.recommendation
      });
      continue;
    }

    const weight = weights[effectiveSeverity];
    totalWeight += weight;

    if (evaluation.passed) {
      passedWeight += weight;
    }

    results.push({
      ruleId: rule.id,
      ruleName: rule.name,
      description: rule.description,
      severity: effectiveSeverity,
      passed: evaluation.passed,
      message: evaluation.message,
      details: evaluation.details,
      recommendation: evaluation.recommendation
    });
  }

  const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 100;
  const violations = results.filter(r => r.passed === false);
  const errors = violations.filter(v => v.severity === SEVERITY.ERROR);
  const warnings = violations.filter(v => v.severity === SEVERITY.WARNING);

  return {
    taskId: task.taskId,
    slug: task.slug,
    orchestratorVersion: getTaskVersion(task) || 'unknown',
    score,
    totalRules: results.length,
    evaluated: results.length - unknownCount,
    passed: results.filter(r => r.passed === true).length,
    unknown: unknownCount,
    violations: violations.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    results,
    task: {
      description: task.description?.substring(0, 100),
      status: task.status,
      sessionCount: task.sessions?.length || 0,
      totalDuration: task.totalDuration,
      delegationCount: task.agentDelegations?.length || 0,
      planModeUsed: task.planModeUsed,
      planApproved: task.planApproved
    }
  };
}

/**
 * Generate a markdown report from task evaluation results
 * @param {Object} result - Evaluation results
 * @param {Object} task - Full task object (for session details)
 * @returns {string} - Markdown report
 */
export function generateTaskReport(result, task) {
  const lines = [];

  lines.push(`# Task Analysis: ${result.slug || result.taskId.substring(0, 8)}`);
  lines.push('');
  lines.push(`**Status:** ${task.status}`);
  lines.push(`**Duration:** ${formatDuration(task.totalDuration)} (across ${task.sessions.length} session(s))`);
  lines.push(`**Orchestrator Version:** ${result.orchestratorVersion}`);
  lines.push(`**Analysis Date:** ${new Date().toISOString()}`);
  lines.push('');

  // Task Summary
  if (task.description) {
    lines.push('## Task Summary');
    lines.push('');
    // Clean up the description (remove local-command caveats, trim whitespace)
    let description = task.description;
    if (description.includes('<local-command-caveat>')) {
      description = description.split('<local-command-caveat>')[0];
    }
    description = description.trim();

    // Format as blockquote for readability
    const descLines = description.split('\n').map(l => `> ${l}`);
    lines.push(...descLines);
    lines.push('');
  }

  // Session Timeline
  lines.push('## Session Timeline');
  lines.push('');
  lines.push('| Session | Phase | Duration | Key Actions |');
  lines.push('|---------|-------|----------|-------------|');

  for (const session of task.sessions) {
    const duration = session.metrics?.duration
      ? formatDuration(session.metrics.duration)
      : 'unknown';

    const actions = [];
    if (session.metrics?.planModeEntered) actions.push('EnterPlanMode');
    if (session.metrics?.planModeExited) actions.push('ExitPlanMode');
    if (session.metrics?.delegationCount > 0) {
      actions.push(`${session.metrics.delegationCount} delegations`);
    }

    const shortId = session.sessionId.substring(0, 8);
    lines.push(`| ${shortId}... | ${session.phase} | ${duration} | ${actions.join(', ') || 'none'} |`);
  }

  lines.push('');

  // Compliance Scorecard
  lines.push('## Compliance Scorecard');
  lines.push('');
  lines.push('| Rule | Result | Notes |');
  lines.push('|------|--------|-------|');

  for (const r of result.results) {
    let status;
    if (r.passed === null) {
      status = '⬜ Unknown';
    } else if (r.passed) {
      status = '✅ Pass';
    } else if (r.severity === SEVERITY.ERROR) {
      status = '❌ VIOLATION';
    } else {
      status = '⚠️ Warning';
    }

    lines.push(`| ${r.ruleName} | ${status} | ${r.message} |`);
  }

  lines.push('');
  lines.push(`**Overall Score:** ${result.score}%`);
  if (result.unknown > 0) {
    lines.push(`*(${result.unknown} rule(s) could not be evaluated)*`);
  }
  lines.push('');

  // Violations
  if (result.violations > 0) {
    lines.push('## Violations');
    lines.push('');

    const errors = result.results.filter(r => r.passed === false && r.severity === SEVERITY.ERROR);
    const warnings = result.results.filter(r => r.passed === false && r.severity === SEVERITY.WARNING);

    if (errors.length > 0) {
      lines.push('### Errors (Must Fix)');
      lines.push('');
      for (const e of errors) {
        lines.push(`#### ${e.ruleName}`);
        lines.push('');
        lines.push(e.message);
        if (e.details) {
          lines.push('');
          lines.push('```');
          lines.push(e.details);
          lines.push('```');
        }
        if (e.recommendation) {
          lines.push('');
          lines.push(`**Recommendation:** ${e.recommendation}`);
        }
        lines.push('');
      }
    }

    if (warnings.length > 0) {
      lines.push('### Warnings (Should Fix)');
      lines.push('');
      for (const w of warnings) {
        lines.push(`#### ${w.ruleName}`);
        lines.push('');
        lines.push(w.message);
        if (w.details) {
          lines.push('');
          lines.push('```');
          lines.push(w.details);
          lines.push('```');
        }
        if (w.recommendation) {
          lines.push('');
          lines.push(`**Recommendation:** ${w.recommendation}`);
        }
        lines.push('');
      }
    }
  } else {
    lines.push('## No Violations');
    lines.push('');
    lines.push('All applicable orchestrator rules passed for this task.');
    lines.push('');
  }

  // Task Metrics Summary
  lines.push('## Task Metrics');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total Duration | ${formatDuration(task.totalDuration)} |`);
  lines.push(`| Sessions | ${task.sessions.length} |`);
  lines.push(`| Agent Delegations | ${task.agentDelegations?.length || 0} |`);
  lines.push(`| Plan Mode Used | ${task.planModeUsed ? 'Yes' : 'No'} |`);
  lines.push(`| Plan Approved | ${task.planApproved ? 'Yes' : 'No'} |`);
  lines.push(`| Status | ${task.status} |`);
  lines.push('');

  // Cross-Session Analysis note
  if (task.sessions.length > 1) {
    lines.push('## Cross-Session Analysis');
    lines.push('');
    lines.push('This task spanned multiple sessions:');
    lines.push('');
    for (const session of task.sessions) {
      const phaseIcon = session.phase === 'planning' ? '📝' : session.phase === 'execution' ? '⚡' : '🔄';
      lines.push(`- ${phaseIcon} **${session.phase}**: \`${session.sessionId}\``);
    }
    lines.push('');
    lines.push('Compliance rules were evaluated across the complete task lifecycle, not individual sessions.');
    lines.push('');
  }

  return lines.join('\n');
}

// CLI usage
if (process.argv[1] && process.argv[1].endsWith('task-rules.mjs')) {
  console.log('Task Rules Module');
  console.log('');
  console.log('Available task-level rules:');
  for (const rule of Object.values(TASK_RULES)) {
    console.log(`  ${rule.id}: ${rule.description} [${rule.severity}]`);
  }
}
