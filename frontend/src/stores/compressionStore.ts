import { create } from 'zustand'
import type { CompressionResult } from '../engine/types'

interface HistoryEntry {
  id: string
  fileName: string
  originalChars: number
  compressedChars: number
  reductionPercent: number
  timestamp: number
}

interface CompressionStore {
  // Input
  inputText: string
  inputFileName: string
  setInputText: (text: string) => void
  setInputFileName: (name: string) => void

  // Compression state
  isCompressing: boolean
  hasResult: boolean
  result: CompressionResult | null
  setCompressing: (state: boolean) => void
  setResult: (result: CompressionResult) => void
  reset: () => void

  // History
  history: HistoryEntry[]
  addHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  clearHistory: () => void
}

const loadHistory = (): HistoryEntry[] => {
  try {
    const stored = localStorage.getItem('vantacore_history')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

const saveHistory = (history: HistoryEntry[]) => {
  try {
    localStorage.setItem('vantacore_history', JSON.stringify(history.slice(0, 20)))
  } catch { /* ignore storage errors */ }
}

export const useCompressionStore = create<CompressionStore>((set, get) => ({
  inputText: '',
  inputFileName: '',
  setInputText: (text) => set({ inputText: text }),
  setInputFileName: (name) => set({ inputFileName: name }),

  isCompressing: false,
  hasResult: false,
  result: null,
  setCompressing: (state) => set({ isCompressing: state }),
  setResult: (result) => set({ result, hasResult: true, isCompressing: false }),
  reset: () => set({ inputText: '', inputFileName: '', hasResult: false, result: null }),

  history: loadHistory(),
  addHistory: (entry) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    const updated = [newEntry, ...get().history].slice(0, 20)
    saveHistory(updated)
    set({ history: updated })
  },
  clearHistory: () => {
    localStorage.removeItem('vantacore_history')
    set({ history: [] })
  },
}))
