import type { CompressionResult } from './types'

const TOKEN_ESTIMATION_METHOD = 'approximate: ceil(characters / 4)'
const MAX_CLUSTERS = 6
const MAX_DETAIL_SNIPPETS_PER_CLUSTER = 32
const NARRATIVE_BUDGET = 6400

type ReferenceKind = 'CMD' | 'PROMPT' | 'CODE'

interface ReferenceEntry {
  id: string
  kind: ReferenceKind
  text: string
  count: number
  variants: string[]
}

interface FoldResult {
  entries: ReferenceEntry[]
  foldedOccurrences: number
}

interface Segment {
  text: string
  index: number
  total: number
  start: number
  marker: TimelineMarker
}

type TimelineMarker = 'early-session' | 'mid-session' | 'late-session' | 'final-known-state'

interface TopicDefinition {
  label: string
  terms: string[]
}

interface TopicScore {
  label: string
  score: number
  marker: TimelineMarker
}

interface ClusterDraft {
  label: string
  score: number
  segments: Segment[]
}

interface Evidence {
  completed: string[]
  verified: string[]
  pending: string[]
  next: string[]
  doNot: string[]
  decisions: string[]
  artifacts: string[]
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at',
  'from', 'by', 'for', 'with', 'in', 'on', 'to', 'of', 'is', 'it', 'that',
  'this', 'these', 'those', 'be', 'been', 'being', 'have', 'has', 'had',
  'does', 'did', 'can', 'could', 'would', 'may', 'might', 'must',
  'up', 'out', 'new', 'get', 'use', 'using', 'used',
  't', 's', 'm', 're', 've', 'd', 'll',
])

const TECH_LANG_NAMES = new Set([
  'rust', 'python', 'typescript', 'javascript', 'golang', 'kotlin', 'swift',
  'ruby', 'scala', 'haskell', 'erlang', 'elixir', 'clojure', 'dart', 'julia',
  'fortran', 'cobol', 'lua', 'perl', 'bash', 'powershell', 'zig', 'nim',
  'ocaml', 'fsharp', 'csharp', 'cplusplus', 'cpp', 'objectivec',
])

const CONTINUITY_TERMS = new Set([
  'user_wants', 'agent_should', 'already_fixed', 'do_not', 'do', 'not',
  'want', 'wants', 'wanted', 'should', 'already', 'fixed', 'verified',
  'pending', 'next', 'blocked', 'blocker', 'passed', 'failed', 'commit',
  'committed', 'pushed', 'deployed', 'deploy', 'done', 'completed',
  'complete', 'remaining', 'open', 'todo', 'review',
])

const GENERIC_TOPIC_WORDS = new Set([
  'please', 'like', 'handle', 'make', 'need', 'needs', 'show', 'keep', 'must',
  'your', 'will', 'just', 'into', 'over', 'also', 'than', 'them', 'they',
  'what', 'which', 'while', 'about', 'after', 'before', 'again', 'there',
  'their', 'file', 'files', 'test', 'tests', 'code', 'true', 'false', 'null',
  'string', 'return', 'export', 'import', 'const', 'function', 'message',
  'content', 'text', 'step', 'turn', 'sure', 'user', 'assistant', 'human',
  'system', 'model', 'expected', 'received', 'applies', 'lines', 'changed',
  'path', 'none', 'clearly', 'detected', 'session', 'final', 'early', 'late',
  'known', 'state', 'general', 'continuity', 'cluster', 'signal', 'signals',
  'updated', 'created', 'added', 'build', 'class', 'public', 'private',
  'package', 'decision', 'change', 'changes', 'error', 'data', 'type', 'name',
  'fail', 'npm', 'node', 'git', 'http', 'https', 'www', 'com', 'org',
  'value', 'args', 'argument', 'arguments', 'tool', 'call', 'exec', 'output',
  'input', 'result', 'results', 'same', 'only', 'still', 'into', 'each',
  'index', 'server', 'main', 'app', 'job', 'jobs', 'origin', 'origins',
  'isolated', 'babe', 'html', 'css', 'json', 'png', 'jpg', 'jpeg', 'svg', 'txt',
])

const GENERIC_PATH_DIRS = new Set([
  'src', 'lib', 'dist', 'node_modules', 'app', 'components', 'pages', 'public',
  'scripts', 'test', 'tests', 'docs', 'frontend', 'backend', 'pkg', 'internal',
  'cmd', 'bin', 'build', 'static', 'assets', 'styles', 'hooks', 'utils', 'types',
  '__tests__', 'spec', 'source',
])

const PATH_NAMED_ROOTS = new Set([
  'projects', 'repos', 'repo', 'workspace', 'workspaces', 'code', 'sites', 'developer',
])

const PATH_HOME_ROOTS = new Set(['home', 'users', 'user', 'desktop', 'documents'])

const PATH_MARKERS = new Set(['src', 'source', 'static', 'lib', 'app'])

const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bdo\s+not\b|\bdon't\b|\bdont\b/gi, 'do_not'],
  [/\buser\s+wants?\b/gi, 'user_wants'],
  [/\bagent\s+should\b/gi, 'agent_should'],
  [/\balready\s+fixed\b/gi, 'already_fixed'],
]

const COMPLETED_PATTERN = /\b(completed?|done|fixed|already fixed|implemented|added|updated|created|committed|pushed|deployed|published|submitted|approved|resolved|closed|finished)\b/i
const VERIFIED_PATTERN = /\b(verified|validated|tested|passed|confirmed|build succeeded|build passed|checks passed|works|live|screenshot|previewed)\b/i
const PENDING_PATTERN = /\b(pending|open loop|todo|needs?|next|remaining|still|blocker|blocked|failed|error|waiting|review required|not done|must)\b/i
const NEXT_PATTERN = /\b(next|continue|follow up|remaining|should now|likely step|where to continue|resume)\b/i
const DO_NOT_PATTERN = /\b(do not|don't|dont|avoid|leave|preserve|keep same|same layout|same color|do not redesign|do not touch|do not repeat|without changing|no redesign)\b/i
const DECISION_PATTERN = /\b(decided|decision|chose|selected|agreed|accepted|rejected|switched|kept|keep|will use|direction|scope)\b/i
const SIGNAL_PATTERN = /\b(user wants|agent should|already fixed|verified|pending|next|blocked|passed|failed|commit|pushed|deployed|do not|todo|remaining|open loop)\b/i

const COMMAND_PATTERN = /^(?:PS\s+[A-Z]:\\.*?>\s*)?(?:\$|>)?\s*(?:git|rg|npm|pnpm|yarn|node|npx|powershell|pwsh|curl|wrangler|vercel|python|py|tsc|vite|gh|cat|ls|dir|Get-ChildItem|Select-String|Start-Process|netstat|tasklist|taskkill|code)\b/i
const FILE_OR_URL_PATTERN = /(?:https?:\/\/[^\s)<>"']+|[A-Za-z]:\\[^\s<>"']+|(?:[\w.-]+\/)+[\w.-]+\.[A-Za-z0-9]+|\b[\w.-]+\.(?:tsx|ts|jsx|js|json|md|txt|html|css|png|jpg|jpeg|webp|xml|yml|yaml|toml|py|sh|ps1|bat|log)\b)/g
const REFERENCE_PATTERN = /\[(?:CMD|PROMPT|CODE)-\d{2}\]/

export class Singularity {
  private guillotine: Set<string>

  constructor() {
    this.guillotine = new Set([
      'currently', 'presently', 'carefully', 'specifically', 'actually',
      'manually', 'problem', 'issue', 'message', 'instruction', 'guidance',
      'feedback', 'regarding', 'another', 'implementing', 'refining',
      'investigating', 'attempt', 'seems', 'realize', 'focused', 'critical',
      'previous', 'analyzing', 'correcting', 'finalizing', 'integrating',
      'addressing', 'following', 'ensuring', 'honing', 'working', 'trying',
      'looking', 'started', 'starting', 'thinking', 'thought', 'know',
      'knows', 'believe', 'believes', 'said', 'told', 'asked', 'claimed',
      'seriously', 'perfectly', 'beautifully', 'purely', 'simply', 'easily',
      'immediately', 'available', 'included', 'includes', 'including',
      'action', 'bad', 'good', 'unused', 'adding', 'hope', 'fine',
      'wonderful', 'maddening', 'nasty', 'silly', 'stupid', 'clearly',
      'likely', 'possibly', 'truly', 'sure', 'exactly', 'absolutely',
      'none', 'them', 'even', 'having', 'where', 'most', 'whenever',
      'sometimes', 'besides', 'also', 'whether', 'easy', 'because',
      'other', 'hand', 'directly', 'better', 'there', 'something',
      'anything', 'everything', 'nothing', 'everyone', 'anyone', 'someone',
      'basically', 'really', 'very', 'too', 'quite', 'just', 'well', 'now',
      'here', 'yet', 'rather', 'instead', 'towards', 'around', 'love',
      'chat', 'middle', 'while', 'result', 'results', 'tell', 'response',
      'found', 'actual', 'give', 'without', 'ready', 'doing', 'lot', 'some',
      'all', 'they', 'don', 'alt', 'dot', 'will', 'your', 'what', 'let',
      'deep', 'dive', 'look', 'one', 'wow', 'got', 'who', 'nice', 'whats',
      'see', 'facing', 'troubling', 'things', 'came', 'make', 'worse',
      'made', 'previously', 'struggling', 'sticky', 'behind', 'listing',
      'listed', 'viewed', 'leaving', 'search', 'searched', 'capability',
      'capabilities', 'expecting', 'mentioned', 'observed', 'tried',
      'troubleshoot', 'saying', 'discovered', 'proceed', 'question',
      'missed', 'thorough', 'extremely', 'valuable', 'extensive',
      'attempts', 'mention', 'exhaustive', 'searches', 'references',
      'meaning', 'perfect', 'gather', 'extra', 'info', 'maybe', 'looks',
      'sense', 'feeling', 'wrong', 'lost', 'everywhere', 'forgot', 'bucket',
      'feel', 'sitting', 'skipped', 'looked', 'answer', 'hiding', 'plain',
      'sight', 'point', 'contains', 'techniques', 'advanced', 'multiple',
      'layered', 'depth', 'glow', 'outer', 'inner', 'subtle', 'highlight',
      'insight', 'fully', 'based', 'replace', 'apply', 'approach',
      'disable', 'piece', 'include', 'changes', 'tested', 'going', 'same',
      'changed', 'significantly', 'improved', 'integrate', 'much',
      'percentage', 'possibility', 'success', 'probability', 'breakdown',
      'confidence', 'eliminate', 'proven', 'stale', 'common', 'fresh',
      'small', 'chance', 'play', 'level', 'different', 'combo',
      'unpredictable', 'quirks', 'follow', 'cases', 'rapid', 'minor',
      'though', 'simplified', 'help', 'gives', 'fixes', 'surgical',
      'experimental', 'similar', 'worked', 'uncertainty', 'guarantee',
      'perfection', 'until', 'trust', 'come', 'whole', 'trusting',
      'abilities', 'beyond', 'codes', 'means', 'execute', 'warnings',
      'handles', 'directives', 'went', 'accidentally', 'deleted',
      'restore', 'restored', 'positives', 'handled', 'accepted', 'checked',
      'almost', 'bit', 'magic', 'words', 'registered', 'successfully',
      'running', 'afraid', 'remains', 'additionally', 'appearing',
      'removed', 'difficult', 'figure', 'removing', 'created', 'reason',
      'such', 'adjusting', 'feels', 'heavy', 'direction', 'hear', 'loud',
      'deeply', 'symptoms', 'cause', 'pick', 'persistent', 'disappear',
      'creates', 'visual', 'points', 'picked', 'restart', 'causing',
      'generated', 'anywhere', 'extended', 'applying', 'happens', 'inside',
      'draws', 'way', 'known', 'underlying', 'exist', 'latest', 'installed',
      'differently', 'persists', 'enough', 'behavior', 'focus', 'research',
      'suggested', 'workaround', 'interesting', 'dealt', 'various',
      'suggests', 'reverted', 'overwritten', 'given', 'item', 'recurse',
      'continue', 'nuked', 'confirmed', 'removes', 'entirely', 'provides',
      'eliminates', 'ensure', 'since', 'provide', 'finish', 'minutes',
      'finishing', 'kick', 'caused', 'showing', 'sorry', 'interrupt',
      'possible', 'slight', 'idea', 'share', 'opinion', 'brilliant',
      'premium', 'matches', 'technical', 'elegance', 'consistent',
      'respects', 'noticeable', 'aggressive', 'safe', 'bold', 'polished',
      'automatically', 'updated', 'change', 'click', 'trigger', 'refresh',
      'press', 'earlier', 'properly', 'etc', 'current', 'says', 'please',
      'free', 'listen', 'think', 'thing', 'myself', 'yourself', 'raw',
      'codebase', 'snippets', 'generate', 'contain', 'how', 'are', 'you',
      'building', 'comprehensive', 'robust',
    ])
  }

  process(text: string): CompressionResult {
    const startTime = performance.now()
    const originalChars = text.length

    if (!text.trim()) {
      return {
        compressed: '',
        originalChars: 0,
        compressedChars: 0,
        reductionPercent: 0,
        processingTimeMs: 0,
        estimatedTokensBefore: 0,
        estimatedTokensAfter: 0,
        tokenEstimationMethod: TOKEN_ESTIMATION_METHOD,
        repeatedBlocksFolded: 0,
        dictionaryReferencesCreated: 0,
        clustersDetected: 0,
        codeBlocksProtected: 0,
        codeBlocksIntegrityOk: true,
      }
    }

    const source = this.stripExportChrome(text)
    const redacted = this.redactSecrets(source)
    const codeBlocksInInput = this.countFencedCodeBlocks(redacted)
    const fold = this.foldRepeatedBlocks(redacted)
    const capsule = this.renderMemoryCapsule(redacted, fold)
    let compressed = capsule.output.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
    if (originalChars <= 4000 && compressed.length > originalChars) {
      compressed = redacted.length <= originalChars ? redacted : redacted.slice(0, originalChars)
    }
    const compressedChars = compressed.length
    const processingTimeMs = parseFloat((performance.now() - startTime).toFixed(2))

    return {
      compressed,
      originalChars,
      compressedChars,
      reductionPercent: originalChars > 0
        ? parseFloat(((1 - compressedChars / originalChars) * 100).toFixed(2))
        : 0,
      processingTimeMs,
      estimatedTokensBefore: this.estimateTokens(originalChars),
      estimatedTokensAfter: this.estimateTokens(compressedChars),
      tokenEstimationMethod: TOKEN_ESTIMATION_METHOD,
      repeatedBlocksFolded: fold.foldedOccurrences,
      dictionaryReferencesCreated: fold.entries.length,
      clustersDetected: capsule.clustersDetected,
      codeBlocksProtected: codeBlocksInInput,
      codeBlocksIntegrityOk: codeBlocksInInput === this.countFencedCodeBlocks(compressed)
        && !compressed.includes('__VANTA_FENCE_'),
    }
  }

  private renderMemoryCapsule(originalText: string, fold: FoldResult): { output: string; clustersDetected: number } {
    const segments = this.makeSegments(originalText)
    const topics = this.detectTopics(originalText)
    const topicScores = this.detectTopicScores(segments, topics)
    const evidence = this.extractEvidence(segments)
    const clusters = this.buildClusters(segments, topicScores, topics)
    const lines: string[] = []

    lines.push('# VantaCore Memory Capsule')
    lines.push(`token estimate: ${TOKEN_ESTIMATION_METHOD}`)
    lines.push('')
    const stopPoint = this.renderStopPoint(originalText)
    lines.push(...stopPoint)

    lines.push('## SESSION MAP')
    if (topicScores.length) {
      for (const topic of topicScores.slice(0, MAX_CLUSTERS)) {
        lines.push(`- [${topic.marker}] ${topic.label} (${topic.score} signals)`)
      }
    } else {
      lines.push('- [early-session..final-known-state] General session continuity')
    }
    lines.push('')

    const used = new Set<string>()
    for (const line of stopPoint) {
      if (line.startsWith('- ')) used.add(this.detailSignature(line))
    }
    const completed = this.freshLines(evidence.completed, 4, used)
    const verified = this.freshLines(evidence.verified, 4, used)
    const pending = this.freshLines(evidence.pending, 4, used)
    const next = this.freshLines(evidence.next, 4, used)
    const openLoops = this.freshLines([...evidence.pending, ...evidence.next], 6, used)
    const doNot = this.freshLines(evidence.doNot, 6, used)
    const decisions = this.freshLines(evidence.decisions, 6, used)
    const artifacts = this.freshLines(evidence.artifacts, 6, used)

    lines.push('## CURRENT FINAL STATE')
    lines.push(...this.renderStateGroup('completed', completed))
    lines.push(...this.renderStateGroup('verified', verified))
    lines.push(...this.renderStateGroup('pending', pending))
    lines.push(...this.renderStateGroup('next likely step', next))
    lines.push('')

    lines.push('## OPEN LOOPS / NEXT ACTIONS')
    lines.push(...this.renderBulletList(openLoops, 'none clearly detected; continue from final-known-state cluster and re-check latest artifacts'))
    lines.push('')

    lines.push('## DO NOT REPEAT / DO NOT CHANGE')
    lines.push(...this.renderBulletList(doNot, 'no explicit do-not-change instruction detected'))
    lines.push('')

    lines.push('## DECISION LOG')
    lines.push(...this.renderBulletList(decisions, 'no explicit decision statements detected'))
    lines.push('')

    lines.push('## KEY COMMANDS / FILES / ARTIFACTS')
    lines.push(...this.renderBulletList(artifacts, 'no commands/files/domains detected'))
    lines.push('')

    lines.push('## REFERENCE DICTIONARY')
    if (fold.entries.length) {
      for (const entry of fold.entries) {
        lines.push(this.renderReferenceEntry(entry))
      }
    } else {
      lines.push('- no repeated command/prompt/code blocks met folding thresholds')
    }
    lines.push('')

    for (const [clusterIndex, cluster] of clusters.entries()) {
      const clusterId = `CLUSTER-${String(clusterIndex + 1).padStart(2, '0')}`
      const clusterEvidence = this.extractEvidence(cluster.segments)
      const actions = this.freshLines(clusterEvidence.completed, 4, used)
      const clusterDecisions = this.freshLines(clusterEvidence.decisions, 3, used)
      const clusterLoops = this.freshLines(clusterEvidence.pending, 4, used)
      const clusterFiles = this.freshLines(clusterEvidence.artifacts, 5, used)
      const detail = this.freshLines(
        this.selectDetailSegments(cluster.segments)
          .map((segment) => this.renderDetailSnippet(segment, fold.entries))
          .filter((line): line is string => Boolean(line)),
        MAX_DETAIL_SNIPPETS_PER_CLUSTER,
        used,
      )

      lines.push(`## [${clusterId}: ${cluster.label}]`)
      lines.push(`summary: ${this.clusterSummary(cluster, clusterEvidence)}`)
      lines.push('key actions:')
      lines.push(...this.renderBulletList(actions, 'no completed action isolated in this cluster', 4))
      lines.push('decisions:')
      lines.push(...this.renderBulletList(clusterDecisions, 'none isolated', 3))
      lines.push('open loops:')
      lines.push(...this.renderBulletList(clusterLoops, 'none isolated', 4))
      lines.push('important commands/files:')
      lines.push(...this.renderBulletList(clusterFiles, 'none isolated', 5))
      lines.push('compressed detail stream:')
      lines.push(...(detail.length ? detail : ['- no high-signal detail lines isolated']))
      lines.push('')
    }

    if (!clusters.length) {
      const detail = this.freshLines(
        this.selectDetailSegments(segments)
          .map((segment) => this.renderDetailSnippet(segment, fold.entries))
          .filter((line): line is string => Boolean(line)),
        MAX_DETAIL_SNIPPETS_PER_CLUSTER,
        used,
      )
      lines.push('## [CLUSTER-01: General Session Continuity]')
      lines.push('summary: fallback cluster built from high-signal continuity lines')
      lines.push('compressed detail stream:')
      lines.push(...(detail.length ? detail : ['- no high-signal detail lines isolated']))
      lines.push('')
    }

    return { output: this.capNarrative(lines.join('\n')), clustersDetected: Math.max(clusters.length, 1) }
  }

  private foldRepeatedBlocks(text: string): FoldResult {
    const candidateMap = new Map<string, { kind: ReferenceKind; variants: Map<string, number> }>()

    const addCandidate = (kind: ReferenceKind, raw: string) => {
      const textValue = raw.trim()
      if (!textValue) return
      const normalized = this.normalizeForDedupe(kind, textValue)
      if (!normalized || normalized.length < 8) return

      const key = `${kind}:${normalized}`
      const existing = candidateMap.get(key) ?? { kind, variants: new Map<string, number>() }
      existing.variants.set(textValue, (existing.variants.get(textValue) ?? 0) + 1)
      candidateMap.set(key, existing)
    }

    this.eachFencedBlock(text, (block) => {
      if (block.length >= 80) addCandidate('CODE', block)
    })

    for (const match of text.match(/`[^`\n]+`/g) ?? []) {
      const inner = match.slice(1, -1).trim()
      if (this.looksLikeCommand(inner) || inner.length >= 80) addCandidate('CMD', match)
    }

    let insideFence = false
    for (const line of text.split(/\r?\n/)) {
      if (this.isFenceDelimiter(line)) {
        insideFence = !insideFence
        continue
      }
      if (insideFence) continue
      const cleaned = line.trim().replace(/^[-*>]+\s*/, '')
      if (cleaned.length >= 8 && this.looksLikeCommand(cleaned)) {
        addCandidate('CMD', cleaned)
      }
    }

    for (const block of this.splitCandidateBlocks(text)) {
      if (block.length >= 180 && !block.startsWith('```')) {
        addCandidate('PROMPT', block)
      }
    }

    const entries = Array.from(candidateMap.values())
      .map((item) => {
        const variants = Array.from(item.variants.entries()).sort((a, b) => b[1] - a[1])
        const count = variants.reduce((total, [, occurrences]) => total + occurrences, 0)
        return {
          kind: item.kind,
          text: variants[0]?.[0] ?? '',
          count,
          variants: variants.map(([variant]) => variant),
        }
      })
      .filter((entry) => {
        const threshold = 3
        const minLength = entry.kind === 'CMD' ? 8 : 80
        const replacementCost = `[${entry.kind}-00]`.length * entry.count + entry.text.length
        const uncompressedCost = entry.text.length * entry.count
        return entry.count >= threshold && entry.text.length >= minLength && uncompressedCost - replacementCost > 500
      })
      .sort((a, b) => (b.text.length * b.count) - (a.text.length * a.count))
      .slice(0, 50)

    const counters: Record<ReferenceKind, number> = { CMD: 0, PROMPT: 0, CODE: 0 }
    const numberedEntries = entries.map((entry) => {
      counters[entry.kind] += 1
      return { ...entry, id: `${entry.kind}-${String(counters[entry.kind]).padStart(2, '0')}` }
    })

    return {
      entries: numberedEntries,
      foldedOccurrences: numberedEntries.reduce((total, entry) => total + entry.count, 0),
    }
  }

  private applyDictionaryReferences(text: string, entries: ReferenceEntry[]): { text: string; replacements: number } {
    let folded = text
    let replacements = 0
    const codeEntries = entries.filter((entry) => entry.kind === 'CODE')
    const nonCodeEntries = entries.filter((entry) => entry.kind !== 'CODE')

    for (const entry of codeEntries) {
      for (const variant of this.sortedVariants(entry)) {
        const result = this.replaceLiteral(folded, variant, `[${entry.id}]`)
        folded = result.text
        replacements += result.count
      }
    }

    const protectedFences = this.protectFencedCode(folded)
    folded = protectedFences.text

    for (const entry of nonCodeEntries) {
      for (const variant of this.sortedVariants(entry)) {
        const result = this.replaceLiteral(folded, variant, `[${entry.id}]`)
        folded = result.text
        replacements += result.count
      }
    }

    folded = this.restoreProtected(folded, protectedFences.blocks)
    return { text: folded, replacements }
  }

  private sortedVariants(entry: ReferenceEntry): string[] {
    return [...entry.variants].sort((a, b) => b.length - a.length)
  }

  private renderReferenceEntry(entry: ReferenceEntry): string {
    if (entry.kind === 'CMD' && entry.text.length <= 220 && !entry.text.includes('\n')) {
      return `[${entry.id} repeated ${entry.count}x]: ${this.cleanPathText(entry.text)}`
    }

    return `[${entry.id} repeated ${entry.count}x]:\n<<<${entry.id}\n${this.cleanPathText(entry.text)}\n>>>`
  }

  private makeSegments(text: string): Segment[] {
    const normalized = text.replace(/\r\n/g, '\n')
    const protectedFences = this.protectFencedCode(normalized)
    const candidates = protectedFences.text
      .split(/\n{2,}|(?<=\.)\s+(?=(?:User|Assistant|Agent|System|Human)\b)/)
      .flatMap((block) => this.splitOversizedBlock(block, 1800))
      .map((block) => this.restoreProtected(block, protectedFences.blocks).trim())
      .filter((block) => block.length >= 12)

    const fallback = candidates.length ? candidates : this.splitOversizedBlock(normalized, 1200)
    const total = fallback.length
    let cursor = 0
    const located = fallback.map((segmentText) => {
      const found = normalized.indexOf(segmentText, cursor)
      const start = found >= 0 ? found : cursor
      cursor = start + Math.max(segmentText.length, 1)
      return { text: segmentText, start }
    })

    return located.map((item, index) => ({
      text: item.text,
      index,
      total,
      start: item.start,
      marker: this.timelineMarker(item.start, normalized.length),
    }))
  }

  private splitCandidateBlocks(text: string): string[] {
    const protectedFences = this.protectFencedCode(text.replace(/\r\n/g, '\n'))
    return protectedFences.text
      .split(/\n{2,}/)
      .flatMap((block) => this.splitOversizedBlock(block, 2200))
      .map((block) => this.restoreProtected(block, protectedFences.blocks).trim())
      .filter((block) => block.length >= 80)
  }

  private splitOversizedBlock(block: string, maxLength: number): string[] {
    const trimmed = block.trim()
    if (trimmed.length <= maxLength) return trimmed ? [trimmed] : []

    const pieces: string[] = []
    let cursor = 0
    while (cursor < trimmed.length) {
      const target = Math.min(cursor + maxLength, trimmed.length)
      const punctuation = trimmed.lastIndexOf('.', target)
      const newline = trimmed.lastIndexOf('\n', target)
      const splitAt = Math.max(punctuation, newline)
      const end = splitAt > cursor + maxLength * 0.45 ? splitAt + 1 : target
      pieces.push(trimmed.slice(cursor, end).trim())
      cursor = end
    }
    return pieces.filter(Boolean)
  }

  private detectTopics(text: string): TopicDefinition[] {
    const project = this.projectNames(text)[0] ?? ''
    const projectKey = project.toLowerCase()
    const topics: TopicDefinition[] = []
    const seen = new Set<string>()
    const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    for (const term of this.distinctiveTerms(this.topicSourceText(text))) {
      if (term === projectKey || seen.has(term) || topics.length >= MAX_CLUSTERS) continue
      seen.add(term)
      topics.push({
        label: project ? `${project} ${term}` : term,
        terms: [escape(term)],
      })
    }
    if (!topics.length && project) {
      topics.push({ label: project, terms: [escape(projectKey)] })
    }
    return topics
  }

  private topicSourceText(text: string): string {
    const userText = this.extractTurns(text)
      .filter((turn) => turn.role === 'user')
      .map((turn) => turn.text)
      .join('\n')
    const source = userText.trim().length >= 24 ? userText : text
    return source
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim()
        return trimmed.length > 0 && !this.isToolPayload(trimmed) && !/^exec:\s+/i.test(trimmed) && !trimmed.startsWith('[') && !trimmed.startsWith('{')
      })
      .join('\n')
  }

  private projectNames(text: string): string[] {
    const counts = new Map<string, { count: number; label: string }>()
    for (const path of this.pathHits(text)) {
      const name = this.projectFromPath(path)
      const key = name.toLowerCase()
      if (!name || key.length < 3 || this.isGenericTopic(key)) continue
      const existing = counts.get(key)
      if (existing) existing.count += 1
      else counts.set(key, { count: 1, label: name })
    }
    return [...counts.values()]
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 3)
      .map((item) => item.label)
  }

  private pathHits(text: string): string[] {
    const hits: string[] = []
    const windows = /[A-Za-z]:(?:\\+|\/)[^\s"'<>|]+/g
    const posix = /(?:^|[\s"'`(])((?:[\w.-]+\/)+[\w.-]+\.[A-Za-z0-9]+)/gm
    let match: RegExpExecArray | null
    while ((match = windows.exec(text))) hits.push(match[0].replace(/[),.;:]+$/, ''))
    while ((match = posix.exec(text))) hits.push(match[1])
    return hits
  }

  private pathSegments(raw: string): string[] {
    return this.normalizePath(raw)
      .replace(/^[A-Za-z]:/, '')
      .split(/[/\\]+/)
      .map((part) => part.replace(/^["']+|["']+$/g, '').trim())
      .filter((part) => part.length > 0 && !/^[A-Za-z]:$/.test(part))
      .map((part) => this.restoreChoppedSegment(part))
  }

  // JSON string escapes are separators. Collapse `\\` first so a real segment
  // such as `tests` is not eaten, then treat a leftover `\n` / `\t` / `\r` as
  // a separator too. The escape letter must not stay glued to the next piece.
  private normalizePath(raw: string): string {
    return raw
      .replace(/\\r\\n/g, '/')
      .replace(/\\\\/g, '/')
      .replace(/\\n/g, '/')
      .replace(/\\t/g, '/')
      .replace(/\\r/g, '/')
      .replace(/\\"/g, '"')
  }

  private restoreChoppedSegment(part: string): string {
    if (/^ests$/i.test(part)) return 'tests'
    if (/^est(?=[_.])/i.test(part)) return `t${part}`
    if (/^emp$/i.test(part)) return 'temp'
    if (/^mp$/i.test(part)) return 'tmp'
    if (/^ew$/i.test(part)) return 'new'
    if (/^ode_modules$/i.test(part)) return 'node_modules'
    if (/^esults$/i.test(part)) return 'results'
    if (/^eadme(?:\.[A-Za-z0-9]+)?$/i.test(part)) return `r${part}`
    return part
  }

  private cleanDisplayPath(raw: string): string {
    if (!/\\/.test(raw)) return raw
    const segments = this.pathSegments(raw)
    if (!segments.length) return raw
    const drive = raw.match(/^[A-Za-z]:/)?.[0]
    return drive ? `${drive}\\${segments.join('\\')}` : segments.join('/')
  }

  private cleanPathText(text: string): string {
    if (!text.includes('\\')) return text
    const normalized = this.restoreLooseSegments(this.normalizePath(text))
    const hits = [...this.pathHits(normalized)].sort((a, b) => b.length - a.length)
    let cleaned = normalized
    for (const hit of hits) {
      const display = this.cleanDisplayPath(hit)
      if (!display || display === hit) continue
      cleaned = cleaned.split(hit).join(display)
    }
    return cleaned
  }

  private restoreLooseSegments(text: string): string {
    return text.split(/([/\\])/).map((part) => this.restoreChoppedSegment(part)).join('')
  }

  private presentFile(token: string): string {
    const cleaned = this.cleanDisplayPath(this.restoreLooseSegments(this.normalizePath(token)))
    return cleaned.replace(/(^|[\\/])t(?=test[_.-]|suno-)/gi, '$1')
  }

  private projectFromPath(raw: string): string {
    const segments = this.pathSegments(raw)
    const last = segments[segments.length - 1] ?? ''
    const file = /\.[A-Za-z0-9]+$/.test(last) ? segments.pop() ?? '' : ''
    const dirs = segments.filter((part) => !/^[A-Za-z]:$/.test(part))
    const isRoot = (part: string) => {
      const key = part.toLowerCase()
      return key.length < 2 || GENERIC_PATH_DIRS.has(key) || PATH_NAMED_ROOTS.has(key) || PATH_HOME_ROOTS.has(key)
    }
    for (let index = dirs.length - 1; index >= 0; index -= 1) {
      if (!PATH_NAMED_ROOTS.has(dirs[index].toLowerCase())) continue
      for (let next = index + 1; next < dirs.length; next += 1) {
        if (!isRoot(dirs[next]) && !this.isGenericTopic(dirs[next])) return dirs[next]
      }
    }
    for (let index = 0; index < dirs.length; index += 1) {
      if (!PATH_MARKERS.has(dirs[index].toLowerCase())) continue
      const parent = index > 0 ? dirs[index - 1] : ''
      if (parent && !isRoot(parent) && !this.isGenericTopic(parent)) return parent
    }
    const desktopAt = dirs.findIndex((part) => part.toLowerCase() === 'desktop')
    if (desktopAt >= 0) {
      for (let next = desktopAt + 1; next < dirs.length; next += 1) {
        if (!isRoot(dirs[next]) && !this.isGenericTopic(dirs[next])) return dirs[next]
      }
    }
    const homeAt = dirs.findIndex((part) => ['home', 'users', 'user'].includes(part.toLowerCase()))
    if (homeAt >= 0) {
      for (let next = homeAt + 2; next < dirs.length; next += 1) {
        if (!isRoot(dirs[next]) && !this.isGenericTopic(dirs[next])) return dirs[next]
      }
    }
    for (const dir of dirs) {
      if (!isRoot(dir) && !this.isGenericTopic(dir)) return dir
    }
    const stem = (file || last).replace(/\..*$/, '')
    if (!stem || this.isGenericTopic(stem)) return ''
    return stem
  }

  private isGenericTopic(name: string): boolean {
    const key = name.toLowerCase()
    return key.length < 3 || GENERIC_TOPIC_WORDS.has(key) || GENERIC_PATH_DIRS.has(key) || PATH_NAMED_ROOTS.has(key) || PATH_HOME_ROOTS.has(key)
  }

  private distinctiveTerms(text: string): string[] {
    const counts = new Map<string, number>()
    const words = text.toLowerCase().match(/[a-z][a-z0-9_-]{2,}/g) ?? []
    const minCount = text.length < 4000 ? 1 : 2
    for (const word of words) {
      if (STOP_WORDS.has(word) || this.guillotine.has(word) || GENERIC_TOPIC_WORDS.has(word) || GENERIC_PATH_DIRS.has(word) || CONTINUITY_TERMS.has(word)) continue
      if (TECH_LANG_NAMES.has(word)) continue
      counts.set(word, (counts.get(word) ?? 0) + 1)
    }
    return [...counts.entries()]
      .filter(([, count]) => count >= minCount)
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length || a[0].localeCompare(b[0]))
      .slice(0, MAX_CLUSTERS)
      .map(([word]) => word)
  }

  private detectTopicScores(segments: Segment[], topics: TopicDefinition[]): TopicScore[] {
    const scores = topics.map((topic) => {
      let score = 0
      const markerScores = new Map<TimelineMarker, number>()

      for (const segment of segments) {
        const segmentScore = this.topicScoreForText(topic, segment.text)
        if (!segmentScore) continue
        score += segmentScore
        markerScores.set(segment.marker, (markerScores.get(segment.marker) ?? 0) + segmentScore)
      }

      return {
        label: topic.label,
        score,
        marker: this.highestMarker(markerScores),
      }
    })

    return scores
      .filter((topic) => topic.score > 0)
      .sort((a, b) => b.score - a.score)
  }

  private buildClusters(segments: Segment[], topicScores: TopicScore[], topics: TopicDefinition[]): ClusterDraft[] {
    const selectedTopics = topicScores.slice(0, MAX_CLUSTERS).map((topic) => topic.label)
    const clusters = new Map<string, ClusterDraft>()

    for (const label of selectedTopics) {
      clusters.set(label, { label, score: 0, segments: [] })
    }

    const generalLabel = 'General Continuity / Open Threads'

    for (const segment of segments) {
      const best = this.bestTopicForSegment(segment, selectedTopics, topics)
      const signalScore = this.signalScore(segment.text)
      if (!best && signalScore < 2) continue

      const label = best?.label ?? generalLabel
      const cluster = clusters.get(label) ?? { label, score: 0, segments: [] }
      const score = (best?.score ?? 0) + signalScore
      cluster.score += score
      cluster.segments.push(segment)
      clusters.set(label, cluster)
    }

    return Array.from(clusters.values())
      .filter((cluster) => cluster.segments.length)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CLUSTERS)
  }

  private bestTopicForSegment(segment: Segment, labels: string[], topics: TopicDefinition[]): { label: string; score: number } | null {
    let best: { label: string; score: number } | null = null
    for (const label of labels) {
      const topic = topics.find((candidate) => candidate.label === label)
      if (!topic) continue
      const score = this.topicScoreForText(topic, segment.text)
      if (score > 0 && (!best || score > best.score)) best = { label, score }
    }
    return best
  }

  private topicScoreForText(topic: TopicDefinition, text: string): number {
    const lower = text.toLowerCase()
    let score = 0
    for (const term of topic.terms) {
      const matches = lower.match(new RegExp(`\\b${term}\\b`, 'g'))
      score += matches?.length ?? 0
    }
    return score
  }

  private highestMarker(scores: Map<TimelineMarker, number>): TimelineMarker {
    let best: TimelineMarker = 'early-session'
    let bestScore = -1
    for (const [marker, score] of scores.entries()) {
      if (score > bestScore) {
        best = marker
        bestScore = score
      }
    }
    return best
  }

  private extractEvidence(segments: Segment[]): Evidence {
    const completed: string[] = []
    const verified: string[] = []
    const pending: string[] = []
    const next: string[] = []
    const doNot: string[] = []
    const decisions: string[] = []
    const artifacts: string[] = []

    for (const segment of segments) {
      const stripped = this.stripToolPayloads(segment.text)
      for (const summary of stripped.summaries) artifacts.push(summary)
      const source = stripped.prose
      if (source.trim().length < 12) continue

      for (const sentence of this.evidenceSentences(source)) {
        const bucket = this.classifyEvidence(sentence)
        if (!bucket) continue
        const line = `[${segment.marker}] ${sentence}`
        if (bucket === 'completed') completed.push(line)
        else if (bucket === 'verified') verified.push(line)
        else if (bucket === 'pending') pending.push(line)
        else if (bucket === 'next') next.push(line)
        else if (bucket === 'doNot') doNot.push(line)
        else decisions.push(line)
      }

      for (const artifact of this.extractArtifacts(source)) {
        artifacts.push(artifact)
      }
    }

    return {
      completed: this.uniquePriority(this.sortEvidenceByTimeline(completed), 7),
      verified: this.uniquePriority(this.sortEvidenceByTimeline(verified), 7),
      pending: this.uniquePriority(this.sortEvidenceByTimeline(pending), 9),
      next: this.uniquePriority(this.sortEvidenceByTimeline(next), 5),
      doNot: this.uniquePriority(this.sortEvidenceByTimeline(doNot), 7),
      decisions: this.uniquePriority(this.sortEvidenceByTimeline(decisions), 7),
      artifacts: this.uniquePriority(artifacts, 14),
    }
  }

  private selectDetailSegments(segments: Segment[]): Segment[] {
    const seen = new Set<string>()
    const selected: Segment[] = []
    const scored = segments
      .map((segment) => ({ segment, score: this.signalScore(segment.text) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)

    for (const item of scored) {
      const signature = this.detailSignature(item.segment.text)
      if (seen.has(signature)) continue
      seen.add(signature)
      selected.push(item.segment)
      if (selected.length >= MAX_DETAIL_SNIPPETS_PER_CLUSTER) break
    }

    return selected.sort((a, b) => a.index - b.index)
  }

  private signalScore(text: string): number {
    const stripped = this.stripToolPayloads(text)
    if (stripped.summaries.length && stripped.prose.trim().length < 12) return 0
    const source = stripped.summaries.length ? stripped.prose : text

    let score = 0
    if (SIGNAL_PATTERN.test(source)) score += 4
    if (COMPLETED_PATTERN.test(source)) score += 3
    if (VERIFIED_PATTERN.test(source)) score += 3
    if (PENDING_PATTERN.test(source)) score += 3
    if (DO_NOT_PATTERN.test(source)) score += 4
    if (DECISION_PATTERN.test(source)) score += 2
    if (this.extractArtifacts(source).length) score += 2
    if (this.looksLikeCommand(source.trim())) score += 4
    return score
  }

  private isToolPayload(text: string): boolean {
    const trimmed = text.trim()
    if (/\btool\s*call\s*:/i.test(trimmed)) return true
    if (/^result:\s*[[{]/i.test(trimmed)) return true
    if (trimmed.includes('\\r\\n')) return true
    if (/^exec:\s+\S+/i.test(trimmed) && /[{"]/.test(trimmed)) return true
    if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) return false
    const marks = (trimmed.match(/[{}[\]":]/g) ?? []).length
    return marks >= 6 && /"(?:name|arguments|command|path|tool|ok|file|file_path|error|success|exitCode|stdout)"\s*:/.test(trimmed)
  }

  private resultSummary(text: string): string {
    const quoted = text.match(/"(?:file_path|path|command|cmd)"\s*:\s*"((?:\\.|[^"\\])*)"/)
    const target = this.cleanDisplayPath((quoted?.[1] ?? 'tool result').replace(/\\"/g, '"').replace(/\s+/g, ' ').trim())
    const failed = /"error"\s*:/i.test(text) || /"success"\s*:\s*false/i.test(text) || /"exitCode"\s*:\s*(?!0\b)\d/.test(text)
    const ok = /"success"\s*:\s*true/i.test(text) || /"exitCode"\s*:\s*0\b/.test(text)
    const status = failed ? 'failed' : ok ? 'succeeded' : 'returned'
    return `${target || 'tool result'} ${status}`.slice(0, 160)
  }

  private toolCallSummary(text: string): string {
    const name = text.match(/\b(run_command|read_file|write_file|search_files|apply_patch|execute_command|list_dir)\b/i)?.[1]
    const quoted = text.match(/"(?:path|file_path|command|cmd)"\s*:\s*"((?:\\.|[^"\\]){1,120})"/)?.[1]
    const inline = text.match(/\b(?:read_file|write_file|apply_patch|run_command)\s+([^\s"{]{1,120})/)?.[1]
    const exec = text.match(/^exec:\s+(\S+(?:\s+\S+)?)/im)?.[1]
    const target = this.cleanDisplayPath((quoted ?? inline ?? exec ?? '').replace(/\\"/g, '"'))
    const line = [name, target].filter((part) => Boolean(part)).join(' ').replace(/\s+/g, ' ').trim()
    return (line || 'tool call').slice(0, 160)
  }

  private stripToolPayloads(text: string): { prose: string; summaries: string[] } {
    const kept: string[] = []
    const summaries: string[] = []
    let skipping = false
    let depth = 0
    let sawBrace = false
    let resultPayload = ''

    const finishSkip = () => {
      if (resultPayload) summaries.push(this.resultSummary(resultPayload))
      skipping = false
      depth = 0
      sawBrace = false
      resultPayload = ''
    }

    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      const resultCall = /\bresult:\s*[[{]/i.test(trimmed)
      const toolCall = /\btool\s*call\s*:/i.test(trimmed)
      const execCall = /^exec:\s+\S+/i.test(trimmed)
      if (!skipping && /use offset=\d+ to continue/i.test(trimmed)) continue
      if (!skipping && resultCall) {
        resultPayload = trimmed
        depth = (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length
        sawBrace = true
        if (depth <= 0) finishSkip()
        else skipping = true
        continue
      }
      if (!skipping && trimmed.includes('\\r\\n')) continue
      if (!skipping && (toolCall || execCall || (this.isToolPayload(trimmed) && (trimmed.startsWith('[') || trimmed.startsWith('{'))))) {
        summaries.push(this.toolCallSummary(trimmed))
        depth = (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length
        sawBrace = /[{[]/.test(line)
        if (sawBrace && depth <= 0) finishSkip()
        else skipping = true
        continue
      }

      if (skipping) {
        if (resultPayload) resultPayload = `${resultPayload}\n${trimmed}`
        depth += (line.match(/{/g) ?? []).length
        depth -= (line.match(/}/g) ?? []).length
        if (/[{[]/.test(line)) sawBrace = true
        if ((sawBrace && depth <= 0 && /[}\]]/.test(line)) || (!sawBrace && trimmed === '')) finishSkip()
        continue
      }

      kept.push(line)
    }

    if (resultPayload) summaries.push(this.resultSummary(resultPayload))
    return { prose: kept.join('\n'), summaries }
  }

  private renderDetailSnippet(segment: Segment, entries: ReferenceEntry[]): string | null {
    const source = this.stripToolPayloads(segment.text).prose
    if (source.trim().length < 12) return null
    const referenced = this.applyDictionaryReferences(source, entries).text
    const compressed = this.compressSnippet(referenced)
    if (!compressed) return null
    return `- [${segment.marker}] ${compressed}`
  }

  private compressSnippet(text: string): string {
    const cleanedLine = this.cleanEvidenceLine(text, 520)
    if (!cleanedLine) return ''
    if (this.looksLikeCommand(cleanedLine) || REFERENCE_PATTERN.test(cleanedLine)) return cleanedLine

    const protectedBlocks = new Map<string, string>()
    let working = cleanedLine

    working = working.replace(/```[\s\S]*?```|`[^`\n]+`|\[(?:CMD|PROMPT|CODE)-\d{2}\]/g, (match) => {
      const key = `SPECIALTOKEN${protectedBlocks.size}`
      protectedBlocks.set(key, match)
      return ` ${key} `
    })

    working = this.normalizeKnownPhrases(working)
    working = working.replace(/https?:\/\/\S+/g, ' ')
    working = working.replace(/[^\w\s:./\\-]/g, ' ')

    const words: string[] = []
    const seen = new Set<string>()

    for (const raw of working.split(/\s+/)) {
      if (!raw) continue
      if (protectedBlocks.has(raw)) {
        words.push(protectedBlocks.get(raw) ?? raw)
        continue
      }

      const lower = raw.toLowerCase()
      const normalized = lower.replace(/^[-_]+|[-_]+$/g, '')
      if (!normalized) continue

      const keep =
        CONTINUITY_TERMS.has(normalized) ||
        TECH_LANG_NAMES.has(normalized) ||
        /[A-Za-z]:\\|\/|\\|\.[A-Za-z0-9]{2,5}$/.test(raw) ||
        /^[A-Z]{2,}$/.test(raw) ||
        /\d/.test(raw)

      if (!keep && (STOP_WORDS.has(normalized) || this.guillotine.has(normalized) || normalized.length < 3)) {
        continue
      }

      if (seen.has(normalized)) continue
      seen.add(normalized)
      words.push(keep ? raw : normalized)
      if (words.length >= 48) break
    }

    return words.join(' ').trim()
  }

  private cleanEvidenceLine(text: string, maxLength = 220): string {
    const kept = this.cleanPathText(this.stripNoise(text)).split('\n').filter((line) => !line.includes('\\r\\n')).join('\n')
    let cleaned = this.maskFencedBlocks(kept)
      .replace(/[-\s]*exported session \d+\s*-*/gi, ' ')
      .replace(/\{?"?(?:role|content|parts|text|metadata|source)"?\s*:\s*/gi, ' ')
      .replace(/(?:^|\s)(?:#{1,3}\s*)?(?:\*\*|__)?(?:human|assistant|user|system|model)(?:\*\*|__)?\s*:/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    cleaned = cleaned.replace(/^[-*>#\s]+/, '')
    if (cleaned.length > maxLength) {
      cleaned = `${cleaned.slice(0, maxLength).replace(/\s+\S*$/, '')}...`
    }
    return cleaned
  }

  private extractArtifacts(text: string): string[] {
    const artifacts: string[] = []

    for (const line of text.split(/\r?\n/)) {
      const cleaned = line.trim().replace(/^[-*>]+\s*/, '')
      if (this.looksLikeCommand(cleaned)) artifacts.push(cleaned)
    }

    for (const match of this.cleanPathText(text).match(FILE_OR_URL_PATTERN) ?? []) {
      artifacts.push(this.presentFile(match.replace(/[.,;:]+$/, '')))
    }

    for (const match of text.match(/\b(?:codex|feature|fix|release|main|master)\/[\w./-]+|\b[0-9a-f]{7,12}\b/gi) ?? []) {
      artifacts.push(match)
    }

    return this.uniquePriority(artifacts.map((item) => item.trim()).filter(Boolean), 10)
  }

  private renderStateGroup(label: string, items: string[]): string[] {
    if (!items.length) return [`${label}: not clearly detected`]
    return [`${label}:`, ...items.slice(0, 4).map((item) => `- ${item}`)]
  }

  private renderBulletList(items: string[], fallback: string, limit = 6): string[] {
    if (!items.length) return [fallback]
    return items.slice(0, limit).map((item) => `- ${item}`)
  }

  private clusterSummary(cluster: ClusterDraft, evidence: Evidence): string {
    const markers = this.uniquePriority(cluster.segments.map((segment) => segment.marker), 4).join(' -> ')
    const action = evidence.completed[0] ?? evidence.pending[0] ?? evidence.decisions[0]
    return `${cluster.segments.length} signal segments across ${markers || 'unknown timeline'}${action ? `; strongest signal: ${action}` : ''}`
  }

  private normalizeKnownPhrases(text: string): string {
    return PHRASE_REPLACEMENTS.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text)
  }

  private normalizeForDedupe(kind: ReferenceKind, text: string): string {
    let normalized = text.replace(/\r\n/g, '\n').trim()
    normalized = kind === 'CMD'
      ? normalized.replace(/\s+/g, ' ')
      : normalized
        .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<uuid>')
        .replace(/\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/g, '<timestamp>')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
    return normalized.toLowerCase()
  }

  private isFenceDelimiter(line: string): boolean {
    return /^\s*```[A-Za-z0-9_+-]*\s*$/.test(line)
  }

  private eachFencedBlock(text: string, onBlock: (block: string) => void): void {
    const lines = text.split('\n')
    let openAt = -1
    for (let index = 0; index < lines.length; index += 1) {
      if (!this.isFenceDelimiter(lines[index])) continue
      if (openAt < 0) {
        openAt = index
        continue
      }
      onBlock(lines.slice(openAt, index + 1).join('\n'))
      openAt = -1
    }
  }

  private maskFencedBlocks(text: string): string {
    const lines = text.split('\n')
    const out: string[] = []
    let buf: string[] | null = null
    for (const line of lines) {
      if (this.isFenceDelimiter(line)) {
        if (buf) {
          buf.push(line)
          out.push(this.renderFencedBlock(buf))
          buf = null
        } else {
          buf = [line]
        }
        continue
      }
      if (buf) buf.push(line)
      else out.push(line)
    }
    if (buf) out.push(...buf)
    return out.join('\n')
  }

  private renderFencedBlock(lines: string[]): string {
    const opening = lines[0]?.trim() ?? ''
    const bodyLines = lines.slice(1, -1)
    if (/^```\s*$/.test(opening) && this.fenceBodyIsProse(bodyLines.join('\n'))) {
      return bodyLines
        .map((line) => {
          const trimmed = line.trim()
          if (trimmed.length <= 220) return trimmed
          const capped = trimmed.slice(0, 220).replace(/\s+\S*$/, '')
          return `${capped}...`
        })
        .filter(Boolean)
        .join('\n')
    }
    return `[code block ${lines.join('\n').length} chars]`
  }

  private fenceBodyIsProse(body: string): boolean {
    const trimmed = body.trim()
    if (trimmed.length < 24) return false
    const symbols = (trimmed.match(/[{}[\]();=<>]/g) ?? []).length
    if (symbols / trimmed.length > 0.03) return false
    if (/^\s*(?:import |export |def |class |function |const |let |var |if |for |return |#include|package |public |private )/m.test(trimmed)) return false
    const words = trimmed.split(/\s+/).filter(Boolean)
    if (words.length < 8) return false
    const longWords = words.filter((word) => /[A-Za-z]{3,}/.test(word)).length
    return longWords / words.length >= 0.6
  }

  private protectFencedCode(text: string): { text: string; blocks: Map<string, string> } {
    const blocks = new Map<string, string>()
    const out: string[] = []
    let buf: string[] | null = null
    for (const line of text.split('\n')) {
      if (this.isFenceDelimiter(line)) {
        if (buf) {
          buf.push(line)
          const key = `__VANTA_FENCE_${blocks.size}__`
          blocks.set(key, buf.join('\n'))
          out.push(key)
          buf = null
        } else {
          buf = [line]
        }
        continue
      }
      if (buf) buf.push(line)
      else out.push(line)
    }
    if (buf) out.push(...buf)
    return { text: out.join('\n'), blocks }
  }

  private restoreProtected(text: string, blocks: Map<string, string>): string {
    let restored = text
    for (const [key, value] of blocks.entries()) {
      restored = restored.replaceAll(key, value)
    }
    return restored
  }

  private replaceLiteral(text: string, needle: string, replacement: string): { text: string; count: number } {
    if (!needle || !text.includes(needle)) return { text, count: 0 }
    const pieces = text.split(needle)
    return {
      text: pieces.join(replacement),
      count: pieces.length - 1,
    }
  }

  private looksLikeCommand(text: string): boolean {
    return COMMAND_PATTERN.test(text.trim().replace(/^`|`$/g, ''))
  }

  private timelineMarker(offset: number, length: number): TimelineMarker {
    if (length <= 1) return 'final-known-state'
    const ratio = offset / length
    if (ratio >= 0.9) return 'final-known-state'
    if (ratio >= 0.66) return 'late-session'
    if (ratio >= 0.33) return 'mid-session'
    return 'early-session'
  }

  private uniquePriority(items: string[], limit: number): string[] {
    const seen = new Set<string>()
    const unique: string[] = []

    for (const item of items) {
      const key = this.detailSignature(item)
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(item)
      if (unique.length >= limit) break
    }

    return unique
  }

  private sortEvidenceByTimeline(items: string[]): string[] {
    const groups = new Map<number, string[]>()
    for (const item of items) {
      const rank = this.markerRankFromLine(item)
      const group = groups.get(rank)
      if (group) group.push(item)
      else groups.set(rank, [item])
    }

    const sorted: string[] = []
    const ranks = [...groups.keys()].sort((a, b) => b - a)
    for (const rank of ranks) {
      const group = groups.get(rank) ?? []
      for (let index = group.length - 1; index >= 0; index -= 1) {
        sorted.push(group[index])
      }
    }
    return sorted
  }

  private markerRankFromLine(item: string): number {
    if (item.includes('[final-known-state]')) return 3
    if (item.includes('[late-session]')) return 2
    if (item.includes('[mid-session]')) return 1
    return 0
  }

  private detailSignature(text: string): string {
    return text
      .toLowerCase()
      .replace(/^\s*-\s*/, '')
      .replace(/\[(?:early-session|mid-session|late-session|final-known-state)\]\s*/g, '')
      .replace(/[-\s]*exported session \d+\s*-*/g, '')
      .replace(/\bsession\s+\d+\b/g, 'session <n>')
      .replace(/\b[0-9a-f]{7,40}\b/g, '<hex>')
      .replace(/\b\d+\b/g, '<n>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 240)
  }

  private freshLines(items: string[], limit: number, used: Set<string>): string[] {
    const picked: string[] = []
    for (const item of items) {
      const key = this.detailSignature(item)
      if (!key || used.has(key)) continue
      used.add(key)
      picked.push(item)
      if (picked.length >= limit) break
    }
    return picked
  }

  private evidenceSentences(text: string): string[] {
    const cleaned = this.cleanEvidenceLine(text, 8000)
    if (!cleaned) return []
    return cleaned
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => this.cleanEvidenceLine(sentence, 220))
      .filter((sentence) => sentence.length >= 12 && this.hasWorkSignal(sentence) && !/\bresult:\s*[[{]/i.test(sentence))
  }

  private classifyEvidence(sentence: string): 'completed' | 'verified' | 'pending' | 'next' | 'doNot' | 'decisions' | null {
    if (DO_NOT_PATTERN.test(sentence)) return 'doNot'
    if (DECISION_PATTERN.test(sentence)) return 'decisions'
    if (NEXT_PATTERN.test(sentence)) return 'next'
    if (PENDING_PATTERN.test(sentence)) return 'pending'
    if (VERIFIED_PATTERN.test(sentence)) return 'verified'
    if (COMPLETED_PATTERN.test(sentence)) return 'completed'
    return null
  }

  private countFencedCodeBlocks(text: string): number {
    let count = 0
    this.eachFencedBlock(text, () => {
      count += 1
    })
    return count
  }

  private renderStopPoint(text: string): string[] {
    const turns = this.extractTurns(text)
    let lastUser = ''
    let lastAssistant = ''
    if (turns.length) {
      const picked = this.latestWorkTurns(turns)
      lastUser = picked.user
      lastAssistant = picked.assistant
    } else {
      const close = this.unstructuredClose(text)
      lastUser = close.user
      lastAssistant = close.assistant
    }

    const mentioned = [...this.commitReport(text), ...this.tailFiles(text)].slice(0, 8)
    const next = this.statedNextStep(lastAssistant, lastUser)

    return [
      '## WHERE IT STOPPED',
      'last user message:',
      lastUser ? this.renderStopUser(lastUser) : 'not clearly detected',
      'last assistant reply:',
      lastAssistant ? this.trimReply(lastAssistant) : 'not clearly detected',
      'last commits/files:',
      ...(mentioned.length ? mentioned.map((item) => `- ${item}`) : ['- not clearly detected']),
      'stated next step:',
      next || 'not clearly detected',
      '',
    ]
  }

  private latestWorkTurns(turns: Array<{ role: 'user' | 'assistant'; text: string }>): { user: string; assistant: string } {
    let user = ''
    let assistant = ''
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      const turn = turns[index]
      if (!this.hasWorkSignal(turn.text)) continue
      if (turn.role === 'user' && !user) user = turn.text
      if (turn.role === 'assistant' && !assistant) assistant = turn.text
      if (user && assistant) break
    }
    return { user, assistant }
  }

  private hasWorkSignal(text: string): boolean {
    const fence = this.shortFenceBody(text)
    const prose = fence ?? this.stripToolPayloads(text).prose
    const plain = this.stripNoise(prose || text)
    if (plain.trim() && this.hasConcreteArtifact(plain)) return true
    if (/```[^\n]*\n[\s\S]*?\b(?:export|import|def|class|function|const|let|return)\b/.test(text)) return true
    return false
  }

  private hasConcreteArtifact(plain: string): boolean {
    const hash = plain.match(/\b[0-9a-f]{7,40}\b/i)?.[0] ?? ''
    if (hash && /[a-f]/i.test(hash)) return true
    if (this.pathHits(plain).length) return true
    if (/\b[\w.-]+\.(?:tsx|ts|jsx|js|json|md|txt|html|css|py|sh|ps1|bat|log)\b/i.test(plain)) return true
    if (this.looksLikeCommand(plain)) return true
    if (/\b(?:error|exception|traceback|stack trace)\b/i.test(plain)) return true
    if (/https?:\/\/(?!(?:www\.)?chatboxai\.app\b)/i.test(plain)) return true
    if (/\b(?:localhost|127\.0\.0\.1):\d{2,5}\b/i.test(plain) || /\bport\s+\d{2,5}\b/i.test(plain)) return true
    if (/\b\d+\s+(?:lines?|files?|chars?|characters|bytes|kb|mb|gb|ms|secs?|seconds?|mins?|minutes?|tests?|insertions?|deletions?)\b/i.test(plain)) return true
    if (/`[^`\n]*\b[\w.-]+\.(?:tsx|ts|jsx|js|json|py|html|css|md)\b[^`\n]*`/i.test(plain)) return true
    if (/`[^`\n]*[0-9a-f]{7,40}[^`\n]*`/i.test(plain)) return true
    if (/`[^`\n]*\w+\([^`\n]*\)[^`\n]*`/.test(plain)) return true
    return false
  }

  private stripNoise(text: string): string {
    return text
      .replace(/<\/?deliver-assets\b[^>]*>/gi, ' ')
      .replace(/<\/?media\b[^>]*>/gi, ' ')
      .split('\n')
      .flatMap((line) => {
        if (/use offset=\d+ to continue/i.test(line)) return []
        if (line.includes('\\r\\n')) return []
        const cut = line.search(/\bresult:\s*[[{]/i)
        if (cut >= 0) {
          const head = line.slice(0, cut).trim()
          return head ? [head] : []
        }
        return [line]
      })
      .join('\n')
  }

  private renderStopUser(text: string): string {
    const body = this.shortFenceBody(text)
    if (body) return this.capVerbatim(body, 600)
    return this.capVerbatim(this.maskFencedBlocks(text), 600)
  }

  private shortFenceBody(text: string): string | null {
    const match = text.trim().match(/^```[A-Za-z0-9_+-]*[ \t]*\n([\s\S]*?)\n```$/)
    if (!match) return null
    const body = match[1].trim()
    if (!body || body.length > 600) return null
    return body
  }

  private stripExportChrome(text: string): string {
    const start = Math.max(0, text.length - 4000)
    const tail = text.slice(start)
      .replace(/\n*-{5,}[\s\S]*chatboxai\.app[\s\S]*$/i, '')
      .replace(/\n*<a\b[^>\n]*chatboxai\.app[\s\S]*$/i, '')
    return `${text.slice(0, start)}${tail}`.replace(/https?:\/\/(?:www\.)?chatboxai\.app\S*/gi, '')
  }

  private extractTurns(text: string): Array<{ role: 'user' | 'assistant'; text: string }> {
    const fromJson = this.extractJsonTurns(text)
    if (fromJson.length) return fromJson

    const turns: Array<{ role: 'user' | 'assistant'; text: string }> = []
    const marker = /(?:^|\n)\s*(?:#{1,3}\s*)?(?:\*\*|__)?(human|user|assistant)(?:\*\*|__)?\s*:\s*/gi
    const marks: Array<{ role: 'user' | 'assistant'; start: number; end: number }> = []
    let match: RegExpExecArray | null
    while ((match = marker.exec(text))) {
      const label = match[1].toLowerCase()
      marks.push({
        role: label === 'assistant' ? 'assistant' : 'user',
        start: match.index,
        end: match.index + match[0].length,
      })
    }
    for (let index = 0; index < marks.length; index += 1) {
      const end = index + 1 < marks.length ? marks[index + 1].start : text.length
      const body = text.slice(marks[index].end, end).trim()
      if (body) turns.push({ role: marks[index].role, text: body })
    }
    return turns
  }

  private extractJsonTurns(text: string): Array<{ role: 'user' | 'assistant'; text: string }> {
    if (!/"role"\s*:\s*"(user|assistant)"/.test(text) || !text.includes('"parts"')) return []
    const turns: Array<{ role: 'user' | 'assistant'; text: string }> = []
    const pattern = /"role"\s*:\s*"(user|assistant)"[\s\S]*?"parts"\s*:\s*\[\s*"((?:\\.|[^"\\])*)"/g
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text))) {
      const body = match[2].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim()
      if (!body) continue
      turns.push({ role: match[1] === 'user' ? 'user' : 'assistant', text: body })
    }
    return turns
  }

  private unstructuredClose(text: string): { user: string; assistant: string } {
    const paragraphs = text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length >= 8 && !this.isToolPayload(paragraph) && !/^exec:\s+/i.test(paragraph) && this.hasWorkSignal(paragraph))
    if (!paragraphs.length) return { user: '', assistant: '' }
    const commandLines = text.split('\n').filter((line) => this.looksLikeCommand(line) || /^exec:\s+/i.test(line.trim())).length
    if (commandLines >= 3) return { user: '', assistant: paragraphs[paragraphs.length - 1] }
    return { user: text.trim(), assistant: '' }
  }

  private capVerbatim(text: string, limit: number): string {
    const trimmed = text.replace(/\n{3,}/g, '\n\n').trim()
    if (trimmed.length <= limit) return trimmed
    return `${trimmed.slice(0, limit).replace(/\s+\S*$/, '')}...`
  }

  private trimReply(text: string): string {
    return this.cleanEvidenceLine(text, 500) || 'not clearly detected'
  }

  private statedNextStep(assistant: string, user: string): string {
    for (const chunk of [assistant, user]) {
      if (!chunk.trim()) continue
      const sentences = this.cleanEvidenceLine(chunk, 4000)
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/\[code block \d+ chars\]/g, ' ')
        .split(/(?<=[.!?])\s+/)
      for (let index = sentences.length - 1; index >= 0; index -= 1) {
        const sentence = sentences[index]?.trim() ?? ''
        if (sentence.length < 8 || !this.hasWorkSignal(sentence)) continue
        if (NEXT_PATTERN.test(sentence) || /\b(?:todo|next step)\b/i.test(sentence)) {
          return this.cleanEvidenceLine(sentence, 300)
        }
      }
    }
    return ''
  }

  private commitReport(text: string): string[] {
    const source = text
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
    const dropped = new Set<string>()
    let match: RegExpExecArray | null
    const resetPattern = /git\s+reset\s+--hard\s+HEAD~(\d+)/gi
    while ((match = resetPattern.exec(source))) {
      const count = Number(match[1])
      const prior = this.onelineHashes(source.slice(0, match.index))
      for (const hash of prior.slice(0, count)) dropped.add(hash)
    }
    const revertPattern = /git\s+revert\b[^\n]{0,80}?\b([0-9a-f]{7,40})\b/gi
    while ((match = revertPattern.exec(source))) {
      if (this.isCommitHash(match[1])) dropped.add(match[1].toLowerCase())
    }

    const created = this.createdHashes(source)
    const heads = this.headMarkedHashes(source)
    const logHead = this.latestLogHead(source)
    const ordered: string[] = []
    const seen = new Set<string>()
    const push = (hash: string) => {
      if (!hash || seen.has(hash) || dropped.has(hash)) return
      seen.add(hash)
      ordered.push(hash)
    }
    for (const hash of created) push(hash)
    for (const hash of heads) push(hash)
    push(logHead)
    const removed = [...dropped]
    return [...ordered.slice(0, 4), ...removed.map((hash) => `${hash} (dropped)`)].slice(0, 4)
  }

  private isCommitHash(value: string): boolean {
    return /^[0-9a-f]{7,40}$/i.test(value) && /[a-f]/i.test(value)
  }

  private createdHashes(source: string): string[] {
    const found: string[] = []
    const seen = new Set<string>()
    const pattern = /\[(?:[A-Za-z][\w./-]*)\s+([0-9a-f]{7,40})\]/gi
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source))) {
      if (!this.isCommitHash(match[1])) continue
      const hash = match[1].toLowerCase()
      if (seen.has(hash)) continue
      seen.add(hash)
      found.push(hash)
    }
    return found.reverse()
  }

  private headMarkedHashes(source: string): string[] {
    const found: string[] = []
    const seen = new Set<string>()
    const pattern = /`([0-9a-f]{7,40})`[^\n]{0,80}HEAD|HEAD[^\n]{0,80}`([0-9a-f]{7,40})`/gi
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source))) {
      const raw = match[1] || match[2] || ''
      if (!this.isCommitHash(raw)) continue
      const hash = raw.toLowerCase()
      if (seen.has(hash)) continue
      seen.add(hash)
      found.push(hash)
    }
    return found.reverse()
  }

  private latestLogHead(source: string): string {
    const lines = source.split('\n')
    let bestEnd = -1
    let bestHead = ''
    let index = 0
    while (index < lines.length) {
      const hash = this.lineHash(lines[index] ?? '')
      if (!hash) {
        index += 1
        continue
      }
      let end = index
      let cursor = index + 1
      while (cursor < lines.length && this.lineHash(lines[cursor] ?? '')) {
        end = cursor
        cursor += 1
      }
      const looksLikeLog = end > index || /\b[0-9a-f]{7,40}\b\s+\S/.test(lines[index] ?? '')
      if (looksLikeLog && end >= bestEnd) {
        bestEnd = end
        bestHead = hash
      }
      index = cursor
    }
    return bestHead
  }

  private onelineHashes(beforeReset: string): string[] {
    const lines = beforeReset.split('\n')
    const collected: string[] = []
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const hash = this.lineHash(lines[index] ?? '')
      if (!hash) {
        if (collected.length) break
        continue
      }
      collected.push(hash)
    }
    return collected.reverse()
  }

  private lineHash(line: string): string {
    const trimmed = line.trim()
    const direct = trimmed.match(/^["']?([0-9a-f]{7,40})\b/i)?.[1] ?? ''
    const embedded = direct ? '' : (trimmed.match(/["']([0-9a-f]{7,40})\b/i)?.[1] ?? '')
    const hash = direct || embedded
    if (!hash || !/[a-f]/i.test(hash)) return ''
    return hash.toLowerCase()
  }

  private tailFiles(text: string): string[] {
    const source = this.cleanPathText(this.stripNoise(text))
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.includes('\\r\\n')) return false
        if (/^result:\s*[[{]/i.test(trimmed)) return false
        return !(this.isToolPayload(trimmed) && (trimmed.startsWith('{') || trimmed.startsWith('[')))
      })
      .join('\n')
      .replace(/https?:\/\/\S+/g, ' ')
    const matches = source.match(FILE_OR_URL_PATTERN) ?? []
    const unique: string[] = []
    const seen = new Set<string>()
    for (let index = matches.length - 1; index >= 0; index -= 1) {
      const file = this.presentFile(matches[index].replace(/[.,;:)]+$/, ''))
      if (/^https?:\/\//i.test(file) || /chatboxai\.app/i.test(file)) continue
      const key = file.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      unique.push(file)
    }
    const canonical = (file: string) => file.replace(/[\\/]+/g, '/').toLowerCase()
    return unique
      .filter((file) => !unique.some((other) => {
        if (other === file) return false
        const long = canonical(other)
        const short = canonical(file)
        return long.length > short.length && (long.endsWith(short) || long.endsWith(`/${short}`))
      }))
      .slice(0, 4)
  }

  private redactSecrets(text: string): string {
    return text
      .replace(/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g, '[redacted]')
      .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, '[redacted]')
      .replace(/\bBearer\s+[A-Za-z0-9._~+/-]{8,}/gi, 'Bearer [redacted]')
      .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, '[redacted]')
      .replace(/\bgithub_pat_[A-Za-z0-9_]{8,}\b/g, '[redacted]')
      .replace(/\bghp_[A-Za-z0-9]{8,}\b/g, '[redacted]')
      .replace(/\bAKIA[0-9A-Z]{16}\b/g, '[redacted]')
  }

  private estimateTokens(chars: number): number {
    return Math.ceil(chars / 4)
  }

  private capNarrative(output: string): string {
    const lines = output.split('\n')
    const dictStart = lines.findIndex((line) => line.startsWith('## REFERENCE DICTIONARY'))
    let dictEnd = -1
    if (dictStart >= 0) {
      const next = lines.findIndex((line, index) => index > dictStart && line.startsWith('## '))
      dictEnd = next < 0 ? lines.length : next
    }
    const clusterStart = lines.findIndex((line) => line.startsWith('## ['))
    if (clusterStart < 0) return output

    const narrativeLength = () => {
      let total = 0
      for (let index = 0; index < lines.length; index += 1) {
        if (dictStart >= 0 && index >= dictStart && index < dictEnd) continue
        total += lines[index].length + 1
      }
      return total
    }

    let guard = 0
    while (narrativeLength() > NARRATIVE_BUDGET && guard < 5000) {
      const index = this.lowestBudgetLine(lines, clusterStart)
      if (index < 0) break
      lines.splice(index, 1)
      guard += 1
    }
    return lines.join('\n')
  }

  private lowestBudgetLine(lines: string[], clusterStart: number): number {
    let section: 'detail' | 'list' | 'other' = 'other'
    const details: Array<{ index: number; score: number }> = []
    const lists: Array<{ index: number; score: number }> = []
    const summaries: number[] = []
    for (let index = clusterStart; index < lines.length; index += 1) {
      const line = lines[index]
      if (line.startsWith('## [')) {
        section = 'other'
        continue
      }
      if (line === 'compressed detail stream:') {
        section = 'detail'
        continue
      }
      if (line === 'key actions:' || line === 'decisions:' || line === 'open loops:' || line === 'important commands/files:') {
        section = 'list'
        continue
      }
      if (line.startsWith('summary:')) {
        section = 'other'
        summaries.push(index)
        continue
      }
      if (!line.startsWith('- ')) continue
      const score = this.signalScore(line) + this.markerRankFromLine(line)
      if (section === 'detail') details.push({ index, score })
      else if (section === 'list') lists.push({ index, score })
    }
    const pool = details.length ? details : lists
    if (pool.length) {
      pool.sort((a, b) => a.score - b.score || a.index - b.index)
      return pool[0].index
    }
    return summaries.length ? summaries[summaries.length - 1] : -1
  }
}
