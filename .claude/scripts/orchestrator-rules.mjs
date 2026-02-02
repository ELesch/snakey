#!/usr/bin/env node
/**
 * Orchestrator Rules - Rule definitions and evaluation for orchestrator compliance
 *
 * Evaluates session metrics against orchestrator pattern rules and produces compliance reports.
 *
 * Usage:
 *   import { evaluateRules, generateReport, RULES } from './orchestrator-rules.mjs';
 *   const result = evaluateRules(metrics);
 *   const report = generateReport(result);
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
 * Rule definitions for orchestrator compliance
 */
export const RULES = {
  PLAN_MODE_USAGE: {
    id: 'PLAN_MODE_USAGE',
    name: 'Plan Mode Usage',
    description: 'Non-trivial tasks should enter plan mode',
    severity: SEVERITY.WARNING,
    evaluate: (metrics) => {
      if (metrics.isTrivial) {
        return { passed: true, message: 'Trivial task - plan mode optional' };
      }
      if (metrics.planModeEntered) {
        return { passed: true, message: 'Plan mode was entered' };
      }
      return {
        passed: false,
        message: 'Non-trivial task did not enter plan mode',
        recommendation: 'Use EnterPlanMode at the start of complex tasks to plan approach'
      };
    }
  },

  AGENT_DELEGATION: {
    id: 'AGENT_DELEGATION',
    name: 'Agent Delegation',
    description: 'Non-trivial tasks should delegate to specialized agents',
    severity: SEVERITY.ERROR,
    evaluate: (metrics) => {
      if (metrics.isTrivial) {
        return { passed: true, message: 'Trivial task - delegation optional' };
      }
      if (metrics.delegationCount > 0) {
        return {
          passed: true,
          message: `Delegated to ${metrics.delegationCount} agent(s)`,
          details: metrics.delegations.map(d => `${d.agentType}: ${d.description}`).join('\n')
        };
      }
      return {
        passed: false,
        message: 'No agent delegation in non-trivial task',
        recommendation: 'Create and delegate to specialized agents for research, coding, and testing tasks'
      };
    }
  },

  FILE_READ_LIMIT: {
    id: 'FILE_READ_LIMIT',
    name: 'Direct File Read Limit',
    description: 'Orchestrator should not read more than 3 files directly without delegation',
    severity: SEVERITY.WARNING,
    evaluate: (metrics) => {
      if (metrics.maxConsecutiveReads <= 3) {
        return {
          passed: true,
          message: `Max consecutive reads: ${metrics.maxConsecutiveReads} (limit: 3)`
        };
      }
      return {
        passed: false,
        message: `${metrics.maxConsecutiveReads} consecutive reads without delegation`,
        recommendation: 'Use Explore agent or delegate to Research agents for file exploration'
      };
    }
  },

  NO_DIRECT_CODE_WRITE: {
    id: 'NO_DIRECT_CODE_WRITE',
    name: 'No Direct Code Writes',
    description: 'Orchestrator should never write code files directly',
    severity: SEVERITY.ERROR,
    evaluate: (metrics) => {
      const totalCodeChanges = metrics.mainCodeWriteCount + metrics.mainCodeEditCount;
      if (totalCodeChanges === 0) {
        return { passed: true, message: 'No direct code writes in main context' };
      }
      const files = [...(metrics.mainCodeWrites || []), ...(metrics.mainCodeEdits || [])];
      return {
        passed: false,
        message: `${totalCodeChanges} code file(s) written/edited directly`,
        details: files.join('\n'),
        recommendation: 'Delegate code changes to Coding agents - orchestrator coordinates, not implements'
      };
    }
  },

  EXPLORE_AGENT_USAGE: {
    id: 'EXPLORE_AGENT_USAGE',
    name: 'Explore Agent Usage',
    description: 'Use Explore agent for codebase exploration (>5 reads)',
    severity: SEVERITY.WARNING,
    evaluate: (metrics) => {
      if (metrics.mainReadCount <= 5) {
        return {
          passed: true,
          message: `Only ${metrics.mainReadCount} reads - Explore agent optional`
        };
      }
      if (metrics.exploreAgentUsed) {
        return { passed: true, message: 'Explore agent was used for codebase exploration' };
      }
      return {
        passed: false,
        message: `${metrics.mainReadCount} file reads without Explore agent`,
        recommendation: 'Use Task tool with subagent_type="Explore" for codebase exploration'
      };
    }
  },

  BATCH_FILE_LIMIT: {
    id: 'BATCH_FILE_LIMIT',
    name: 'Batch File Limit',
    description: 'Each agent delegation should handle ≤20 files',
    severity: SEVERITY.WARNING,
    evaluate: (metrics) => {
      if (metrics.maxFilesInSingleDelegation <= 20) {
        return {
          passed: true,
          message: `Max files per delegation: ${metrics.maxFilesInSingleDelegation} (limit: 20)`
        };
      }
      const overLimit = metrics.filesPerDelegation.filter(d => d.fileCount > 20);
      return {
        passed: false,
        message: `${overLimit.length} delegation(s) exceeded 20 file limit`,
        details: overLimit.map(d => `${d.description}: ${d.fileCount} files`).join('\n'),
        recommendation: 'Batch large file operations into multiple agent delegations'
      };
    }
  }
};

/**
 * Evaluate all rules against session metrics
 * @param {SessionMetrics} metrics - Extracted session metrics
 * @returns {EvaluationResult} - Evaluation results with score and violations
 */
export function evaluateRules(metrics) {
  const results = [];
  let totalWeight = 0;
  let passedWeight = 0;

  // Weight errors more heavily
  const weights = {
    [SEVERITY.ERROR]: 3,
    [SEVERITY.WARNING]: 1,
    [SEVERITY.INFO]: 0.5
  };

  for (const rule of Object.values(RULES)) {
    const evaluation = rule.evaluate(metrics);
    const weight = weights[rule.severity];
    totalWeight += weight;

    if (evaluation.passed) {
      passedWeight += weight;
    }

    results.push({
      ruleId: rule.id,
      ruleName: rule.name,
      description: rule.description,
      severity: rule.severity,
      passed: evaluation.passed,
      message: evaluation.message,
      details: evaluation.details,
      recommendation: evaluation.recommendation
    });
  }

  const score = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 100;
  const violations = results.filter(r => !r.passed);
  const errors = violations.filter(v => v.severity === SEVERITY.ERROR);
  const warnings = violations.filter(v => v.severity === SEVERITY.WARNING);

  return {
    sessionId: metrics.sessionId,
    score,
    totalRules: results.length,
    passed: results.filter(r => r.passed).length,
    violations: violations.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    results,
    metrics: {
      duration: metrics.duration,
      isTrivial: metrics.isTrivial,
      delegationCount: metrics.delegationCount,
      mainReadCount: metrics.mainReadCount,
      mainCodeWriteCount: metrics.mainCodeWriteCount + metrics.mainCodeEditCount
    }
  };
}

/**
 * Generate a markdown report from evaluation results
 * @param {EvaluationResult} result - Evaluation results
 * @returns {string} - Markdown formatted report
 */
export function generateReport(result) {
  const lines = [];
  const { metrics } = result;

  lines.push(`# Orchestrator Analysis: ${result.sessionId}`);
  lines.push('');
  lines.push(`**Analysis Date:** ${new Date().toISOString()}`);
  lines.push(`**Session Duration:** ${formatDuration(metrics.duration)}`);
  lines.push(`**Complexity:** ${metrics.isTrivial ? 'Trivial' : 'Non-trivial'}`);
  lines.push('');

  // Scorecard
  lines.push('## Scorecard');
  lines.push('');
  lines.push('| Metric | Value | Status |');
  lines.push('|--------|-------|--------|');

  for (const r of result.results) {
    const status = r.passed
      ? '✅ Pass'
      : r.severity === SEVERITY.ERROR
        ? '❌ VIOLATION'
        : '⚠️ Warning';
    lines.push(`| ${r.ruleName} | ${r.message} | ${status} |`);
  }

  lines.push('');
  lines.push(`**Overall Score:** ${result.score}%`);
  lines.push('');

  // Violations section
  if (result.violations > 0) {
    lines.push('## Violations');
    lines.push('');

    const errors = result.results.filter(r => !r.passed && r.severity === SEVERITY.ERROR);
    const warnings = result.results.filter(r => !r.passed && r.severity === SEVERITY.WARNING);

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
        lines.push('');
      }
    }
  } else {
    lines.push('## No Violations');
    lines.push('');
    lines.push('All orchestrator rules passed. Good job!');
    lines.push('');
  }

  // Recommendations section
  const recommendations = result.results
    .filter(r => !r.passed && r.recommendation)
    .map(r => r.recommendation);

  if (recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    for (const rec of recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  // Summary metrics
  lines.push('## Session Metrics');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Duration | ${formatDuration(metrics.duration)} |`);
  lines.push(`| Agent Delegations | ${metrics.delegationCount} |`);
  lines.push(`| Direct File Reads | ${metrics.mainReadCount} |`);
  lines.push(`| Direct Code Changes | ${metrics.mainCodeWriteCount} |`);
  lines.push(`| Task Complexity | ${metrics.isTrivial ? 'Trivial' : 'Non-trivial'} |`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate a batch report from multiple session evaluations
 * @param {Array<EvaluationResult>} results - Array of evaluation results
 * @returns {string} - Markdown formatted batch report
 */
export function generateBatchReport(results) {
  const lines = [];

  // Sort by date (newest first)
  results.sort((a, b) => (b.metrics?.timestamp || 0) - (a.metrics?.timestamp || 0));

  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;

  const totalViolations = results.reduce((sum, r) => sum + r.violations, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0);

  lines.push('# Batch Orchestrator Analysis');
  lines.push('');
  lines.push(`**Analysis Date:** ${new Date().toISOString()}`);
  lines.push(`**Sessions Analyzed:** ${results.length}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Average Score | ${avgScore}% |`);
  lines.push(`| Total Violations | ${totalViolations} |`);
  lines.push(`| Total Errors | ${totalErrors} |`);
  lines.push(`| Total Warnings | ${totalWarnings} |`);
  lines.push('');

  // Session breakdown
  lines.push('## Session Breakdown');
  lines.push('');
  lines.push('| Session | Score | Errors | Warnings | Delegations |');
  lines.push('|---------|-------|--------|----------|-------------|');

  for (const r of results) {
    const shortId = r.sessionId.substring(0, 8);
    lines.push(`| ${shortId}... | ${r.score}% | ${r.errorCount} | ${r.warningCount} | ${r.metrics.delegationCount} |`);
  }

  lines.push('');

  // Most common violations
  const violationCounts = {};
  for (const r of results) {
    for (const violation of r.results.filter(v => !v.passed)) {
      violationCounts[violation.ruleId] = (violationCounts[violation.ruleId] || 0) + 1;
    }
  }

  const sortedViolations = Object.entries(violationCounts)
    .sort((a, b) => b[1] - a[1]);

  if (sortedViolations.length > 0) {
    lines.push('## Most Common Violations');
    lines.push('');
    lines.push('| Rule | Occurrences |');
    lines.push('|------|-------------|');

    for (const [ruleId, count] of sortedViolations) {
      const rule = RULES[ruleId];
      lines.push(`| ${rule?.name || ruleId} | ${count} |`);
    }

    lines.push('');
  }

  // Improvement recommendations
  lines.push('## Improvement Recommendations');
  lines.push('');

  if (sortedViolations.length > 0) {
    const topViolation = sortedViolations[0][0];
    const rule = RULES[topViolation];
    if (rule) {
      lines.push(`**Priority:** Address "${rule.name}" - occurring in ${sortedViolations[0][1]} of ${results.length} sessions.`);
      lines.push('');
    }
  }

  if (totalErrors > 0) {
    lines.push('- Focus on eliminating ERROR-level violations (direct code writes, missing delegation)');
  }
  if (avgScore < 80) {
    lines.push('- Consider reviewing orchestrator pattern documentation');
    lines.push('- Use plan mode more consistently for non-trivial tasks');
  }
  if (avgScore >= 80) {
    lines.push('- Good compliance overall! Continue current practices.');
  }

  lines.push('');

  return lines.join('\n');
}

// CLI usage
if (process.argv[1] && process.argv[1].endsWith('orchestrator-rules.mjs')) {
  console.log('Orchestrator Rules Module');
  console.log('');
  console.log('Available rules:');
  for (const rule of Object.values(RULES)) {
    console.log(`  ${rule.id}: ${rule.description} [${rule.severity}]`);
  }
}
