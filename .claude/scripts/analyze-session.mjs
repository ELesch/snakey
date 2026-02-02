#!/usr/bin/env node
/**
 * Orchestrator Session Analyzer
 *
 * CLI tool to analyze Claude Code sessions for orchestrator pattern compliance.
 *
 * Usage:
 *   node analyze-session.mjs [session-id] [--batch] [--list] [--project path] [--output path]
 */

import { parseSession, extractMetrics, findSessions, getMostRecentSession, formatDuration } from './transcript-parser.mjs';
import { evaluateRules, generateReport, generateBatchReport } from './orchestrator-rules.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
Orchestrator Session Analyzer

Analyze Claude Code session transcripts for orchestrator pattern compliance.

Usage:
  node analyze-session.mjs [session-id] [options]

Options:
  --list          List available sessions
  --batch         Analyze all sessions
  --project path  Project path (default: current directory)
  --output path   Output directory (default: .claude/audit/analysis)
  --json          Output raw JSON instead of markdown report
  --help          Show this help

Examples:
  node analyze-session.mjs                    # Analyze most recent session
  node analyze-session.mjs abc123             # Analyze specific session
  node analyze-session.mjs --list             # List sessions
  node analyze-session.mjs --batch            # Analyze all sessions
`);
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

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  if (args.includes('--list')) {
    try {
      const sessions = findSessions(projectPath);
      console.log('Available sessions:');
      for (const s of sessions) {
        console.log(`  ${s.id} - ${s.date.toISOString()} ${s.name || ''}`);
      }
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
    return;
  }

  if (args.includes('--batch')) {
    // Batch analysis
    try {
      const sessions = findSessions(projectPath);
      const results = [];

      console.log(`Analyzing ${sessions.length} sessions...`);

      for (const session of sessions) {
        try {
          const parsed = await parseSession(session.path);
          const metrics = extractMetrics(parsed);
          const result = evaluateRules(metrics);
          results.push(result);
          console.log(`  ${session.id.substring(0, 8)}... Score: ${result.score}%`);
        } catch (e) {
          console.log(`  ${session.id.substring(0, 8)}... Error: ${e.message}`);
        }
      }

      if (results.length === 0) {
        console.error('No sessions could be analyzed');
        process.exit(1);
      }

      if (outputJson) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        const report = generateBatchReport(results);
        const dateStr = new Date().toISOString().split('T')[0];
        const outputPath = join(outputDir, `batch-analysis-${dateStr}.md`);
        writeFileSync(outputPath, report);
        console.log(`\nBatch report saved to: ${outputPath}`);

        // Summary
        const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
        console.log(`\nSummary:`);
        console.log(`  Sessions analyzed: ${results.length}`);
        console.log(`  Average score: ${avgScore}%`);
        console.log(`  Total violations: ${results.reduce((sum, r) => sum + r.violations, 0)}`);
      }
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
    return;
  }

  // Single session analysis
  const sessionId = args.find(a => !a.startsWith('-'));
  let sessionPath;

  try {
    if (sessionId) {
      const sessions = findSessions(projectPath);
      const session = sessions.find(s => s.id === sessionId || s.id.startsWith(sessionId));
      if (!session) {
        console.error(`Session not found: ${sessionId}`);
        process.exit(1);
      }
      sessionPath = session.path;
    } else {
      const session = getMostRecentSession(projectPath);
      if (!session) {
        console.error('No sessions found');
        process.exit(1);
      }
      sessionPath = session.path;
    }

    const parsed = await parseSession(sessionPath);
    const metrics = extractMetrics(parsed);
    const result = evaluateRules(metrics);

    if (outputJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const report = generateReport(result);
      const shortId = result.sessionId.substring(0, 8);
      const outputPath = join(outputDir, `${result.sessionId}-analysis.md`);
      writeFileSync(outputPath, report);

      // Console summary
      console.log(`\nOrchestrator Analysis Complete`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Session: ${result.sessionId}`);
      console.log(`Duration: ${formatDuration(metrics.duration)}`);
      console.log(`Score: ${result.score}%`);
      console.log(`Violations: ${result.violations} (${result.errorCount} errors, ${result.warningCount} warnings)`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      if (result.violations > 0) {
        console.log(`\nViolations:`);
        for (const v of result.results.filter(r => !r.passed)) {
          const icon = v.severity === 'error' ? '❌' : '⚠️';
          console.log(`  ${icon} ${v.ruleName}: ${v.message}`);
        }
      }

      console.log(`\nReport saved to: ${outputPath}`);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
