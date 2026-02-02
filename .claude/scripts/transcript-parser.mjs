#!/usr/bin/env node
/**
 * Transcript Parser for Claude Code Session Analysis
 *
 * Parses JSONL session transcripts and extracts metrics for orchestrator compliance evaluation.
 *
 * Usage:
 *   import { parseSession, extractMetrics, findSessions } from './transcript-parser.mjs';
 *   const parsed = await parseSession(sessionPath);
 *   const metrics = extractMetrics(parsed);
 */

import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { createInterface } from 'readline';
import { join, basename, dirname } from 'path';
import { createHash } from 'crypto';
import { homedir } from 'os';

/**
 * Hash a project path to find its Claude Code data directory
 * @param {string} projectPath - Absolute path to project
 * @returns {string} - Hashed directory name
 */
export function hashProjectPath(projectPath) {
  // Normalize path separators and remove trailing slashes
  const normalized = projectPath.replace(/\\/g, '/').replace(/\/+$/, '');
  // Claude Code uses the path with dashes instead of separators, colons, spaces, and underscores
  const dashPath = normalized
    .replace(/[/\\:]/g, '-')   // Replace path separators and colons
    .replace(/ /g, '-')         // Replace spaces
    .replace(/_/g, '-')         // Replace underscores
    .replace(/^-+/, '');        // Remove leading dashes
  return dashPath;
}

/**
 * Find Claude Code projects directory
 * @returns {string} - Path to ~/.claude/projects
 */
export function getProjectsDir() {
  return join(homedir(), '.claude', 'projects');
}

/**
 * Find sessions for a project
 * @param {string} projectPath - Project directory path (optional, uses cwd if not provided)
 * @returns {Array<{id: string, path: string, date: Date}>} - List of session info
 */
export function findSessions(projectPath = process.cwd()) {
  const projectHash = hashProjectPath(projectPath);
  const projectDir = join(getProjectsDir(), projectHash);

  if (!existsSync(projectDir)) {
    throw new Error(`No sessions found for project: ${projectPath}\nExpected at: ${projectDir}`);
  }

  // Look for sessions-index.json first
  const indexPath = join(projectDir, 'sessions-index.json');
  if (existsSync(indexPath)) {
    try {
      const index = JSON.parse(readFileSync(indexPath, 'utf-8'));
      if (index.sessions && Array.isArray(index.sessions)) {
        return index.sessions.map(s => ({
          id: s.sessionId,
          path: join(projectDir, `${s.sessionId}.jsonl`),
          date: new Date(s.lastAccessed || s.timestamp),
          name: s.name || s.slug
        })).filter(s => existsSync(s.path));
      }
    } catch (e) {
      // Fall through to directory scanning
    }
  }

  // Fallback: scan for .jsonl files
  const files = readdirSync(projectDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => {
      const fullPath = join(projectDir, f);
      const stats = statSync(fullPath);
      return {
        id: basename(f, '.jsonl'),
        path: fullPath,
        date: stats.mtime
      };
    })
    .sort((a, b) => b.date - a.date);

  return files;
}

/**
 * Get most recent session for a project
 * @param {string} projectPath - Project directory path
 * @returns {{id: string, path: string, date: Date}|null} - Most recent session or null
 */
export function getMostRecentSession(projectPath = process.cwd()) {
  const sessions = findSessions(projectPath);
  return sessions.length > 0 ? sessions[0] : null;
}

/**
 * Parse a session transcript JSONL file
 * @param {string} sessionPath - Path to .jsonl file
 * @returns {Promise<ParsedSession>} - Parsed session data
 */
export async function parseSession(sessionPath) {
  if (!existsSync(sessionPath)) {
    throw new Error(`Session file not found: ${sessionPath}`);
  }

  const messages = [];
  const toolCalls = [];
  const subagentCalls = [];
  let sessionStart = null;
  let sessionEnd = null;
  let sessionId = basename(sessionPath, '.jsonl');

  const fileStream = createReadStream(sessionPath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line);

      // Track timestamps
      if (entry.timestamp) {
        const ts = new Date(entry.timestamp);
        if (!sessionStart || ts < sessionStart) sessionStart = ts;
        if (!sessionEnd || ts > sessionEnd) sessionEnd = ts;
      }

      // Capture session ID from entries if available
      if (entry.sessionId) sessionId = entry.sessionId;

      // Process based on entry type
      if (entry.type === 'user') {
        messages.push({
          type: 'user',
          uuid: entry.uuid,
          timestamp: entry.timestamp,
          content: entry.message?.content,
          isMeta: entry.isMeta || false
        });
      } else if (entry.type === 'assistant') {
        const msg = {
          type: 'assistant',
          uuid: entry.uuid,
          timestamp: entry.timestamp,
          content: entry.message?.content,
          model: entry.message?.model,
          isSubagent: false
        };
        messages.push(msg);

        // Extract tool calls from assistant messages
        if (entry.message?.content && Array.isArray(entry.message.content)) {
          for (const block of entry.message.content) {
            if (block.type === 'tool_use') {
              const toolCall = {
                id: block.id,
                name: block.name,
                input: block.input,
                timestamp: entry.timestamp,
                uuid: entry.uuid,
                isSubagent: false,
                parentToolUseID: entry.parentToolUseID || null
              };
              toolCalls.push(toolCall);

              // Track Task calls (subagent spawns)
              if (block.name === 'Task') {
                subagentCalls.push({
                  id: block.id,
                  description: block.input?.description,
                  prompt: block.input?.prompt,
                  agentType: block.input?.subagent_type,
                  model: block.input?.model,
                  timestamp: entry.timestamp
                });
              }
            }
          }
        }
      } else if (entry.type === 'progress' && entry.data?.type === 'agent_progress') {
        // Subagent messages - tool calls within agents
        const agentMsg = entry.data?.message?.message;
        if (agentMsg?.content && Array.isArray(agentMsg.content)) {
          for (const block of agentMsg.content) {
            if (block.type === 'tool_use') {
              toolCalls.push({
                id: block.id,
                name: block.name,
                input: block.input,
                timestamp: entry.timestamp,
                uuid: entry.uuid,
                isSubagent: true,
                agentId: entry.data?.agentId,
                parentToolUseID: entry.parentToolUseID
              });
            }
          }
        }
      }
    } catch (e) {
      // Skip malformed lines
      console.error(`Warning: Could not parse line: ${e.message}`);
    }
  }

  return {
    sessionId,
    sessionPath,
    sessionStart,
    sessionEnd,
    duration: sessionStart && sessionEnd ? (sessionEnd - sessionStart) / 1000 : 0,
    messages,
    toolCalls,
    subagentCalls
  };
}

/**
 * Extract orchestrator compliance metrics from parsed session
 * @param {ParsedSession} parsed - Parsed session data
 * @returns {SessionMetrics} - Extracted metrics
 */
export function extractMetrics(parsed) {
  const { toolCalls, subagentCalls, sessionStart, sessionEnd, duration } = parsed;

  // Separate main context vs subagent tool calls
  const mainToolCalls = toolCalls.filter(tc => !tc.isSubagent);
  const subagentToolCalls = toolCalls.filter(tc => tc.isSubagent);

  // Plan mode detection
  const planModeEntered = mainToolCalls.some(tc => tc.name === 'EnterPlanMode');
  const planModeExited = mainToolCalls.some(tc => tc.name === 'ExitPlanMode');

  // Agent delegations (Task calls)
  const delegations = mainToolCalls.filter(tc => tc.name === 'Task');
  const delegationCount = delegations.length;

  // File operations in main context
  const mainReads = mainToolCalls.filter(tc => tc.name === 'Read');
  const mainWrites = mainToolCalls.filter(tc => tc.name === 'Write');
  const mainEdits = mainToolCalls.filter(tc => tc.name === 'Edit');

  // Detect code files (for violation detection)
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.cs', '.rb'];
  const isCodeFile = (path) => {
    if (!path) return false;
    return codeExtensions.some(ext => path.toLowerCase().endsWith(ext));
  };

  const mainCodeWrites = mainWrites.filter(tc => isCodeFile(tc.input?.file_path));
  const mainCodeEdits = mainEdits.filter(tc => isCodeFile(tc.input?.file_path));

  // Count consecutive reads in main context (to detect >3 reads pattern)
  let maxConsecutiveReads = 0;
  let currentConsecutiveReads = 0;
  for (const tc of mainToolCalls) {
    if (tc.name === 'Read') {
      currentConsecutiveReads++;
      maxConsecutiveReads = Math.max(maxConsecutiveReads, currentConsecutiveReads);
    } else if (tc.name === 'Task') {
      // Task resets the counter (proper delegation)
      currentConsecutiveReads = 0;
    }
  }

  // Check for Explore agent usage
  const exploreAgentUsed = subagentCalls.some(sc =>
    sc.agentType === 'Explore' || sc.agentType?.toLowerCase().includes('explore')
  );

  // Count files per Task delegation
  const filesPerDelegation = subagentCalls.map(sc => {
    // Count Write/Edit calls attributed to this agent
    const agentWrites = subagentToolCalls.filter(tc =>
      (tc.name === 'Write' || tc.name === 'Edit') &&
      tc.parentToolUseID === sc.id
    );
    return {
      description: sc.description,
      fileCount: agentWrites.length
    };
  });

  const maxFilesInSingleDelegation = Math.max(0, ...filesPerDelegation.map(d => d.fileCount));

  // Compute complexity heuristics
  const totalToolCalls = toolCalls.length;
  const uniqueFilesTouched = new Set([
    ...mainReads.map(tc => tc.input?.file_path),
    ...mainWrites.map(tc => tc.input?.file_path),
    ...mainEdits.map(tc => tc.input?.file_path)
  ].filter(Boolean)).size;

  const isTrivial = totalToolCalls <= 3 && uniqueFilesTouched <= 1 && duration < 120;

  return {
    sessionId: parsed.sessionId,
    duration,
    sessionStart,
    sessionEnd,

    // Plan mode
    planModeEntered,
    planModeExited,

    // Delegations
    delegationCount,
    delegations: delegations.map(d => ({
      description: d.input?.description,
      agentType: d.input?.subagent_type,
      timestamp: d.timestamp
    })),

    // Main context file operations
    mainReadCount: mainReads.length,
    mainWriteCount: mainWrites.length,
    mainEditCount: mainEdits.length,
    maxConsecutiveReads,

    // Code file violations
    mainCodeWriteCount: mainCodeWrites.length,
    mainCodeEditCount: mainCodeEdits.length,
    mainCodeWrites: mainCodeWrites.map(tc => tc.input?.file_path),
    mainCodeEdits: mainCodeEdits.map(tc => tc.input?.file_path),

    // Explore agent
    exploreAgentUsed,

    // Batching
    maxFilesInSingleDelegation,
    filesPerDelegation,

    // Complexity
    totalToolCalls,
    uniqueFilesTouched,
    isTrivial,

    // Subagent summary
    subagentCount: subagentCalls.length,
    subagentToolCalls: subagentToolCalls.length
  };
}

/**
 * Format duration in human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
export function formatDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

// CLI usage
if (process.argv[1] && process.argv[1].endsWith('transcript-parser.mjs')) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Transcript Parser - Parse Claude Code session transcripts

Usage:
  node transcript-parser.mjs [session-id] [--project path] [--list] [--json]

Options:
  --list          List available sessions
  --project path  Specify project path (default: current directory)
  --json          Output as JSON
  --help          Show this help

Examples:
  node transcript-parser.mjs --list
  node transcript-parser.mjs abc123-def456
  node transcript-parser.mjs --json
`);
    process.exit(0);
  }

  const projectPath = args.includes('--project')
    ? args[args.indexOf('--project') + 1]
    : process.cwd();

  const outputJson = args.includes('--json');

  if (args.includes('--list')) {
    try {
      const sessions = findSessions(projectPath);
      if (outputJson) {
        console.log(JSON.stringify(sessions, null, 2));
      } else {
        console.log('Available sessions:');
        for (const s of sessions) {
          console.log(`  ${s.id} - ${s.date.toISOString()} ${s.name || ''}`);
        }
      }
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  } else {
    // Parse a specific session or most recent
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

      parseSession(sessionPath).then(parsed => {
        const metrics = extractMetrics(parsed);
        if (outputJson) {
          console.log(JSON.stringify(metrics, null, 2));
        } else {
          console.log(`Session: ${metrics.sessionId}`);
          console.log(`Duration: ${formatDuration(metrics.duration)}`);
          console.log(`Plan Mode: ${metrics.planModeEntered ? 'Yes' : 'No'}`);
          console.log(`Delegations: ${metrics.delegationCount}`);
          console.log(`Main Context Reads: ${metrics.mainReadCount}`);
          console.log(`Main Context Writes: ${metrics.mainWriteCount}`);
          console.log(`Main Context Code Writes: ${metrics.mainCodeWriteCount}`);
          console.log(`Is Trivial: ${metrics.isTrivial}`);
        }
      });
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  }
}
