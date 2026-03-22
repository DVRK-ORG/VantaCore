export interface CompressionResult {
  compressed: string
  originalChars: number
  compressedChars: number
  reductionPercent: number
  processingTimeMs: number
  estimatedTokensBefore: number
  estimatedTokensAfter: number
}
