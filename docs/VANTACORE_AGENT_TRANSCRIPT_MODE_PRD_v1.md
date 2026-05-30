# VantaCore Agent Transcript Mode PRD v1

**Project:** VantaCore
**Document:** Agent Transcript Mode Product Requirements Document
**Status:** Draft v1
**Recommended first change type:** Docs-only
**Primary boundary:** Preserve the 100% client-side free demo
**Engine boundary:** Do not rewrite or refactor `frontend/src/engine/singularity.ts` unless explicitly approved
**Product identity:** Portable Memory Capsules for LLMs
**Core line:** Compress massive AI sessions into portable memory capsules. 100% client-side.

---

## 1. Executive Summary

Agent Transcript Mode is a proposed VantaCore input mode for messy AI-agent and developer workflow transcripts.

The goal is simple:

> Convert raw coding-agent logs, exported AI sessions, terminal traces, debugging conversations, and continuation handoffs into cleaner source material before VantaCore compresses them into Memory Capsules.

This mode should not replace the existing Memory Capsule engine.

It should sit before the engine as a lightweight client-side preprocessor that helps VantaCore understand noisy agent transcripts more cleanly.

The existing default behavior must remain unchanged.

Agent Transcript Mode is a natural next step because VantaCore has already proven its own use case: a long AI development session can be compressed into a capsule, then used to continue work in a fresh agent or model without restarting from zero.

---

## 2. Product Rationale

Long AI development sessions are messy.

They often include:

* repeated prompts
* tool call noise
* partial commands
* terminal output
* JSONL fragments
* stack traces
* assistant self-talk
* copied file contents
* duplicated diffs
* build logs
* retries
* user corrections
* “already fixed” loops
* final handoff instructions

Most summarizers flatten this material into a weak summary.

VantaCore should do something more valuable:

> Preserve the operational trail while stripping the transcript noise.

Agent Transcript Mode should help a fresh AI agent understand:

* what repo/project this was about
* what files mattered
* what commands were run
* what changed
* what failed
* what passed
* what was decided
* what must not be repeated
* what remains open
* where to continue

This makes VantaCore more than a compression demo.

It becomes a continuity tool for developers, coding agents, and AI power users.

---

## 3. Goals

### 3.1 Primary Goal

Create a clear product and technical plan for a client-side Agent Transcript Mode that prepares raw agent/developer transcripts for Memory Capsule compression.

### 3.2 Product Goals

Agent Transcript Mode should:

* strengthen VantaCore’s positioning as an LLM continuity engine
* support coding-agent continuation workflows
* improve the quality of compressed capsules from noisy logs
* preserve developer-critical evidence
* avoid backend complexity
* avoid changing the default compression behavior
* make VantaCore more compelling before CLI/MCP work begins

### 3.3 Technical Goals

The first implementation should:

* run 100% in the browser
* be optional
* preserve the existing default path
* avoid changes to the core compression engine
* use a small preprocessor utility if needed
* keep all state local
* add no account, auth, payment, API, or cloud dependency

---

## 4. Non-Goals

Agent Transcript Mode must not introduce:

* backend processing
* user accounts
* login/signup
* payment
* licensing enforcement
* cloud sync
* hosted compression
* API endpoints
* CLI implementation
* MCP implementation
* full dashboard rewrite
* major landing page redesign
* engine rewrite
* destructive transcript cleanup

Agent Transcript Mode is not a full parser for every agent format.

It is not a forensic log analysis system.

It is not an IDE integration.

It is not a replacement for the Memory Capsule engine.

---

## 5. Target Users

### 5.1 Primary Users

#### Developers using coding agents

Examples:

* Codex
* Antigravity
* Cursor
* Claude
* ChatGPT
* Cline
* Aider
* local LLM agents
* custom terminal agents

Their pain:

* sessions become too long
* continuation is difficult
* logs contain too much noise
* fresh agents repeat old work
* important decisions get buried
* build/test status gets lost

Agent Transcript Mode value:

* cleaner handoff capsules
* less repeated explanation
* better continuation
* stronger preservation of commands, files, decisions, and blockers

### 5.2 Secondary Users

* prompt engineers
* AI power users
* solo builders
* open-source maintainers
* RAG builders
* technical writers
* researchers using AI-assisted coding workflows

---

## 6. Supported Input Types

Agent Transcript Mode should initially target plain text content from:

* pasted AI chat transcripts
* copied coding-agent logs
* exported `.md` sessions
* exported `.txt` logs
* exported `.json` / `.jsonl` sessions where readable as text
* terminal output copied into text files
* build logs
* debugging sessions
* repo handoff notes
* merged multi-session context files

Supported file extensions should remain aligned with existing VantaCore support unless expanded intentionally:

* `.txt`
* `.md`
* `.json`
* `.csv`
* `.log`

Future support may include:

* `.jsonl`
* `.ndjson`
* `.diff`
* `.patch`

Those future additions should be evaluated separately.

---

## 7. Mode Behavior

Agent Transcript Mode should be an optional input mode.

The default mode remains the current Memory Capsule compression behavior.

Suggested mode labels:

1. **Memory Capsule**

   * Default mode.
   * Current behavior.
   * Best for general AI sessions, notes, logs, and long text.

2. **Agent Transcript**

   * Optional pre-cleaning mode.
   * Best for coding-agent logs, terminal transcripts, exported sessions, and dev handoffs.

The UI should clearly communicate that Agent Transcript Mode prepares the input before compression.

Suggested UI copy:

> Agent Transcript Mode cleans noisy coding-agent logs before creating a Memory Capsule.

---

## 8. Preprocessor Responsibilities

The Agent Transcript preprocessor should be lightweight and conservative.

It should help structure messy logs without deleting important evidence.

### 8.1 Preserve

The preprocessor should preserve:

* project names
* repo paths
* file paths
* file names
* function names
* commands
* command outputs when meaningful
* build/test/lint/validation results
* errors
* stack traces
* warnings
* commits
* branches
* URLs
* package names
* environment variables names, but not secret values
* user decisions
* agent decisions
* “do not repeat” constraints
* final known state
* next actions
* blockers
* completed work

### 8.2 Reduce

The preprocessor may reduce:

* repeated assistant apologies
* repeated generic confirmations
* duplicated prompts
* duplicated command echoes
* excessive empty lines
* repeated JSON wrapper fields
* low-value role labels
* repeated “thinking” markers
* redundant system boilerplate
* repeated browser/tool status messages
* copied blocks that appear many times

### 8.3 Normalize

The preprocessor may normalize:

* role labels
* timestamp noise
* tool-call wrappers
* repeated separators
* over-nested JSON-like chat exports
* inconsistent line endings
* repeated whitespace
* obvious transcript framing noise

### 8.4 Never Remove Blindly

The preprocessor should not blindly remove:

* code blocks
* terminal output
* errors
* warnings
* commands
* diffs
* file paths
* commit hashes
* URLs
* TODOs
* “do not” instructions
* failed tests
* user corrections
* security/privacy constraints

---

## 9. Suggested Preprocessor Output Shape

Before passing text into the existing compression engine, Agent Transcript Mode may prepend a small marker block.

Example:

```markdown
# VantaCore Agent Transcript Source

source_mode: agent-transcript
preprocessing: conservative client-side cleanup
purpose: preserve developer continuity before Memory Capsule compression

## CLEANED TRANSCRIPT
...
```

This marker helps the existing engine detect context without requiring an engine rewrite.

The final compressed output should still be produced by the existing Memory Capsule engine.

---

## 10. Detection Signals

Agent Transcript Mode may detect and preserve high-value lines containing:

### 10.1 Commands

Examples:

```text
git status --short
git diff --stat
npm run build
npm run lint
npm run test
npm run validate:compression
python script.py
py -m pip install
rg -n "pattern"
```

### 10.2 Git / Repo Signals

Examples:

```text
commit
pushed
branch
main
origin/main
pull request
merge
tag
release
git log
git status
```

### 10.3 Build / Test Signals

Examples:

```text
build passed
build failed
lint failed
tests passed
validation passed
TypeScript error
ESLint warning
Vite build
```

### 10.4 File / Artifact Signals

Examples:

```text
frontend/src/engine/singularity.ts
frontend/src/components/HistorySidebar.tsx
README.md
changelog.md
docs/
package.json
```

### 10.5 Continuity Signals

Examples:

```text
already fixed
verified
pending
blocked
next step
do not change
do not repeat
leave this untouched
scope boundary
current final state
```

---

## 11. UI Requirements

The first implementation should be small and surgical.

### 11.1 Input Mode Selector

Add a compact selector near the input area.

Possible placement:

* above the textarea / dropzone
* near the compression button
* inside the input panel header

Suggested labels:

```text
Mode:
[Memory Capsule] [Agent Transcript]
```

Default:

```text
Memory Capsule
```

### 11.2 Helper Text

When Agent Transcript Mode is selected, show short helper copy:

```text
Best for Codex, Antigravity, Cursor, Claude, ChatGPT, terminal logs, build output, and repo handoff transcripts.
```

### 11.3 No UI Overload

Do not add:

* profile dashboard
* many tabs
* complex settings
* advanced toggles
* account gates
* Pro locks
* large new sections

The first UI should be minimal.

---

## 12. Store / State Requirements

The compression store may need a small new state value:

```ts
inputMode: 'memory-capsule' | 'agent-transcript'
```

Suggested store actions:

```ts
setInputMode(mode)
```

History entries may later include:

```ts
sourceMode
```

For the first implementation, history metadata can include the mode if it is easy and safe.

Do not break existing history entries.

Use backward-compatible defaults.

---

## 13. Export Requirements

Exports may later include source mode metadata.

Suggested JSON metadata:

```json
{
  "source_mode": "agent-transcript",
  "format": "memory-capsule"
}
```

Suggested Markdown frontmatter:

```yaml
source_mode: agent-transcript
format: memory-capsule
```

Do not implement advanced export metadata unless it stays small and does not disrupt the existing export system.

The export system must continue to preserve the rule:

> VantaCore does not claim ownership of user input or output content.

---

## 14. Technical Implementation Path

### 14.1 Docs-Only First

Create this PRD before coding:

```text
docs/VANTACORE_AGENT_TRANSCRIPT_MODE_PRD_v1.md
```

### 14.2 Likely Future Files

Potential future implementation files:

```text
frontend/src/utils/agentTranscript.ts
frontend/src/stores/compressionStore.ts
frontend/src/components/TextInput.tsx
frontend/src/components/DropZone.tsx
frontend/src/components/CompressButton.tsx
frontend/src/components/OutputSection.tsx
frontend/src/components/HistorySidebar.tsx
```

### 14.3 Files To Avoid Touching Initially

Do not touch unless explicitly approved:

```text
frontend/src/engine/singularity.ts
frontend/scripts/validate-compression.ts
```

The engine and validation gate should remain stable.

---

## 15. Suggested `agentTranscript.ts` Responsibilities

A future `agentTranscript.ts` utility may expose:

```ts
export type InputMode = 'memory-capsule' | 'agent-transcript'

export interface AgentTranscriptPreprocessResult {
  cleanedText: string
  originalChars: number
  cleanedChars: number
  removedNoiseLines: number
  preservedCommandLines: number
  preservedFileRefs: number
}

export function preprocessAgentTranscript(input: string): AgentTranscriptPreprocessResult
```

The preprocessor should be deterministic.

It should not call external services.

It should not use AI.

It should not require network access.

It should be safe to run in the browser.

---

## 16. Preprocessing Rules v1

Initial conservative cleanup rules may include:

1. Normalize CRLF to LF.
2. Collapse excessive blank lines.
3. Remove repeated separator lines.
4. Normalize common role labels.
5. Remove empty tool wrapper fragments.
6. Collapse duplicate consecutive lines.
7. Preserve fenced code blocks.
8. Preserve command-looking lines.
9. Preserve file path lines.
10. Preserve error/warning/test/build lines.
11. Preserve “do not” and “next action” lines.
12. Add a small source marker header.

Rules must be tested against real transcripts before being made aggressive.

---

## 17. Acceptance Criteria

Agent Transcript Mode planning is accepted when:

* The PRD exists in `docs/`.
* The PRD clearly defines the mode and its boundaries.
* The PRD states that the free demo remains 100% client-side.
* The PRD states that the engine is not rewritten.
* The PRD explains the preprocessor role.
* The PRD lists supported input types.
* The PRD lists preserve/reduce/normalize rules.
* The PRD defines UI expectations.
* The PRD defines risks and mitigations.
* The PRD gives a safe future implementation path.

Future implementation is accepted only when:

* Default Memory Capsule mode still behaves as before.
* Agent Transcript Mode is optional.
* No backend/auth/payment/cloud dependency is added.
* The benchmark validation does not materially regress.
* The build passes.
* Lint is checked.
* History and export behavior remain stable.
* The workspace is not mutated by history export.
* The core compression engine remains untouched unless explicitly approved.

---

## 18. Validation Requirements For Future Implementation

After implementation, run:

```powershell
cd C:\Users\DARK\Desktop\Projects\VantaCore\frontend
npm run build
npm run lint
npm run validate:compression -- "C:\Users\DARK\Desktop\0Energy Check-in.md"
```

The validation benchmark must not materially regress.

Expected current benchmark gate:

```text
input characters: 1,607,470
output characters: 61,109
input estimated tokens: 401,868
output estimated tokens: 15,278
reduction: 96.20%
repeated blocks folded: 114
dictionary references created: 17
clusters detected: 6
code blocks protected: yes (398 fenced; output balanced: yes)
```

---

## 19. Risks

### Risk 1 — Over-cleaning useful evidence

Mitigation:

Keep preprocessing conservative. Preserve commands, errors, file paths, code blocks, warnings, and user constraints.

### Risk 2 — Scope creep into CLI/MCP

Mitigation:

This mode is web-demo/client-side only for now. CLI and MCP remain planning tracks.

### Risk 3 — Engine instability

Mitigation:

Do not rewrite the compression engine. Use a preprocessor before calling the existing engine.

### Risk 4 — UI clutter

Mitigation:

Use one small mode selector and minimal helper text.

### Risk 5 — Confusing users

Mitigation:

Keep default mode as Memory Capsule. Explain Agent Transcript Mode as a specialized cleaner for dev/agent logs.

---

## 20. Deferred Ideas

Do not implement these in v1:

* auto-detect mode
* advanced profile builder
* custom cleanup rules
* JSONL-specific deep parser
* terminal log visualizer
* diff viewer
* batch transcript mode
* folder transcript mode
* CLI transcript command
* MCP transcript tool
* cloud project memory
* account-based history

These can be revisited after the first mode proves useful.

---

## 21. Recommended Next Step

First commit should be docs-only:

```text
docs: add agent transcript mode PRD
```

Then review the PRD before implementation.

After PRD approval, implement the smallest possible client-side version:

1. Add input mode state.
2. Add a compact mode selector.
3. Add conservative preprocessor utility.
4. Route Agent Transcript input through preprocessor before existing engine.
5. Preserve default behavior.
6. Validate benchmark.
7. Report files changed, checks run, git status, boundaries respected, and deferred work.
