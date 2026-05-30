import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, FileText, FileCode, Braces } from 'lucide-react'
import { getExportContent, downloadStringAsFile } from '../utils/exportBranding'

export interface ExportEntry {
  id: string
  fileName: string
  compressed: string
  originalChars: number
  compressedChars: number
  reductionPercent: number
  estimatedTokensBefore: number
  estimatedTokensAfter: number
  tokenEstimationMethod: string
  repeatedBlocksFolded: number
  dictionaryReferencesCreated: number
  clustersDetected: number
  codeBlocksProtected: number
  codeBlocksIntegrityOk: boolean
}

interface ExportCapsuleModalProps {
  entry: ExportEntry | null
  onClose: () => void
}

type ExportFormat = '.md' | '.txt' | '.json'

const FORMAT_OPTIONS: { ext: ExportFormat; label: string; desc: string; icon: typeof FileText }[] = [
  { ext: '.md', label: 'Markdown', desc: 'Best for LLM handoff', icon: FileText },
  { ext: '.txt', label: 'Text', desc: 'Plain text with attribution', icon: FileCode },
  { ext: '.json', label: 'JSON', desc: 'Structured with stats', icon: Braces },
]

function sanitizeFilename(name: string): string {
  return name
    .replace(/\.[^/.]+$/, '')       // strip extension
    .replace(/[<>:"/\\|?*]/g, '_') // replace illegal chars
    .replace(/\s+/g, '_')          // replace spaces
    .replace(/_+/g, '_')           // collapse underscores
    .replace(/^_|_$/g, '')         // trim leading/trailing
    || 'capsule'
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

const supportsFilePicker = typeof window !== 'undefined' && 'showSaveFilePicker' in window

export function ExportCapsuleModal({ entry, onClose }: ExportCapsuleModalProps) {
  return createPortal(
    <AnimatePresence>
      {entry && (
        <ExportCapsuleModalInner key={entry.id} entry={entry} onClose={onClose} />
      )}
    </AnimatePresence>,
    document.body
  )
}

function ExportCapsuleModalInner({ entry, onClose }: { entry: ExportEntry; onClose: () => void }) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('.md')
  const [filename, setFilename] = useState(() => `${sanitizeFilename(entry.fileName)}_SHRUNK`)
  const [isExporting, setIsExporting] = useState(false)

  // Escape key closes
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleExport = useCallback(async () => {
    if (!entry || !entry.compressed || !filename.trim()) return
    setIsExporting(true)

    const content = getExportContent(selectedFormat, entry.compressed, {
      originalChars: entry.originalChars,
      compressedChars: entry.compressedChars,
      reductionPercent: entry.reductionPercent,
      estimatedTokensBefore: entry.estimatedTokensBefore,
      estimatedTokensAfter: entry.estimatedTokensAfter,
      tokenEstimationMethod: entry.tokenEstimationMethod,
      repeatedBlocksFolded: entry.repeatedBlocksFolded,
      dictionaryReferencesCreated: entry.dictionaryReferencesCreated,
      clustersDetected: entry.clustersDetected,
      codeBlocksProtected: entry.codeBlocksProtected,
      codeBlocksIntegrityOk: entry.codeBlocksIntegrityOk,
    })

    const fullFilename = `${filename.trim()}${selectedFormat}`

    // Try File System Access API if available, fall back to blob download
    if (supportsFilePicker) {
      try {
        const mimeMap: Record<string, string> = {
          '.md': 'text/markdown',
          '.txt': 'text/plain',
          '.json': 'application/json',
        }
        const extMap: Record<string, string> = {
          '.md': 'Markdown',
          '.txt': 'Text',
          '.json': 'JSON',
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fullFilename,
          types: [{
            description: `${extMap[selectedFormat]} File`,
            accept: { [mimeMap[selectedFormat]]: [selectedFormat] },
          }],
        })
        const writable = await handle.createWritable()
        await writable.write(content)
        await writable.close()
      } catch (err: unknown) {
        // User cancelled the picker — not an error
        if (err instanceof Error && err.name === 'AbortError') {
          setIsExporting(false)
          return
        }
        // Fallback to standard download
        downloadStringAsFile(content, fullFilename, selectedFormat)
      }
    } else {
      downloadStringAsFile(content, fullFilename, selectedFormat)
    }

    setIsExporting(false)
    onClose()
  }, [entry, selectedFormat, filename, onClose])

  return (
    <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 2000,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(420px, calc(100vw - 32px))',
              maxHeight: 'calc(100vh - 48px)',
              overflowY: 'auto',
              background: 'linear-gradient(180deg, rgb(18, 18, 18), rgb(12, 12, 12))',
              border: '1px solid rgba(196, 30, 58, 0.2)',
              borderRadius: '14px',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(196, 30, 58, 0.06)',
              zIndex: 2001,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 22px 14px',
              borderBottom: '1px solid rgba(112, 112, 112, 0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Download size={15} style={{ color: 'var(--blood-ruby)' }} />
                <span
                  className="font-orbitron"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '2.5px',
                    textTransform: 'uppercase',
                    color: 'var(--silver-white)',
                  }}
                >
                  Export Memory Capsule
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(112, 112, 112, 0.1)',
                  color: 'var(--muted-steel)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '18px 22px' }}>
              {/* Capsule info */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(112, 112, 112, 0.08)',
                marginBottom: '18px',
              }}>
                <div
                  className="font-mono"
                  style={{
                    fontSize: '12px',
                    color: 'var(--silver-white)',
                    marginBottom: '8px',
                    wordBreak: 'break-all',
                  }}
                >
                  {entry.fileName}
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <div className="font-orbitron" style={{ fontSize: '7px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted-steel)', marginBottom: '2px' }}>
                      Original
                    </div>
                    <div className="font-mono" style={{ fontSize: '12px', color: 'var(--obsidian-silver)' }}>
                      {formatNum(entry.originalChars)}
                    </div>
                  </div>
                  <div>
                    <div className="font-orbitron" style={{ fontSize: '7px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted-steel)', marginBottom: '2px' }}>
                      Compressed
                    </div>
                    <div className="font-mono" style={{ fontSize: '12px', color: 'var(--blood-ruby)' }}>
                      {formatNum(entry.compressedChars)}
                    </div>
                  </div>
                  <div>
                    <div className="font-orbitron" style={{ fontSize: '7px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted-steel)', marginBottom: '2px' }}>
                      Reduction
                    </div>
                    <div className="font-orbitron" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--blood-ruby)' }}>
                      {entry.reductionPercent}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Format selection */}
              <div style={{ marginBottom: '18px' }}>
                <div
                  className="font-orbitron"
                  style={{
                    fontSize: '8px',
                    fontWeight: 600,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: 'var(--muted-steel)',
                    marginBottom: '8px',
                  }}
                >
                  Format
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {FORMAT_OPTIONS.map(({ ext, label, desc, icon: Icon }) => (
                    <button
                      key={ext}
                      onClick={() => setSelectedFormat(ext)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '10px 6px',
                        borderRadius: '10px',
                        background: selectedFormat === ext
                          ? 'rgba(196, 30, 58, 0.1)'
                          : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${
                          selectedFormat === ext
                            ? 'rgba(196, 30, 58, 0.35)'
                            : 'rgba(112, 112, 112, 0.1)'
                        }`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Icon
                        size={16}
                        style={{
                          color: selectedFormat === ext
                            ? 'var(--blood-ruby)'
                            : 'var(--muted-steel)',
                          transition: 'color 0.2s',
                        }}
                      />
                      <span
                        className="font-orbitron"
                        style={{
                          fontSize: '9px',
                          fontWeight: 600,
                          letterSpacing: '1px',
                          color: selectedFormat === ext
                            ? 'var(--silver-white)'
                            : 'var(--muted-steel)',
                          transition: 'color 0.2s',
                        }}
                      >
                        {label}
                      </span>
                      <span
                        className="font-crimson"
                        style={{
                          fontSize: '9px',
                          color: 'var(--obsidian-silver)',
                          opacity: 0.6,
                        }}
                      >
                        {desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filename */}
              <div style={{ marginBottom: '18px' }}>
                <div
                  className="font-orbitron"
                  style={{
                    fontSize: '8px',
                    fontWeight: 600,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: 'var(--muted-steel)',
                    marginBottom: '8px',
                  }}
                >
                  Filename
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(112, 112, 112, 0.12)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}>
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    spellCheck={false}
                    className="font-mono"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '12px',
                      color: 'var(--silver-white)',
                      minWidth: 0,
                    }}
                  />
                  <span
                    className="font-mono"
                    style={{
                      padding: '10px 12px',
                      fontSize: '12px',
                      color: 'var(--blood-ruby)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      borderLeft: '1px solid rgba(112, 112, 112, 0.1)',
                      background: 'rgba(196, 30, 58, 0.04)',
                    }}
                  >
                    {selectedFormat}
                  </span>
                </div>
              </div>

              {/* Attribution note */}
              <div
                className="font-mono"
                style={{
                  fontSize: '10px',
                  color: 'var(--muted-steel)',
                  opacity: 0.7,
                  marginBottom: '18px',
                  lineHeight: 1.5,
                }}
              >
                Free exports include VantaCore attribution. Your content remains yours.
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={onClose}
                  className="font-orbitron"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(112, 112, 112, 0.15)',
                    color: 'var(--muted-steel)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleExport()}
                  disabled={isExporting || !filename.trim()}
                  className="font-orbitron"
                  style={{
                    flex: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    background: isExporting
                      ? 'rgba(196, 30, 58, 0.3)'
                      : 'var(--blood-ruby)',
                    border: 'none',
                    color: isExporting ? 'var(--muted-steel)' : '#050505',
                    cursor: isExporting || !filename.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: !filename.trim() ? 0.5 : 1,
                  }}
                >
                  <Download size={13} />
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
            </div>
          </motion.div>
    </>
  )
}
