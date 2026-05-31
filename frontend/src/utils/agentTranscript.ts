/**
 * VantaCore Agent Transcript Mode — Preprocessor v1
 *
 * Conservative, deterministic, client-side preprocessor for noisy
 * coding-agent / terminal / AI session transcripts.
 *
 * Purpose: prepare messy agent logs for Memory Capsule compression
 * by reducing noise while preserving developer-critical evidence.
 *
 * Rules:
 *  - 100% client-side, no network, no AI, no external services
 *  - Deterministic: same input always produces the same output
 *  - Conservative: preserves code, commands, errors, file paths, URLs,
 *    user constraints, continuity signals, and git context
 */



export interface AgentTranscriptPreprocessResult {
  cleanedText: string
  originalChars: number
  cleanedChars: number
  removedNoiseLines: number
  preservedCommandLines: number
  preservedFileRefs: number
}

/* ------------------------------------------------------------------ */
/*  Detection patterns                                                 */
/* ------------------------------------------------------------------ */

/** Lines that look like shell / terminal commands */
const COMMAND_PATTERN = /^\s*(\$|>|#!|npm\s|npx\s|pnpm\s|yarn\s|bun\s|git\s|cd\s|mkdir\s|rm\s|cp\s|mv\s|cat\s|echo\s|curl\s|wget\s|python\s|py\s|node\s|deno\s|cargo\s|rustc\s|go\s|make\s|cmake\s|docker\s|kubectl\s|terraform\s|rg\s|grep\s|find\s|ls\s|dir\s|pwd|pip\s|pip3\s|uv\s|conda\s|brew\s|apt\s|dnf\s|pacman\s|choco\s)/i

/** Lines referencing file paths */
const FILE_PATH_PATTERN = /(?:^|\s)(?:\.{0,2}\/[\w./-]+|[a-zA-Z]:\\[\w.\\/-]+|\w+\/\w+[\w./-]*\.\w{1,10})/

/** Lines containing URLs */
const URL_PATTERN = /https?:\/\/[^\s)]+/

/** Lines with errors, warnings, failures */
const ERROR_WARNING_PATTERN = /\b(error|err|warn(?:ing)?|fail(?:ed|ure)?|exception|panic|fatal|critical|traceback|stack\s*trace|segfault|abort|not\s+found|ENOENT|EACCES|EPERM|TypeError|ReferenceError|SyntaxError|cannot\s+find|could\s+not|unable\s+to)\b/i

/** Lines with build / test / lint / validation signals */
const BUILD_TEST_PATTERN = /\b(build\s+(?:passed|failed|succeeded|error)|lint(?:ed|ing)?|test(?:s|ed|ing)?\s+(?:passed|failed|succeeded|running)|validation\s+(?:passed|failed)|TypeScript\s+error|ESLint|Vite\s+build|tsc|webpack|rollup|esbuild|vitest|jest|mocha|pytest|✓|✗|✘|PASS|FAIL)\b/i

/** Git-related signals */
const GIT_PATTERN = /\b(commit\s+[0-9a-f]{7,40}|merge(?:d)?|rebas(?:e|ed|ing)|cherry-pick|origin\/|HEAD|branch\s|tag\s|push(?:ed)?|pull\s+request|PR\s*#?\d|diff\s+--|patch|stash|checkout|reset\s+--)\b/i

/** Continuity / constraint signals — must never be removed */
const CONTINUITY_PATTERN = /\b(do\s+not|don'?t\s+(?:change|delete|remove|touch|modify|repeat)|blocked|pending|next\s+(?:step|action)|verified|failed|passed|completed|already\s+fixed|leave\s+(?:this\s+)?untouched|scope\s+boundary|current\s+final\s+state|not\s+yet\s+(?:done|implemented|resolved))\b/i

/** Fenced code block markers */
const FENCE_PATTERN = /^\s*(`{3,}|~{3,})/

/** Lines that are pure noise — assistant filler and low-value boilerplate */
const NOISE_PATTERNS = [
  /^\s*(?:Sure|Of course|Certainly|Absolutely|Great|Got it|Understood|No problem|Happy to help|Let me|I'll|I will|I can|I'd be happy|Here's what|Here is what|Let's)\b[.!]?\s*$/i,
  /^\s*(?:assistant|system|user|human|ai|bot|model|tool)\s*[:>|]\s*$/i,
  /^\s*(?:---+|===+|\*\*\*+|___+)\s*$/,
  /^\s*(?:thinking|thought|reasoning)\s*(?:\.{3,}|…)?\s*$/i,
  /^\s*\[(?:thinking|thought|internal)\]/i,
  /^\s*(?:I apologize|Sorry about|My apologies|Apologies for)\b/i,
]

/** Lines that are duplicate-safe to collapse (not code, not commands) */
const isCriticalLine = (line: string): boolean => {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (FENCE_PATTERN.test(trimmed)) return true
  if (COMMAND_PATTERN.test(trimmed)) return true
  if (FILE_PATH_PATTERN.test(trimmed)) return true
  if (URL_PATTERN.test(trimmed)) return true
  if (ERROR_WARNING_PATTERN.test(trimmed)) return true
  if (BUILD_TEST_PATTERN.test(trimmed)) return true
  if (GIT_PATTERN.test(trimmed)) return true
  if (CONTINUITY_PATTERN.test(trimmed)) return true
  return false
}

/* ------------------------------------------------------------------ */
/*  Source marker header                                                */
/* ------------------------------------------------------------------ */

const SOURCE_HEADER = `# VantaCore Agent Transcript Source

source_mode: agent-transcript
preprocessing: conservative client-side cleanup
purpose: preserve developer continuity before Memory Capsule compression

## CLEANED TRANSCRIPT
`

/* ------------------------------------------------------------------ */
/*  Main preprocessor                                                  */
/* ------------------------------------------------------------------ */

export function preprocessAgentTranscript(input: string): AgentTranscriptPreprocessResult {
  const originalChars = input.length

  // 1. Normalize CRLF → LF
  const text = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const lines = text.split('\n')
  const outputLines: string[] = []

  let removedNoiseLines = 0
  let preservedCommandLines = 0
  let preservedFileRefs = 0

  let insideFencedBlock = false
  let consecutiveBlankCount = 0
  let previousLine = ''

  for (const line of lines) {
    const trimmed = line.trim()

    // Track fenced code blocks — never touch content inside them
    if (FENCE_PATTERN.test(trimmed)) {
      insideFencedBlock = !insideFencedBlock
      consecutiveBlankCount = 0
      previousLine = trimmed
      outputLines.push(line)
      continue
    }

    // Preserve everything inside fenced code blocks verbatim
    if (insideFencedBlock) {
      previousLine = trimmed
      outputLines.push(line)
      continue
    }

    // 2. Collapse excessive blank lines (allow max 2 consecutive)
    if (!trimmed) {
      consecutiveBlankCount++
      if (consecutiveBlankCount <= 2) {
        outputLines.push('')
      }
      continue
    }
    consecutiveBlankCount = 0

    // 3. Remove pure noise lines
    const isNoise = NOISE_PATTERNS.some(pattern => pattern.test(trimmed))
    if (isNoise) {
      removedNoiseLines++
      continue
    }

    // 4. Collapse duplicate consecutive non-critical lines
    if (trimmed === previousLine && !isCriticalLine(trimmed)) {
      removedNoiseLines++
      continue
    }

    // Track preserved signals for stats
    if (COMMAND_PATTERN.test(trimmed)) preservedCommandLines++
    if (FILE_PATH_PATTERN.test(trimmed)) preservedFileRefs++

    previousLine = trimmed
    outputLines.push(line)
  }

  // Build final output with source marker header
  const cleanedBody = outputLines.join('\n').replace(/\n{4,}/g, '\n\n\n')
  const cleanedText = SOURCE_HEADER + cleanedBody

  return {
    cleanedText,
    originalChars,
    cleanedChars: cleanedText.length,
    removedNoiseLines,
    preservedCommandLines,
    preservedFileRefs,
  }
}
