import type { CompressionResult } from './types'

const TOKEN_ESTIMATION_METHOD = 'approximate: ceil(characters / 4)'
const MAX_CLUSTERS = 6
const MAX_DETAIL_SNIPPETS_PER_CLUSTER = 32

type ReferenceKind = 'CMD' | 'PROMPT' | 'CODE'

interface ReferenceEntry {
  id: string
  kind: ReferenceKind
  text: string
  count: number
  variants: string[]
}

interface FoldResult {
  text: string
  entries: ReferenceEntry[]
  foldedOccurrences: number
}

interface Segment {
  text: string
  index: number
  total: number
  marker: TimelineMarker
}

type TimelineMarker = 'early-session' | 'mid-session' | 'late-session' | 'final-known-state'

interface TopicDefinition {
  label: string
  patterns: RegExp[]
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
  'complete', 'remaining', 'open', 'todo', 'review', 'privacy_policy',
  'chrome_web_store', 'landing_page', 'vantacore', 'cloudflare', 'chp',
  'c.h.p', 'chrome_extension', 'promo_image', 'seo', 'sitemap',
])

const TOPICS: TopicDefinition[] = [
  {
    label: 'IPE Landing Page / Chrome Extension',
    patterns: [/\bipe\b/i, /\blanding\s+page\b/i, /\bchrome\s+extension\b/i, /\bextension\b/i],
  },
  {
    label: 'Chrome Web Store / Privacy / Review',
    patterns: [/\bchrome\s+web\s+store\b/i, /\bprivacy\s+policy\b/i, /\breview\b/i, /\bstore\s+listing\b/i, /\bsubmission\b/i],
  },
  {
    label: 'Cloudflare / SEO / Sitemap / Deployment',
    patterns: [/\bcloudflare\b/i, /\bdeployment?\b/i, /\bdeployed\b/i, /\bseo\b/i, /\bsitemap\b/i, /\brobots\.txt\b/i, /\bdns\b/i],
  },
  {
    label: 'VantaCore Compression Test',
    patterns: [/\bvantacore\b/i, /\bcompression\b/i, /\bcompressed\b/i, /\bmemory\s+packet\b/i, /\bmemory\s+capsule\b/i],
  },
  {
    label: 'C.H.P Monetization / Product Strategy',
    patterns: [/\bc\s*\.?\s*h\s*\.?\s*p\b/i, /\bmonetization\b/i, /\bproduct\s+strategy\b/i, /\bpricing\b/i, /\bsubscription\b/i],
  },
  {
    label: 'Promo Image / Store Assets',
    patterns: [/\bpromo\s+image\b/i, /\bscreenshot\b/i, /\basset\b/i, /\bog\s+image\b/i, /\bpreview\b/i],
  },
  {
    label: 'Git / Branch / Release Trail',
    patterns: [/\bgit\b/i, /\bcommit\b/i, /\bbranch\b/i, /\bpushed\b/i, /\bpull\s+request\b/i, /\bgithub\b/i],
  },
]

const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bchrome\s+web\s+store\b/gi, 'chrome_web_store'],
  [/\bprivacy\s+policy\b/gi, 'privacy_policy'],
  [/\blanding\s+page\b/gi, 'landing_page'],
  [/\bchrome\s+extension\b/gi, 'chrome_extension'],
  [/\bpromo\s+image\b/gi, 'promo_image'],
  [/\bc\s*\.?\s*h\s*\.?\s*p\b/gi, 'chp'],
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
const SIGNAL_PATTERN = /\b(user wants|agent should|already fixed|verified|pending|next|blocked|passed|failed|commit|pushed|deployed|chrome web store|cloudflare|privacy policy|landing page|vantacore|c\.?h\.?p|do not|todo|remaining|open loop)\b/i

const COMMAND_PATTERN = /^(?:PS\s+[A-Z]:\\.*?>\s*)?(?:\$|>)?\s*(?:git|rg|npm|pnpm|yarn|node|npx|powershell|pwsh|curl|wrangler|vercel|python|py|tsc|vite|gh|cat|ls|dir|Get-ChildItem|Select-String|Start-Process|netstat|tasklist|taskkill|code|cloudflare)\b/i
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

    const codeBlocksProtected = this.countFencedCodeBlocks(text)
    const fold = this.foldRepeatedBlocks(text)
    const capsule = this.renderMemoryCapsule(text, fold)
    const compressed = capsule.output.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
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
      codeBlocksProtected,
      codeBlocksIntegrityOk: this.hasBalancedFences(compressed),
    }
  }

  private renderMemoryCapsule(originalText: string, fold: FoldResult): { output: string; clustersDetected: number } {
    const segments = this.makeSegments(originalText)
    const topicScores = this.detectTopicScores(segments)
    const evidence = this.extractEvidence(segments)
    const clusters = this.buildClusters(segments, topicScores)
    const lines: string[] = []

    lines.push('# VantaCore Memory Capsule')
    lines.push(`token estimate: ${TOKEN_ESTIMATION_METHOD}`)
    lines.push('')

    lines.push('## SESSION MAP')
    if (topicScores.length) {
      for (const topic of topicScores.slice(0, MAX_CLUSTERS)) {
        lines.push(`- [${topic.marker}] ${topic.label} (${topic.score} signals)`)
      }
    } else {
      lines.push('- [early-session..final-known-state] General session continuity')
    }
    lines.push('')

    lines.push('## CURRENT FINAL STATE')
    lines.push(...this.renderStateGroup('completed', evidence.completed))
    lines.push(...this.renderStateGroup('verified', evidence.verified))
    lines.push(...this.renderStateGroup('pending', evidence.pending))
    lines.push(...this.renderStateGroup('next likely step', evidence.next.length ? evidence.next : evidence.pending.slice(0, 2)))
    lines.push('')

    lines.push('## OPEN LOOPS / NEXT ACTIONS')
    lines.push(...this.renderBulletList(evidence.pending.length ? evidence.pending : evidence.next, 'none clearly detected; continue from final-known-state cluster and re-check latest artifacts'))
    lines.push('')

    lines.push('## DO NOT REPEAT / DO NOT CHANGE')
    lines.push(...this.renderBulletList(evidence.doNot, 'no explicit do-not-change instruction detected'))
    lines.push('')

    lines.push('## DECISION LOG')
    lines.push(...this.renderBulletList(evidence.decisions, 'no explicit decision statements detected'))
    lines.push('')

    lines.push('## KEY COMMANDS / FILES / ARTIFACTS')
    lines.push(...this.renderBulletList(evidence.artifacts, 'no commands/files/domains detected'))
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
      const selected = this.selectDetailSegments(cluster.segments)
      const detail = selected
        .map((segment) => this.renderDetailSnippet(segment, fold.entries))
        .filter((line): line is string => Boolean(line))

      lines.push(`## [${clusterId}: ${cluster.label}]`)
      lines.push(`summary: ${this.clusterSummary(cluster, clusterEvidence)}`)
      lines.push('key actions:')
      lines.push(...this.renderBulletList(clusterEvidence.completed, 'no completed action isolated in this cluster', 4))
      lines.push('decisions:')
      lines.push(...this.renderBulletList(clusterEvidence.decisions, 'none isolated', 3))
      lines.push('open loops:')
      lines.push(...this.renderBulletList(clusterEvidence.pending, 'none isolated', 4))
      lines.push('important commands/files:')
      lines.push(...this.renderBulletList(clusterEvidence.artifacts, 'none isolated', 5))
      lines.push('compressed detail stream:')
      lines.push(...(detail.length ? detail : ['- no high-signal detail lines isolated']))
      lines.push('')
    }

    if (!clusters.length) {
      const detail = this.selectDetailSegments(segments)
        .map((segment) => this.renderDetailSnippet(segment, fold.entries))
        .filter((line): line is string => Boolean(line))
      lines.push('## [CLUSTER-01: General Session Continuity]')
      lines.push('summary: fallback cluster built from high-signal continuity lines')
      lines.push('compressed detail stream:')
      lines.push(...(detail.length ? detail : ['- no high-signal detail lines isolated']))
      lines.push('')
    }

    return { output: lines.join('\n'), clustersDetected: Math.max(clusters.length, 1) }
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

    for (const match of text.match(/```[\s\S]*?```/g) ?? []) {
      if (match.length >= 80) addCandidate('CODE', match)
    }

    for (const match of text.match(/`[^`\n]+`/g) ?? []) {
      const inner = match.slice(1, -1).trim()
      if (this.looksLikeCommand(inner) || inner.length >= 80) addCandidate('CMD', match)
    }

    for (const line of text.split(/\r?\n/)) {
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

    const { text: folded, replacements } = this.applyDictionaryReferences(text, numberedEntries)

    return {
      text: folded,
      entries: numberedEntries,
      foldedOccurrences: replacements,
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
      return `[${entry.id} repeated ${entry.count}x]: ${entry.text}`
    }

    return `[${entry.id} repeated ${entry.count}x]:\n<<<${entry.id}\n${entry.text}\n>>>`
  }

  private makeSegments(text: string): Segment[] {
    const protectedFences = this.protectFencedCode(text.replace(/\r\n/g, '\n'))
    const candidates = protectedFences.text
      .split(/\n{2,}|(?<=\.)\s+(?=(?:User|Assistant|Agent|System)\b)/)
      .flatMap((block) => this.splitOversizedBlock(block, 1800))
      .map((block) => this.restoreProtected(block, protectedFences.blocks).trim())
      .filter((block) => block.length >= 12)

    const fallback = candidates.length ? candidates : this.splitOversizedBlock(text, 1200)
    const total = fallback.length

    return fallback.map((segmentText, index) => ({
      text: segmentText,
      index,
      total,
      marker: this.timelineMarker(index, total),
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

  private detectTopicScores(segments: Segment[]): TopicScore[] {
    const scores = TOPICS.map((topic) => {
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

  private buildClusters(segments: Segment[], topicScores: TopicScore[]): ClusterDraft[] {
    const selectedTopics = topicScores.slice(0, MAX_CLUSTERS).map((topic) => topic.label)
    const clusters = new Map<string, ClusterDraft>()

    for (const label of selectedTopics) {
      clusters.set(label, { label, score: 0, segments: [] })
    }

    const generalLabel = 'General Continuity / Open Threads'

    for (const segment of segments) {
      const best = this.bestTopicForSegment(segment, selectedTopics)
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

  private bestTopicForSegment(segment: Segment, labels: string[]): { label: string; score: number } | null {
    let best: { label: string; score: number } | null = null
    for (const label of labels) {
      const topic = TOPICS.find((candidate) => candidate.label === label)
      if (!topic) continue
      const score = this.topicScoreForText(topic, segment.text)
      if (score > 0 && (!best || score > best.score)) best = { label, score }
    }
    return best
  }

  private topicScoreForText(topic: TopicDefinition, text: string): number {
    return topic.patterns.reduce((score, pattern) => {
      const matches = text.match(new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`))
      return score + (matches?.length ?? 0)
    }, 0)
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
      const cleaned = this.cleanEvidenceLine(segment.text)
      if (!cleaned) continue

      if (COMPLETED_PATTERN.test(segment.text)) completed.push(`[${segment.marker}] ${cleaned}`)
      if (VERIFIED_PATTERN.test(segment.text)) verified.push(`[${segment.marker}] ${cleaned}`)
      if (PENDING_PATTERN.test(segment.text)) pending.push(`[${segment.marker}] ${cleaned}`)
      if (NEXT_PATTERN.test(segment.text)) next.push(`[${segment.marker}] ${cleaned}`)
      if (DO_NOT_PATTERN.test(segment.text)) doNot.push(`[${segment.marker}] ${cleaned}`)
      if (DECISION_PATTERN.test(segment.text)) decisions.push(`[${segment.marker}] ${cleaned}`)

      for (const artifact of this.extractArtifacts(segment.text)) {
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
    let score = 0
    if (SIGNAL_PATTERN.test(text)) score += 4
    if (COMPLETED_PATTERN.test(text)) score += 3
    if (VERIFIED_PATTERN.test(text)) score += 3
    if (PENDING_PATTERN.test(text)) score += 3
    if (DO_NOT_PATTERN.test(text)) score += 4
    if (DECISION_PATTERN.test(text)) score += 2
    if (this.extractArtifacts(text).length) score += 2
    if (this.looksLikeCommand(text.trim())) score += 4
    return score
  }

  private renderDetailSnippet(segment: Segment, entries: ReferenceEntry[]): string | null {
    const referenced = this.applyDictionaryReferences(segment.text, entries).text
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
    let cleaned = text
      .replace(/```[\s\S]*?```/g, (match) => `[code block ${match.length} chars]`)
      .replace(/[-\s]*exported session \d+\s*-*/gi, ' ')
      .replace(/\{?"?(?:role|content|parts|text|metadata|source)"?\s*:\s*/gi, ' ')
      .replace(/\b(?:assistant|model|user|system)\s*:/gi, '')
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

    for (const match of text.match(FILE_OR_URL_PATTERN) ?? []) {
      artifacts.push(match.replace(/[.,;:]+$/, ''))
    }

    for (const match of text.match(/\b(?:codex|feature|fix|release|main|master)\/[\w./-]+|\b[0-9a-f]{7,12}\b/gi) ?? []) {
      artifacts.push(match)
    }

    return this.uniquePriority(artifacts.map((item) => item.trim()).filter(Boolean), 10)
  }

  private renderStateGroup(label: string, items: string[]): string[] {
    const values = items.length ? items.slice(0, 4) : ['not clearly detected']
    return [`${label}:`, ...values.map((item) => `- ${item}`)]
  }

  private renderBulletList(items: string[], fallback: string, limit = 6): string[] {
    const values = items.length ? items.slice(0, limit) : [fallback]
    return values.map((item) => `- ${item}`)
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

  private protectFencedCode(text: string): { text: string; blocks: Map<string, string> } {
    const blocks = new Map<string, string>()
    const protectedText = text.replace(/```[\s\S]*?```/g, (match) => {
      const key = `__VANTA_FENCE_${blocks.size}__`
      blocks.set(key, match)
      return key
    })
    return { text: protectedText, blocks }
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

  private timelineMarker(index: number, total: number): TimelineMarker {
    if (total <= 1) return 'final-known-state'
    const ratio = index / Math.max(total - 1, 1)
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
    return [...items].sort((a, b) => this.markerRankFromLine(b) - this.markerRankFromLine(a))
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
      .replace(/\[(?:early-session|mid-session|late-session|final-known-state)\]\s*/g, '')
      .replace(/[-\s]*exported session \d+\s*-*/g, '')
      .replace(/\bsession\s+\d+\b/g, 'session <n>')
      .replace(/\b\d{1,6}\b/g, '<n>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 240)
  }

  private countFencedCodeBlocks(text: string): number {
    return (text.match(/```[\s\S]*?```/g) ?? []).length
  }

  private hasBalancedFences(text: string): boolean {
    const fenceCount = (text.match(/```/g) ?? []).length
    return fenceCount % 2 === 0 && !text.includes('__VANTA_FENCE_')
  }

  private estimateTokens(chars: number): number {
    return Math.ceil(chars / 4)
  }
}
