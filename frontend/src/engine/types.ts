export interface CompressionResult {
  compressed: string
  originalChars: number
  compressedChars: number
  reductionPercent: number
  processingTimeMs: number
  estimatedTokensBefore: number
  estimatedTokensAfter: number
  tokenEstimationMethod: string
  repeatedBlocksFolded: number
  dictionaryReferencesCreated: number
  clustersDetected: number
  codeBlocksProtected: number
  codeBlocksIntegrityOk: boolean
}
