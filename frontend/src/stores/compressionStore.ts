import { create } from 'zustand'
import type { CompressionResult } from '../engine/types'
import type { CompressionProfile } from '../utils/compressionProfiles'

export const FREE_DAILY_COMPRESSION_LIMIT = 5
export const FREE_HISTORY_LIMIT = 20

interface HistoryEntry {
  id: string
  fileName: string
  compressed: string
  originalChars: number
  compressedChars: number
  reductionPercent: number
  processingTimeMs: number
  estimatedTokensBefore: number
  estimatedTokensAfter: number
  tokenEstimationMethod: string
  codeBlocksProtected: number
  repeatedBlocksFolded: number
  dictionaryReferencesCreated: number
  clustersDetected: number
  codeBlocksIntegrityOk: boolean
  timestamp: number
  sourceMode?: CompressionProfile
}

interface CompressionStore {
  // Input
  inputText: string
  inputFileName: string
  inputMode: CompressionProfile
  setInputText: (text: string) => void
  setInputFileName: (name: string) => void
  setInputMode: (mode: CompressionProfile) => void

  // Compression state
  isCompressing: boolean
  hasResult: boolean
  result: CompressionResult | null
  setCompressing: (state: boolean) => void
  setResult: (result: CompressionResult) => void
  restoreImportedCapsule: (fileName: string, result: CompressionResult) => void
  reset: () => void

  // Free demo usage
  dailyUsageDate: string
  dailyCompressionsUsed: number
  dailyCompressionsRemaining: number
  canCompressToday: boolean
  refreshDailyUsage: () => void
  claimDailyCompression: () => boolean

  // History
  history: HistoryEntry[]
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  restoreHistoryEntry: (id: string) => void
  deleteHistoryEntry: (id: string) => void
  clearHistory: () => void
}

const DAILY_USAGE_KEY = 'vantacore_daily_usage'

const todayKey = () => {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const readDailyUsage = () => {
  const today = todayKey()
  try {
    const stored = localStorage.getItem(DAILY_USAGE_KEY)
    const parsed = stored ? JSON.parse(stored) as { date?: string; used?: number } : null
    if (parsed?.date === today) {
      return { date: today, used: Math.max(0, parsed.used ?? 0) }
    }
  } catch { /* ignore storage errors */ }
  return { date: today, used: 0 }
}

const saveDailyUsage = (used: number) => {
  try {
    localStorage.setItem(DAILY_USAGE_KEY, JSON.stringify({ date: todayKey(), used }))
  } catch { /* ignore storage errors */ }
}

const remainingFromUsed = (used: number) => Math.max(0, FREE_DAILY_COMPRESSION_LIMIT - used)

const loadHistory = (): HistoryEntry[] => {
  try {
    const stored = localStorage.getItem('vantacore_history')
    const entries = stored ? JSON.parse(stored) as Partial<HistoryEntry>[] : []
    return entries
      .filter((entry) => entry.id && entry.timestamp)
      .map((entry) => ({
        id: entry.id ?? crypto.randomUUID(),
        fileName: entry.fileName ?? 'Pasted text',
        compressed: entry.compressed ?? '',
        originalChars: entry.originalChars ?? 0,
        compressedChars: entry.compressedChars ?? 0,
        reductionPercent: entry.reductionPercent ?? 0,
        processingTimeMs: entry.processingTimeMs ?? 0,
        estimatedTokensBefore: entry.estimatedTokensBefore ?? Math.ceil((entry.originalChars ?? 0) / 4),
        estimatedTokensAfter: entry.estimatedTokensAfter ?? Math.ceil((entry.compressedChars ?? 0) / 4),
        tokenEstimationMethod: entry.tokenEstimationMethod ?? 'approximate: ceil(characters / 4)',
        codeBlocksProtected: entry.codeBlocksProtected ?? 0,
        repeatedBlocksFolded: entry.repeatedBlocksFolded ?? 0,
        dictionaryReferencesCreated: entry.dictionaryReferencesCreated ?? 0,
        clustersDetected: entry.clustersDetected ?? 0,
        codeBlocksIntegrityOk: entry.codeBlocksIntegrityOk ?? true,
        timestamp: entry.timestamp ?? Date.now(),
        sourceMode: (entry as Partial<HistoryEntry>).sourceMode ?? 'memory-capsule',
      }))
      .slice(0, FREE_HISTORY_LIMIT)
  } catch {
    return []
  }
}

const saveHistory = (history: HistoryEntry[]) => {
  try {
    localStorage.setItem('vantacore_history', JSON.stringify(history.slice(0, FREE_HISTORY_LIMIT)))
  } catch { /* ignore storage errors */ }
}

const initialUsage = readDailyUsage()

export const useCompressionStore = create<CompressionStore>((set, get) => ({
  inputText: '',
  inputFileName: '',
  inputMode: 'memory-capsule',
  setInputText: (text) => set({ inputText: text }),
  setInputFileName: (name) => set({ inputFileName: name }),
  setInputMode: (mode) => set({ inputMode: mode }),

  isCompressing: false,
  hasResult: false,
  result: null,
  setCompressing: (state) => set({ isCompressing: state }),
  setResult: (result) => set({ result, hasResult: true, isCompressing: false }),
  restoreImportedCapsule: (fileName, result) => set({
    inputFileName: fileName || 'Imported capsule',
    result,
    hasResult: true,
    isCompressing: false,
  }),
  reset: () => set({ inputText: '', inputFileName: '', hasResult: false, result: null }),

  dailyUsageDate: initialUsage.date,
  dailyCompressionsUsed: initialUsage.used,
  dailyCompressionsRemaining: remainingFromUsed(initialUsage.used),
  canCompressToday: initialUsage.used < FREE_DAILY_COMPRESSION_LIMIT,
  refreshDailyUsage: () => {
    const usage = readDailyUsage()
    set({
      dailyUsageDate: usage.date,
      dailyCompressionsUsed: usage.used,
      dailyCompressionsRemaining: remainingFromUsed(usage.used),
      canCompressToday: usage.used < FREE_DAILY_COMPRESSION_LIMIT,
    })
  },
  claimDailyCompression: () => {
    const usage = readDailyUsage()
    if (usage.used >= FREE_DAILY_COMPRESSION_LIMIT) {
      set({
        dailyUsageDate: usage.date,
        dailyCompressionsUsed: usage.used,
        dailyCompressionsRemaining: 0,
        canCompressToday: false,
      })
      return false
    }
    const nextUsed = usage.used + 1
    saveDailyUsage(nextUsed)
    set({
      dailyUsageDate: usage.date,
      dailyCompressionsUsed: nextUsed,
      dailyCompressionsRemaining: remainingFromUsed(nextUsed),
      canCompressToday: nextUsed < FREE_DAILY_COMPRESSION_LIMIT,
    })
    return true
  },

  history: loadHistory(),
  addHistory: (entry) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    const updated = [newEntry, ...get().history].slice(0, FREE_HISTORY_LIMIT)
    saveHistory(updated)
    set({ history: updated })
  },
  restoreHistoryEntry: (id) => {
    const entry = get().history.find((item) => item.id === id)
    if (!entry || !entry.compressed) return
    set({
      inputFileName: entry.fileName,
      result: {
        compressed: entry.compressed,
        originalChars: entry.originalChars,
        compressedChars: entry.compressedChars,
        reductionPercent: entry.reductionPercent,
        processingTimeMs: entry.processingTimeMs,
        estimatedTokensBefore: entry.estimatedTokensBefore,
        estimatedTokensAfter: entry.estimatedTokensAfter,
        tokenEstimationMethod: entry.tokenEstimationMethod,
        repeatedBlocksFolded: entry.repeatedBlocksFolded,
        dictionaryReferencesCreated: entry.dictionaryReferencesCreated,
        clustersDetected: entry.clustersDetected,
        codeBlocksProtected: entry.codeBlocksProtected,
        codeBlocksIntegrityOk: entry.codeBlocksIntegrityOk,
      },
      hasResult: true,
    })
  },
  deleteHistoryEntry: (id) => {
    const updated = get().history.filter((entry) => entry.id !== id)
    saveHistory(updated)
    set({ history: updated })
  },
  clearHistory: () => {
    localStorage.removeItem('vantacore_history')
    set({ history: [] })
  },
}))
