#!/usr/bin/env node
/**
 * Task Linker - Groups Claude Code sessions into tasks for orchestrator analysis
 *
 * A "task" represents a user request that may span multiple sessions:
 * - Initiated by a user request
 * - May have a planning phase in one session and execution in another
 * - Linked by: slug, planContent match, transcript references, timing proximity
 *
 * Usage:
 *   import { findTasks, linkSessions, extractSlug, extractPlanContent } from './task-linker.mjs';
 *   const tasks = await findTasks(projectPath);
 */

import { createReadStream, existsSync, readFileSync } from 'fs';
import { createInterface } from 'readline';
import { join, basename } from 'path';
import { findSessions, parseSession, extractMetrics, getProjectVersion } from './transcript-parser.mjs';

/**
 * @typedef {Object} TaskSession
 * @property {string} sessionId - Session identifier
 * @property {'planning' | 'execution' | 'mixed'} phase - Phase of this session within the task
 * @property {Date} startTime - Session start time
 * @property {Date} endTime - Session end time
 * @property {Object} metrics - Session metrics (from extractMetrics)
 * @property {string} [slug] - Session slug if available
 * @property {string} [planContent] - Plan content if this is an execution session
 * @property {string} [transcriptRef] - Referenced transcript path if any
 */

/**
 * @typedef {Object} Task
 * @property {string} taskId - Unique task identifier (typically first session's ID)
 * @property {string} [slug] - Plan slug if available
 * @property {string} description - Task description from first user message
 * @property {'planning' | 'approved' | 'executing' | 'completed' | 'abandoned'} status
 * @property {Date} startTime - Task start time
 * @property {Date|null} endTime - Task end time
 * @property {TaskSession[]} sessions - Sessions involved in this task
 * @property {number} totalDuration - Total duration in seconds
 * @property {boolean} planModeUsed - Whether plan mode was used in any session
 * @property {boolean} planApproved - Whether ExitPlanMode was called and accepted
 * @property {Object[]} agentDelegations - All agent delegations across sessions
 */

/**
 * @typedef {Object} TaskLinkage
 * @property {string} planningSessionId - Session where planning occurred
 * @property {string} executionSessionId - Session where execution occurred
 * @property {Object} linkSignals - Signals that linked these sessions
 * @property {'high' | 'medium' | 'low'} confidence - Link confidence level
 */

/**
 * Extract slug from a session transcript (fast scan - first 100 entries)
 * @param {string} sessionPath - Path to session JSONL file
 * @returns {Promise<string|null>} - Slug or null if not found
 */
export async function extractSlug(sessionPath) {
  if (!existsSync(sessionPath)) return null;

  const fileStream = createReadStream(sessionPath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  for await (const line of rl) {
    if (count++ > 100) break; // Only scan first 100 entries
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line);
      if (entry.slug) {
        rl.close();
        fileStream.destroy();
        return entry.slug;
      }
    } catch (e) {
      // Skip malformed lines
    }
  }

  return null;
}

/**
 * Extract plan content from a session's first user message
 * @param {string} sessionPath - Path to session JSONL file
 * @returns {Promise<{planContent: string|null, transcriptRef: string|null, isExecution: boolean}>}
 */
export async function extractPlanContent(sessionPath) {
  if (!existsSync(sessionPath)) {
    return { planContent: null, transcriptRef: null, isExecution: false };
  }

  const fileStream = createReadStream(sessionPath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  for await (const line of rl) {
    if (count++ > 50) break; // Only scan first 50 entries
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line);

      // Look for user messages with planContent field or "Implement the following plan:" pattern
      if (entry.type === 'user') {
        const content = entry.message?.content || '';
        const planContent = entry.planContent || null;
        const isExecution = content.includes('Implement the following plan:');

        // Extract transcript reference from content
        let transcriptRef = null;
        const transcriptMatch = content.match(/read the full transcript at:\s*([^\s\n]+)/i);
        if (transcriptMatch) {
          transcriptRef = transcriptMatch[1];
        }

        if (planContent || isExecution) {
          rl.close();
          fileStream.destroy();
          return { planContent, transcriptRef, isExecution };
        }
      }
    } catch (e) {
      // Skip malformed lines
    }
  }

  return { planContent: null, transcriptRef: null, isExecution: false };
}

/**
 * Check if a session used plan mode (has EnterPlanMode tool call)
 * @param {string} sessionPath - Path to session JSONL file
 * @returns {Promise<{entered: boolean, exited: boolean}>}
 */
export async function checkPlanModeUsage(sessionPath) {
  if (!existsSync(sessionPath)) {
    return { entered: false, exited: false };
  }

  const fileStream = createReadStream(sessionPath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let entered = false;
  let exited = false;

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line);

      // Look for tool_use in assistant messages
      if (entry.type === 'assistant' && entry.message?.content) {
        const content = entry.message.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'tool_use') {
              if (block.name === 'EnterPlanMode') entered = true;
              if (block.name === 'ExitPlanMode') exited = true;
            }
          }
        }
      }
    } catch (e) {
      // Skip malformed lines
    }
  }

  return { entered, exited };
}

/**
 * Get first user prompt from a session (for task description)
 * @param {string} sessionPath - Path to session JSONL file
 * @returns {Promise<string|null>}
 */
export async function getFirstUserPrompt(sessionPath) {
  if (!existsSync(sessionPath)) return null;

  const fileStream = createReadStream(sessionPath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const entry = JSON.parse(line);
      if (entry.type === 'user' && entry.message?.content) {
        rl.close();
        fileStream.destroy();
        // Return full description (up to 1000 chars for reasonable display)
        const content = entry.message.content;
        return content.length > 1000 ? content.substring(0, 1000) + '...' : content;
      }
    } catch (e) {
      // Skip malformed lines
    }
  }

  return null;
}

/**
 * Calculate link confidence between two sessions
 * @param {Object} linkSignals - Signals from link detection
 * @returns {'high' | 'medium' | 'low'}
 */
export function calculateLinkConfidence(linkSignals) {
  let score = 0;

  // planContentMatch is very high confidence
  if (linkSignals.planContentMatch) score += 3;

  // Slug match is high confidence
  if (linkSignals.slugMatch) score += 2;

  // Transcript reference is high confidence
  if (linkSignals.transcriptReference) score += 2;

  // Timing proximity adds confidence
  if (linkSignals.timingProximity !== null) {
    if (linkSignals.timingProximity < 300) score += 1;  // < 5 minutes
    if (linkSignals.timingProximity < 60) score += 1;   // < 1 minute
  }

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

/**
 * Extract session ID from a transcript path reference
 * @param {string} transcriptRef - Transcript path reference
 * @returns {string|null} - Session ID or null
 */
export function extractSessionIdFromPath(transcriptRef) {
  if (!transcriptRef) return null;

  // Match UUID pattern at end of path (before .jsonl)
  const match = transcriptRef.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.jsonl$/i);
  if (match) return match[1];

  return null;
}

/**
 * Link sessions into tasks based on various signals
 * @param {Array<{id: string, path: string, date: Date, name?: string}>} sessions - Session list
 * @param {string} projectPath - Project path for version lookup
 * @returns {Promise<{tasks: Task[], linkages: TaskLinkage[]}>}
 */
export async function linkSessions(sessions, projectPath) {
  // Sort sessions by date (oldest first for processing)
  const sortedSessions = [...sessions].sort((a, b) => a.date - b.date);

  // Extract metadata from each session
  const sessionMeta = new Map();
  for (const session of sortedSessions) {
    const slug = await extractSlug(session.path);
    const { planContent, transcriptRef, isExecution } = await extractPlanContent(session.path);
    const { entered: planModeEntered, exited: planModeExited } = await checkPlanModeUsage(session.path);
    const description = await getFirstUserPrompt(session.path);

    sessionMeta.set(session.id, {
      ...session,
      slug,
      planContent,
      transcriptRef,
      isExecution,
      planModeEntered,
      planModeExited,
      description,
      referencedSessionId: extractSessionIdFromPath(transcriptRef)
    });
  }

  // Find linkages
  const linkages = [];
  const linkedExecutionSessions = new Set();

  // First pass: find explicit transcript references (execution → planning)
  for (const [sessionId, meta] of sessionMeta) {
    if (meta.referencedSessionId && sessionMeta.has(meta.referencedSessionId)) {
      const planningMeta = sessionMeta.get(meta.referencedSessionId);

      // Verify the planning session actually did planning
      if (planningMeta.planModeEntered) {
        const linkSignals = {
          slugMatch: meta.slug === planningMeta.slug && meta.slug !== null,
          planContentMatch: meta.planContent !== null,
          transcriptReference: meta.transcriptRef,
          timingProximity: Math.abs(meta.date - planningMeta.date) / 1000
        };

        linkages.push({
          planningSessionId: meta.referencedSessionId,
          executionSessionId: sessionId,
          linkSignals,
          confidence: calculateLinkConfidence(linkSignals)
        });

        linkedExecutionSessions.add(sessionId);
      }
    }
  }

  // Second pass: find slug-based links for unlinked execution sessions
  for (const [sessionId, meta] of sessionMeta) {
    if (linkedExecutionSessions.has(sessionId)) continue;
    if (!meta.isExecution || !meta.slug) continue;

    // Find planning session with same slug
    for (const [otherSessionId, otherMeta] of sessionMeta) {
      if (otherSessionId === sessionId) continue;
      if (otherMeta.slug !== meta.slug) continue;
      if (!otherMeta.planModeEntered) continue;
      if (otherMeta.date >= meta.date) continue; // Planning must be before execution

      const linkSignals = {
        slugMatch: true,
        planContentMatch: meta.planContent !== null,
        transcriptReference: null,
        timingProximity: Math.abs(meta.date - otherMeta.date) / 1000
      };

      // Only link if confidence is at least medium
      const confidence = calculateLinkConfidence(linkSignals);
      if (confidence !== 'low') {
        linkages.push({
          planningSessionId: otherSessionId,
          executionSessionId: sessionId,
          linkSignals,
          confidence
        });

        linkedExecutionSessions.add(sessionId);
        break; // Only link to first matching planning session
      }
    }
  }

  // Build tasks from linkages and standalone sessions
  const tasks = [];
  const processedSessions = new Set();

  // Group linked sessions into tasks
  const planningToExecutionMap = new Map();
  for (const linkage of linkages) {
    if (!planningToExecutionMap.has(linkage.planningSessionId)) {
      planningToExecutionMap.set(linkage.planningSessionId, []);
    }
    planningToExecutionMap.get(linkage.planningSessionId).push(linkage.executionSessionId);
  }

  // Create tasks from linked sessions
  for (const [planningSessionId, executionSessionIds] of planningToExecutionMap) {
    const planningMeta = sessionMeta.get(planningSessionId);
    const taskSessions = [
      {
        sessionId: planningSessionId,
        phase: 'planning',
        startTime: planningMeta.date,
        endTime: planningMeta.date, // Will be updated with actual metrics
        slug: planningMeta.slug,
        description: planningMeta.description
      }
    ];

    processedSessions.add(planningSessionId);

    for (const execSessionId of executionSessionIds) {
      const execMeta = sessionMeta.get(execSessionId);
      taskSessions.push({
        sessionId: execSessionId,
        phase: 'execution',
        startTime: execMeta.date,
        endTime: execMeta.date, // Will be updated with actual metrics
        slug: execMeta.slug,
        planContent: execMeta.planContent,
        transcriptRef: execMeta.transcriptRef
      });
      processedSessions.add(execSessionId);
    }

    // Sort sessions by time
    taskSessions.sort((a, b) => a.startTime - b.startTime);

    tasks.push({
      taskId: planningSessionId,
      slug: planningMeta.slug,
      description: planningMeta.description || 'No description',
      status: 'completed', // Will be refined when metrics are loaded
      startTime: taskSessions[0].startTime,
      endTime: taskSessions[taskSessions.length - 1].endTime,
      sessions: taskSessions,
      totalDuration: 0, // Calculated when metrics loaded
      planModeUsed: true, // We know planning session used it
      planApproved: planningMeta.planModeExited,
      agentDelegations: []
    });
  }

  // Create standalone tasks for unlinked sessions
  for (const session of sortedSessions) {
    if (processedSessions.has(session.id)) continue;

    const meta = sessionMeta.get(session.id);

    // Determine phase based on session characteristics
    let phase = 'mixed';
    if (meta.planModeEntered && !meta.isExecution) phase = 'planning';
    else if (meta.isExecution && !meta.planModeEntered) phase = 'execution';

    tasks.push({
      taskId: session.id,
      slug: meta.slug,
      description: meta.description || 'No description',
      status: phase === 'execution' ? 'unknown_planning' : (meta.planModeExited ? 'approved' : 'planning'),
      startTime: session.date,
      endTime: session.date,
      sessions: [{
        sessionId: session.id,
        phase,
        startTime: session.date,
        endTime: session.date,
        slug: meta.slug,
        description: meta.description
      }],
      totalDuration: 0,
      planModeUsed: meta.planModeEntered,
      planApproved: meta.planModeExited,
      agentDelegations: []
    });
  }

  // Sort tasks by start time (newest first)
  tasks.sort((a, b) => b.startTime - a.startTime);

  return { tasks, linkages };
}

/**
 * Enrich tasks with full metrics from parsed sessions
 * @param {Task[]} tasks - Tasks to enrich
 * @param {string} projectPath - Project path
 * @returns {Promise<Task[]>} - Enriched tasks
 */
export async function enrichTasksWithMetrics(tasks, projectPath) {
  const projectHash = hashProjectPath(projectPath);
  const projectDir = join(getProjectsDir(), projectHash);

  for (const task of tasks) {
    let totalDuration = 0;
    const allDelegations = [];

    for (const session of task.sessions) {
      const sessionPath = join(projectDir, `${session.sessionId}.jsonl`);
      if (!existsSync(sessionPath)) continue;

      try {
        const parsed = await parseSession(sessionPath, projectPath);
        const metrics = extractMetrics(parsed);

        session.metrics = metrics;
        session.startTime = metrics.sessionStart || session.startTime;
        session.endTime = metrics.sessionEnd || session.endTime;

        totalDuration += metrics.duration;

        // Aggregate delegations
        if (metrics.delegations) {
          allDelegations.push(...metrics.delegations);
        }

        // Update planModeUsed across all sessions
        if (metrics.planModeEntered) {
          task.planModeUsed = true;
        }
        if (metrics.planModeExited) {
          task.planApproved = true;
        }
      } catch (e) {
        console.error(`Error enriching session ${session.sessionId}: ${e.message}`);
      }
    }

    task.totalDuration = totalDuration;
    task.agentDelegations = allDelegations;

    // Update task times based on enriched session data
    if (task.sessions.length > 0) {
      const sortedSessions = [...task.sessions].sort((a, b) =>
        (a.startTime || new Date(0)) - (b.startTime || new Date(0))
      );
      task.startTime = sortedSessions[0].startTime;
      task.endTime = sortedSessions[sortedSessions.length - 1].endTime;
    }

    // Determine task status based on metrics
    if (task.agentDelegations.length > 0 && task.planModeUsed) {
      task.status = 'completed';
    } else if (task.planApproved) {
      task.status = 'approved';
    } else if (task.planModeUsed) {
      task.status = 'planning';
    } else if (task.sessions.some(s => s.phase === 'execution')) {
      task.status = 'unknown_planning';
    }
  }

  return tasks;
}

// Import helper functions from transcript-parser
import { hashProjectPath, getProjectsDir } from './transcript-parser.mjs';

/**
 * Find and link all tasks for a project
 * @param {string} projectPath - Project directory path
 * @returns {Promise<{tasks: Task[], linkages: TaskLinkage[]}>}
 */
export async function findTasks(projectPath = process.cwd()) {
  const sessions = findSessions(projectPath);
  const { tasks, linkages } = await linkSessions(sessions, projectPath);
  const enrichedTasks = await enrichTasksWithMetrics(tasks, projectPath);
  return { tasks: enrichedTasks, linkages };
}

/**
 * Find a task by slug
 * @param {string} slug - Task slug to find
 * @param {string} projectPath - Project directory path
 * @returns {Promise<Task|null>}
 */
export async function findTaskBySlug(slug, projectPath = process.cwd()) {
  const { tasks } = await findTasks(projectPath);
  return tasks.find(t => t.slug === slug) || null;
}

/**
 * Find which task a session belongs to
 * @param {string} sessionId - Session ID to find
 * @param {string} projectPath - Project directory path
 * @returns {Promise<{task: Task|null, session: TaskSession|null}>}
 */
export async function findTaskForSession(sessionId, projectPath = process.cwd()) {
  const { tasks } = await findTasks(projectPath);

  for (const task of tasks) {
    const session = task.sessions.find(s =>
      s.sessionId === sessionId || s.sessionId.startsWith(sessionId)
    );
    if (session) {
      return { task, session };
    }
  }

  return { task: null, session: null };
}

// CLI usage
if (process.argv[1] && process.argv[1].endsWith('task-linker.mjs')) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Task Linker - Group Claude Code sessions into tasks

Usage:
  node task-linker.mjs [options]

Options:
  --list          List all tasks
  --slug <slug>   Find task by slug
  --session <id>  Find task containing session
  --project path  Project path (default: current directory)
  --json          Output as JSON
  --help          Show this help

Examples:
  node task-linker.mjs --list
  node task-linker.mjs --slug goofy-twirling-orbit
  node task-linker.mjs --session c497b649
`);
    process.exit(0);
  }

  const projectPath = args.includes('--project')
    ? args[args.indexOf('--project') + 1]
    : process.cwd();

  const outputJson = args.includes('--json');

  (async () => {
    try {
      if (args.includes('--slug')) {
        const slug = args[args.indexOf('--slug') + 1];
        const task = await findTaskBySlug(slug, projectPath);

        if (!task) {
          console.error(`No task found with slug: ${slug}`);
          process.exit(1);
        }

        if (outputJson) {
          console.log(JSON.stringify(task, null, 2));
        } else {
          console.log(`Task: ${task.slug || task.taskId}`);
          console.log(`Status: ${task.status}`);
          console.log(`Sessions: ${task.sessions.length}`);
          console.log(`Duration: ${Math.round(task.totalDuration / 60)}m`);
          console.log(`Plan Mode: ${task.planModeUsed ? 'Yes' : 'No'}`);
          console.log(`Delegations: ${task.agentDelegations.length}`);
          console.log('\nSessions:');
          for (const s of task.sessions) {
            console.log(`  ${s.sessionId.substring(0, 8)}... [${s.phase}]`);
          }
        }
      } else if (args.includes('--session')) {
        const sessionId = args[args.indexOf('--session') + 1];
        const { task, session } = await findTaskForSession(sessionId, projectPath);

        if (!task) {
          console.error(`No task found containing session: ${sessionId}`);
          process.exit(1);
        }

        if (outputJson) {
          console.log(JSON.stringify({ task, session }, null, 2));
        } else {
          console.log(`Session ${sessionId} belongs to task:`);
          console.log(`  Task ID: ${task.taskId}`);
          console.log(`  Slug: ${task.slug || 'none'}`);
          console.log(`  Phase: ${session.phase}`);
          console.log(`  Status: ${task.status}`);
          console.log(`  Total Sessions: ${task.sessions.length}`);
        }
      } else {
        // List all tasks
        const { tasks, linkages } = await findTasks(projectPath);

        if (outputJson) {
          console.log(JSON.stringify({ tasks, linkages }, null, 2));
        } else {
          console.log(`Found ${tasks.length} tasks (${linkages.length} cross-session linkages)\n`);

          for (const task of tasks.slice(0, 20)) { // Show first 20
            const slugDisplay = task.slug ? `[${task.slug}]` : '';
            const sessionsInfo = task.sessions.length > 1
              ? `(${task.sessions.length} sessions)`
              : '';
            const durationMin = Math.round(task.totalDuration / 60);

            console.log(`${task.taskId.substring(0, 8)}... ${slugDisplay} ${sessionsInfo}`);
            console.log(`  Status: ${task.status} | Duration: ${durationMin}m | Delegations: ${task.agentDelegations.length}`);
            console.log(`  ${task.description.substring(0, 80)}...`);
            console.log('');
          }

          if (tasks.length > 20) {
            console.log(`... and ${tasks.length - 20} more tasks`);
          }
        }
      }
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  })();
}
