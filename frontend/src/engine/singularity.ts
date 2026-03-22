// ============================================================================
// 🖤 VANTACORE: THE SINGULARITY V4.0 — TypeScript Edition
// Ported from wolf_core.py with critical fixes applied
// ============================================================================

import type { CompressionResult } from './types'

// --- STOP WORDS (functional glue words) ---
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at',
  'from', 'by', 'for', 'with', 'in', 'on', 'to', 'of', 'is', 'it', 'that',
  'this', 'these', 'those', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
  'does', 'did', 'can', 'could', 'should', 'would', 'may', 'might', 'must',
  'up', 'out', 'new', 'get', 'use',
  // Contraction fragments
  't', 's', 'm', 're', 've', 'd', 'll',
])

// --- EXPLICIT TECH LANGUAGE NAMES (replaces the broken endswith hack) ---
const TECH_LANG_NAMES = new Set([
  'rust', 'python', 'typescript', 'javascript', 'golang', 'kotlin', 'swift',
  'ruby', 'scala', 'haskell', 'erlang', 'elixir', 'clojure', 'dart', 'julia',
  'fortran', 'cobol', 'lua', 'perl', 'bash', 'powershell', 'zig', 'nim',
  'ocaml', 'fsharp', 'csharp', 'cplusplus', 'cpp', 'objectivec',
])

export class Singularity {
  private guillotine: Set<string>

  constructor() {
    // THE BLACK WOLF GUILLOTINE — V4.0 AUDITED
    // REMOVED dangerous tech words: code, class, input, output, data, test, windows, app,
    // fix, add, remove, clean, imports, start, active, port, force, switch, match, line, keys
    this.guillotine = new Set([
      'currently', 'presently', 'carefully', 'specifically', 'actually',
      'manually', 'problem', 'issue', 'error', 'failed', 'compilation',
      'message', 'instruction', 'guidance', 'feedback', 'regarding', 'another',
      'implementing', 'refining', 'investigating', 'attempt', 'seems', 'realize',
      'focused', 'critical', 'previous', 'analyzing', 'correcting', 'finalizing',
      'integrating', 'verifying', 'addressing', 'following', 'ensuring', 'honing',
      'working', 'trying', 'looking', 'started', 'starting', 'thinking', 'thought',
      'needs', 'needed', 'want', 'wanted', 'know', 'knows', 'believe', 'believes',
      'said', 'told', 'asked', 'claimed', 'lying', 'disappointed', 'honest',
      'seriously', 'perfectly', 'beautifully', 'purely', 'simply', 'easily',
      'immediately', 'available', 'using', 'included', 'includes', 'including',
      'action', 'bad', 'good', 'unused',
      'adding',
      // Conversational Filler & Glue
      'hope', 'fine', 'miss', 'wonderful', 'maddening', 'nasty', 'silly', 'stupid',
      'clearly', 'likely', 'possibly', 'truly', 'sure', 'exactly', 'absolutely',
      'already', 'none', 'them', 'even', 'having', 'where', 'most',
      'whenever', 'sometimes', 'before', 'after', 'besides', 'also', 'whether',
      'easy', 'because', 'next', 'other', 'hand', 'directly', 'better', 'there',
      'something', 'anything', 'everything', 'nothing', 'everyone', 'anyone', 'someone',
      'basically', 'really', 'very', 'too', 'quite', 'just', 'well', 'now', 'here',
      'still', 'yet', 'rather', 'instead', 'towards', 'around',
      'love', 'chat', 'middle', 'while', 'result', 'results', 'tell', 'response',
      'found', 'actual', 'solved', 'give', 'without', 'ready',
      // V3.3 Polish
      'doing', 'lot', 'some', 'all', 'they', 'don', 'alt', 'dot', 'will', 'your',
      'what', 'done', 'let', 'deep', 'dive', 'look', 'one', 'wow', 'got', 'who',
      'nice', 'whats', 'swear', 'see',
      // V3.4 Deep Semantic Purge
      'facing', 'troubling', 'things', 'came', 'make', 'worse', 'made', 'previously',
      'struggling', 'sticky', 'behind', 'listing', 'listed', 'viewed', 'leaving',
      'search', 'searched', 'capability', 'capabilities', 'expecting', 'mentioned',
      'observed', 'tried', 'troubleshoot', 'saying', 'discovered', 'proceed',
      'question', 'haven', 'missed', 'thorough', 'extremely', 'valuable', 'extensive',
      'attempts', 'mention', 'completed', 'exhaustive', 'searches', 'references',
      'meaning', 'implemented', 'perfect', 'gather', 'extra', 'info', 'maybe',
      'looks', 'sense', 'feeling', 'wrong', 'lost', 'everywhere', 'forgot',
      'bucket', 'feel', 'sitting', 'skipped', 'looked', 'answer', 'hiding',
      'plain', 'sight', 'point', 'contains', 'techniques', 'advanced', 'multiple',
      'layered', 'depth', 'glow', 'outer', 'inner', 'subtle', 'highlight', 'insight',
      'fully', 'based', 'replace', 'apply', 'approach', 'disable', 'piece',
      'include', 'changes', 'tested', 'going', 'same', 'changed', 'significantly',
      'improved', 'integrate', 'much', 'percentage', 'possibility', 'planet',
      'success', 'probability', 'breakdown', 'confidence', 'eliminate', 'proven',
      'stale', 'common', 'fresh', 'small', 'chance', 'play', 'level', 'different',
      'combo', 'unpredictable', 'quirks', 'follow', 'cases', 'rapid', 'minor',
      'though', 'simplified', 'help', 'gives', 'fixes', 'surgical', 'experimental',
      'similar', 'worked', 'uncertainty', 'guarantee', 'perfection',
      'until', 'live', 'betting', 'trust', 'come', 'whole', 'trusting',
      'abilities', 'beyond', 'codes', 'means', 'execute', 'warnings',
      'handles', 'directives', 'went', 'accidentally', 'deleted', 'restore',
      'restored', 'positives', 'handled', 'accepted', 'checked',
      'almost', 'bit', 'magic', 'words', 'registered', 'successfully', 'running',
      'afraid', 'remains', 'additionally', 'appearing', 'removed', 'difficult',
      'figure', 'removing', 'created', 'reason', 'such', 'adjusting', 'keep',
      'feels', 'heavy', 'direction', 'hear', 'loud', 'deeply', 'symptoms',
      'cause', 'pick', 'persistent', 'disappear', 'creates', 'visual', 'points',
      'picked', 'restart', 'causing', 'generated', 'anywhere', 'vestige',
      'extended', 'applying', 'happens', 'inside', 'draws', 'way',
      'known', 'underlying', 'exist', 'latest', 'installed', 'differently',
      'persists', 'enough', 'behavior', 'focus', 'research', 'suggested',
      'workaround', 'interesting', 'dealt', 'various', 'suggests', 'reverted',
      'overwritten', 'given', 'item', 'recurse', 'continue', 'nuked',
      'final', 'confirmed', 'removes', 'entirely', 'provides', 'eliminates',
      'ensure', 'since', 'provide', 'finish', 'minutes', 'finishing', 'kick',
      'ass', 'caused', 'showing', 'sorry', 'interrupt', 'possible', 'slight',
      'cuz', 'idea', 'share', 'opinion', 'brilliant', 'premium', 'matches',
      'hud', 'screams', 'dated', 'technical', 'elegance', 'consistent', 'respects',
      'noticeable', 'aggressive', 'safe', 'bold', 'polished', 'automatically',
      'updated', 'change', 'click', 'trigger', 'refresh', 'press', 'earlier',
      'properly',
      // V3.5 The Red Square Purge
      'etc', 'current', 'says', 'fucking', 'god', 'please', 'stubborn', 'beautiful',
      'free', 'baad', 'qalbi', 'shukran', 'deeb',
      'listen', 'think', 'thing', 'myself', 'yourself',
      'raw', 'codebase', 'snippets', 'used', 'generate',
      'contain', 'how', 'are', 'you', 'building', 'comprehensive', 'robust',
    ])
  }

  /**
   * THE SINGULARITY V4.0 PIPELINE:
   * 0. Extract & protect code blocks
   * 1. Universal Lowercase (outside code blocks)
   * 2. Nuclear Metadata Purge
   * 3. Punctuation & Numeric Dissolving
   * 4. The Black Wolf Guillotine (AUDITED)
   * 5. Absolute Global Shredder (N-gram dedup)
   * 6. Reinsert preserved code blocks
   */
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
      }
    }

    // ═══════════════════════════════════════════════
    // STEP 0: CODE BLOCK PRESERVATION (NEW in V4)
    // ═══════════════════════════════════════════════
    const codeBlocks = new Map<string, string>()
    let processedText = text

    // Extract ``` fenced code blocks and replace with UUID placeholders
    let blockIndex = 0
    processedText = processedText.replace(
      /```[\s\S]*?```/g,
      (match) => {
        const placeholder = `CODEBLOCK_${blockIndex}_PRESERVED`
        codeBlocks.set(placeholder, match)
        blockIndex++
        return ` ${placeholder} `
      }
    )

    // Also extract inline code `...`
    processedText = processedText.replace(
      /`[^`\n]+`/g,
      (match) => {
        const placeholder = `INLINECODE_${blockIndex}_PRESERVED`
        codeBlocks.set(placeholder, match)
        blockIndex++
        return ` ${placeholder} `
      }
    )

    // ═══════════════════════════════════════════════
    // STEP 1: UNIVERSAL LOWERCASE
    // ═══════════════════════════════════════════════
    processedText = processedText.toLowerCase()

    // Lowercase the placeholders too so they match later
    const loweredCodeBlocks = new Map<string, string>()
    for (const [key, value] of codeBlocks) {
      loweredCodeBlocks.set(key.toLowerCase(), value)
    }

    // ═══════════════════════════════════════════════
    // STEP 2: NUCLEAR METADATA PURGE
    // ═══════════════════════════════════════════════
    const junkStrings = [
      'this output not contain any raw data codebase snippets etc used generate input',
      "i've also replaced the original data with placeholder text",
      'thinking process:', 'note:', 'warning:', 'system:',
      'thinking ... expand to view model thoughts',
      'idtextmetadatasource', 'metadatastokens', 'downloadfullscreen',
      'بعد قلبي', 'الذيب', 'يا بعد قلبي', 'شكرا', 'ذيب',
      'like goes itself', 'listen think thing myself yourself',
      '100vw 100vh', '00vw 100vh', 'hot reload',
    ]
    for (const s of junkStrings) {
      processedText = processedText.replaceAll(s, ' ')
    }

    // Regex Purge
    processedText = processedText.replace(/thinking.*?expand to view model thoughts/gs, ' ')
    processedText = processedText.replace(/!\[.*?\]\(.*?\)/g, ' ')       // Images
    processedText = processedText.replace(/http\S+/g, ' ')               // URLs
    processedText = processedText.replace(/uploaded_image_\d+/g, ' ')
    // UUIDs
    processedText = processedText.replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g, ' '
    )
    processedText = processedText.replace(/\b[0-9a-f]{8}\b/g, ' ')      // Short hashes

    // V4 FIX: Only strip lone underscores, NOT identifiers like __init__
    processedText = processedText.replace(/(?<!\w)_(?!\w)/g, ' ')

    const junkTerms = [
      'user', 'model', 'thoughts', 'expand', 'chevron_right',
      'active code', 'chunktestmd', 'stream_00', 'metadata', 'source', 'tokens',
      'png', 'jpg', 'jpeg', 'screenshot', 'gemini', 'antigravity', 'brain',
      'conversation',
    ]
    for (const term of junkTerms) {
      processedText = processedText.replaceAll(term, ' ')
    }

    // ═══════════════════════════════════════════════
    // STEP 3: PUNCTUATION & NUMERIC DISSOLVING
    // ═══════════════════════════════════════════════
    // Preserve code block placeholders by temporarily replacing them
    const placeholderProtect = new Map<string, string>()
    for (const key of loweredCodeBlocks.keys()) {
      const safeKey = `SAFEPLACEHOLDER${placeholderProtect.size}`
      placeholderProtect.set(safeKey, key)
      processedText = processedText.replaceAll(key, safeKey)
    }

    processedText = processedText.replace(/[^\w\s]/g, ' ')

    // Restore placeholders
    for (const [safeKey, originalKey] of placeholderProtect) {
      processedText = processedText.replaceAll(safeKey, originalKey)
    }

    // ═══════════════════════════════════════════════
    // STEP 4: THE BLACK WOLF GUILLOTINE (V4 AUDITED)
    // ═══════════════════════════════════════════════
    const words = processedText.split(/\s+/).filter(Boolean)
    const denseWords: string[] = []

    for (const w of words) {
      // Preserve code block placeholders
      if (w.includes('_preserved')) {
        denseWords.push(w)
        continue
      }

      if (STOP_WORDS.has(w) || this.guillotine.has(w) || w.length < 3) {
        continue
      }

      if (/^\d+$/.test(w)) {
        continue
      }

      // V4 FIX: Explicit tech language set (no more endswith hack)
      if (TECH_LANG_NAMES.has(w)) {
        denseWords.push('TECH')
      } else if (w.startsWith('cf_')) {
        denseWords.push('CONST')
      } else {
        denseWords.push(w)
      }
    }

    // ═══════════════════════════════════════════════
    // STEP 5: ABSOLUTE GLOBAL SHREDDER (N-gram dedup)
    // ═══════════════════════════════════════════════
    const finalWords: string[] = []
    const seenGrams = new Set<string>()

    let i = 0
    while (i < denseWords.length) {
      let isDup = false

      for (const n of [3, 2, 1]) {
        if (i + n <= denseWords.length) {
          const gram = denseWords.slice(i, i + n).join(' ')
          if (seenGrams.has(gram)) {
            isDup = true
            break
          }
        }
      }

      if (!isDup) {
        for (const n of [1, 2, 3]) {
          if (i + n <= denseWords.length) {
            const gram = denseWords.slice(i, i + n).join(' ')
            seenGrams.add(gram)
          }
        }
        finalWords.push(denseWords[i])
        i++
      } else {
        i++
      }
    }

    // ═══════════════════════════════════════════════
    // STEP 6: REINSERT PRESERVED CODE BLOCKS (NEW in V4)
    // ═══════════════════════════════════════════════
    let result = finalWords.join(' ')

    for (const [placeholder, originalCode] of loweredCodeBlocks) {
      result = result.replaceAll(placeholder, '\n' + originalCode + '\n')
    }

    // Final cleanup — collapse multiple spaces
    result = result.replace(/\s+/g, ' ').trim()

    const endTime = performance.now()
    const compressedChars = result.length

    return {
      compressed: result,
      originalChars,
      compressedChars,
      reductionPercent: originalChars > 0
        ? parseFloat(((1 - compressedChars / originalChars) * 100).toFixed(2))
        : 0,
      processingTimeMs: parseFloat((endTime - startTime).toFixed(2)),
      estimatedTokensBefore: Math.ceil(originalChars / 4),
      estimatedTokensAfter: Math.ceil(compressedChars / 4),
    }
  }
}
