import type { CompressionResult } from '../engine/types'
import {
  CONTENT_OWNERSHIP_NOTE,
  VANTACORE_ATTRIBUTION,
} from './exportBranding'

export type ImportedCapsuleFormat = 'json' | 'markdown' | 'text'

export interface ImportedCapsule {
  fileName: string
  format: ImportedCapsuleFormat
  compressed: string
  result: CompressionResult
  hasTrustedStats: boolean
  warnings: string[]
}

type JsonRecord = Record<string, unknown>

const TRUSTED_STATS_WARNING =
  'Imported capsule did not include trusted stats, so display metrics are estimated from capsule content.'

const numericStatKeys = [
  'originalChars',
  'compressedChars',
  'reductionPercent',
  'estimatedTokensBefore',
  'estimatedTokensAfter',
  'repeatedBlocksFolded',
  'dictionaryReferencesCreated',
  'clustersDetected',
  'codeBlocksProtected',
] as const

type NumericStatKey = typeof numericStatKeys[number]

type TrustedStats = Pick<CompressionResult,
  | NumericStatKey
  | 'tokenEstimationMethod'
  | 'codeBlocksIntegrityOk'
>

const normalizeLineEndings = (content: string) => content.replace(/\r\n?/g, '\n')

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const countFenceMarkers = (content: string) =>
  content.match(/^```/gm)?.length ?? 0

const buildFallbackResult = (compressed: string): CompressionResult => {
  const compressedChars = compressed.length
  const estimatedTokens = Math.ceil(compressedChars / 4)
  const clusterCount = compressed.match(/^##\s*\[CLUSTER-/gim)?.length ?? 0
  const fenceMarkers = countFenceMarkers(compressed)

  return {
    compressed,
    originalChars: compressedChars,
    compressedChars,
    reductionPercent: 0,
    processingTimeMs: 0,
    estimatedTokensBefore: estimatedTokens,
    estimatedTokensAfter: estimatedTokens,
    tokenEstimationMethod: 'approximate: ceil(characters / 4)',
    repeatedBlocksFolded: 0,
    dictionaryReferencesCreated: 0,
    clustersDetected: clusterCount || 1,
    codeBlocksProtected: Math.floor(fenceMarkers / 2),
    codeBlocksIntegrityOk: fenceMarkers % 2 === 0,
  }
}

const hasReasonableCompressedLength = (statsLength: number, actualLength: number) =>
  Math.abs(statsLength - actualLength) <= Math.max(2, Math.ceil(actualLength * 0.02))

const readTrustedStats = (stats: unknown, actualCompressedLength: number): TrustedStats | null => {
  if (!isRecord(stats)) return null

  for (const key of numericStatKeys) {
    if (!isFiniteNumber(stats[key])) return null
  }

  if (
    typeof stats.tokenEstimationMethod !== 'string' ||
    !stats.tokenEstimationMethod.trim() ||
    typeof stats.codeBlocksIntegrityOk !== 'boolean'
  ) {
    return null
  }

  const statNumber = (key: NumericStatKey) => stats[key] as number

  const trusted: TrustedStats = {
    originalChars: statNumber('originalChars'),
    compressedChars: statNumber('compressedChars'),
    reductionPercent: statNumber('reductionPercent'),
    estimatedTokensBefore: statNumber('estimatedTokensBefore'),
    estimatedTokensAfter: statNumber('estimatedTokensAfter'),
    tokenEstimationMethod: stats.tokenEstimationMethod,
    repeatedBlocksFolded: statNumber('repeatedBlocksFolded'),
    dictionaryReferencesCreated: statNumber('dictionaryReferencesCreated'),
    clustersDetected: statNumber('clustersDetected'),
    codeBlocksProtected: statNumber('codeBlocksProtected'),
    codeBlocksIntegrityOk: stats.codeBlocksIntegrityOk,
  }

  const nonNegativeKeys: NumericStatKey[] = [
    'originalChars',
    'compressedChars',
    'estimatedTokensBefore',
    'estimatedTokensAfter',
    'repeatedBlocksFolded',
    'dictionaryReferencesCreated',
    'clustersDetected',
    'codeBlocksProtected',
  ]

  const hasNegativeStat = nonNegativeKeys.some((key) => trusted[key] < 0)
  const hasBadReduction = trusted.reductionPercent > 100
  const hasBadCompressedLength = !hasReasonableCompressedLength(
    trusted.compressedChars,
    actualCompressedLength
  )

  if (hasNegativeStat || hasBadReduction || hasBadCompressedLength) return null
  return trusted
}

const resultFromTrustedStats = (compressed: string, stats: TrustedStats): CompressionResult => ({
  compressed,
  originalChars: stats.originalChars,
  compressedChars: stats.compressedChars,
  reductionPercent: stats.reductionPercent,
  processingTimeMs: 0,
  estimatedTokensBefore: stats.estimatedTokensBefore,
  estimatedTokensAfter: stats.estimatedTokensAfter,
  tokenEstimationMethod: stats.tokenEstimationMethod,
  repeatedBlocksFolded: stats.repeatedBlocksFolded,
  dictionaryReferencesCreated: stats.dictionaryReferencesCreated,
  clustersDetected: stats.clustersDetected,
  codeBlocksProtected: stats.codeBlocksProtected,
  codeBlocksIntegrityOk: stats.codeBlocksIntegrityOk,
})

const detectFormat = (fileName: string, rawContent: string): ImportedCapsuleFormat => {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.json') || rawContent.trim().startsWith('{')) return 'json'
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown'
  return 'text'
}

const stripFrontmatter = (content: string) => {
  if (!content.startsWith('---\n')) return content
  const endIndex = content.indexOf('\n---', 4)
  if (endIndex === -1) return content
  const afterFence = content.indexOf('\n', endIndex + 4)
  return afterFence === -1 ? '' : content.slice(afterFence + 1).trim()
}

const stripVantaCoreHtmlComments = (content: string) =>
  content.replace(/<!--[\s\S]*?VantaCore[\s\S]*?-->\s*/gi, '').trim()

const stripTrailingAttributionFooter = (content: string) => {
  const dividerMatches = [...content.matchAll(/(^|\n)\s*---\s*\n/g)]
  if (dividerMatches.length === 0) return content.trim()

  const lastDivider = dividerMatches[dividerMatches.length - 1]
  const dividerStart = lastDivider.index ?? -1
  if (dividerStart < 0) return content.trim()

  const footer = content.slice(dividerStart).trim()
  const isVantaCoreFooter =
    footer.includes(VANTACORE_ATTRIBUTION) &&
    footer.includes(CONTENT_OWNERSHIP_NOTE) &&
    footer.length <= 1200

  return isVantaCoreFooter ? content.slice(0, dividerStart).trim() : content.trim()
}

const extractCapsuleText = (
  rawContent: string,
  format: Exclude<ImportedCapsuleFormat, 'json'>
) => {
  const warnings: string[] = []
  let content = normalizeLineEndings(rawContent).trim()

  if (format === 'markdown') {
    content = stripFrontmatter(content)
    content = stripVantaCoreHtmlComments(content)
  }

  const markerIndex = content.indexOf('# VantaCore Memory Capsule')
  if (markerIndex >= 0) {
    content = content.slice(markerIndex).trim()
  } else {
    warnings.push(
      `${format === 'markdown' ? 'Markdown' : 'Text'} import did not include the VantaCore capsule marker, so the cleaned file body will be restored as capsule text.`
    )
  }

  content = stripTrailingAttributionFooter(content)

  if (!content.trim()) {
    throw new Error('No usable Memory Capsule content was found in this file.')
  }

  return { compressed: content.trim(), warnings }
}

const parseJsonCapsule = (fileName: string, rawContent: string): ImportedCapsule => {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    throw new Error('This JSON file could not be parsed as a Memory Capsule export.')
  }

  if (!isRecord(parsed)) {
    throw new Error('This JSON file does not contain a usable Memory Capsule object.')
  }

  const compressedValue = parsed.compressed
  if (typeof compressedValue !== 'string' || !compressedValue.trim()) {
    throw new Error('This JSON file does not include usable compressed capsule text.')
  }

  const compressed = normalizeLineEndings(compressedValue).trim()
  const trustedStats = readTrustedStats(parsed.stats, compressed.length)
  const warnings: string[] = []

  if (parsed.stats && !trustedStats) {
    warnings.push('Imported JSON stats were incomplete or inconsistent.')
  }

  if (!trustedStats) {
    warnings.push(TRUSTED_STATS_WARNING)
  }

  return {
    fileName,
    format: 'json',
    compressed,
    result: trustedStats
      ? resultFromTrustedStats(compressed, trustedStats)
      : buildFallbackResult(compressed),
    hasTrustedStats: Boolean(trustedStats),
    warnings,
  }
}

export function parseImportedCapsule(fileName: string, rawContent: string): ImportedCapsule {
  const format = detectFormat(fileName, rawContent)

  if (format === 'json') {
    return parseJsonCapsule(fileName, rawContent)
  }

  const { compressed, warnings } = extractCapsuleText(rawContent, format)

  return {
    fileName,
    format,
    compressed,
    result: buildFallbackResult(compressed),
    hasTrustedStats: false,
    warnings: [...warnings, TRUSTED_STATS_WARNING],
  }
}
