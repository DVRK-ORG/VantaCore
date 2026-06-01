import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, FileText, FileCode, Braces, FolderOpen, HardDrive, FolderSearch } from 'lucide-react'
import { getExportContent, downloadStringAsFile } from '../utils/exportBranding'
import type { CompressionProfile } from '../utils/compressionProfiles'
import {
  getSavedDirHandle,
  saveDirHandle,
  clearDirHandle,
  verifyPermission,
  writeToDir,
  supportsDirectoryPicker,
  supportsSaveFilePicker,
} from '../utils/exportFolder'

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
  sourceMode?: CompressionProfile
}

interface ExportCapsuleModalProps {
  entry: ExportEntry | null
  onClose: () => void
}

type ExportFormat = '.md' | '.txt' | '.json'
type DestinationMode = 'browser' | 'folder' | 'saveas'

const FORMAT_OPTIONS: { ext: ExportFormat; label: string; desc: string; icon: typeof FileText }[] = [
  { ext: '.md', label: 'Markdown', desc: 'Best for LLM handoff', icon: FileText },
  { ext: '.txt', label: 'Text', desc: 'Plain text with attribution', icon: FileCode },
  { ext: '.json', label: 'JSON', desc: 'Structured with stats', icon: Braces },
]

function sanitizeFilename(name: string): string {
  return name
    .replace(/\.[^/.]+$/, '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    || 'capsule'
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

/* ── Wrapper ─────────────────────────────────────────────────────────── */

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

/* ── Inner (remounts per entry via key) ──────────────────────────────── */

function ExportCapsuleModalInner({ entry, onClose }: { entry: ExportEntry; onClose: () => void }) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('.md')
  const [filename, setFilename] = useState(() => `${sanitizeFilename(entry.fileName)}_SHRUNK`)
  const [isExporting, setIsExporting] = useState(false)

  // Destination
  const [destination, setDestination] = useState<DestinationMode>('browser')
  const [savedFolderName, setSavedFolderName] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [savedDirHandle, setSavedDirHandle] = useState<any>(null)
  const [folderError, setFolderError] = useState<string | null>(null)

  // On mount, check for a previously saved directory handle
  useEffect(() => {
    if (!supportsDirectoryPicker) return
    let cancelled = false
    void (async () => {
      const handle = await getSavedDirHandle()
      if (handle && !cancelled) {
        setSavedDirHandle(handle)
        setSavedFolderName(handle.name ?? 'Selected folder')
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleBrowseFolder = useCallback(async () => {
    try {
      setFolderError(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' })
      await saveDirHandle(handle)
      setSavedDirHandle(handle)
      setSavedFolderName(handle.name ?? 'Selected folder')
      setDestination('folder')
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return // user cancelled
      setFolderError('Could not access folder')
    }
  }, [])

  const handleClearFolder = useCallback(async () => {
    await clearDirHandle()
    setSavedDirHandle(null)
    setSavedFolderName(null)
    if (destination === 'folder') setDestination('browser')
  }, [destination])

  const buildContent = useCallback(() => {
    const sourceMode = entry.sourceMode ?? 'memory-capsule'

    return getExportContent(selectedFormat, entry.compressed, {
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
    }, {
      compressionProfile: sourceMode,
      sourceProfile: sourceMode,
      sourceMode,
    })
  }, [entry, selectedFormat])

  const handleExport = useCallback(async () => {
    if (!entry.compressed || !filename.trim()) return
    setIsExporting(true)
    setFolderError(null)

    const content = buildContent()
    const fullFilename = `${filename.trim()}${selectedFormat}`

    try {
      if (destination === 'browser') {
        // Standard blob/anchor download — goes to browser's default Downloads folder
        downloadStringAsFile(content, fullFilename, selectedFormat)

      } else if (destination === 'folder') {
        // Write to saved directory handle
        if (!savedDirHandle) {
          setFolderError('No folder selected. Click Browse to choose one.')
          setIsExporting(false)
          return
        }
        const hasPermission = await verifyPermission(savedDirHandle)
        if (!hasPermission) {
          setFolderError('Permission denied. Please reselect the folder.')
          setSavedDirHandle(null)
          setSavedFolderName(null)
          await clearDirHandle()
          setIsExporting(false)
          return
        }
        await writeToDir(savedDirHandle, fullFilename, content)

      } else if (destination === 'saveas') {
        // Show file picker every time
        const mimeMap: Record<string, string> = {
          '.md': 'text/markdown',
          '.txt': 'text/plain',
          '.json': 'application/json',
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fullFilename,
          types: [{
            description: `${selectedFormat.slice(1).toUpperCase()} File`,
            accept: { [mimeMap[selectedFormat]]: [selectedFormat] },
          }],
        })
        const writable = await handle.createWritable()
        await writable.write(content)
        await writable.close()
      }

      setIsExporting(false)
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setIsExporting(false)
        return
      }
      // Fallback to browser download on any error
      downloadStringAsFile(content, fullFilename, selectedFormat)
      setIsExporting(false)
      onClose()
    }
  }, [entry, selectedFormat, filename, destination, savedDirHandle, buildContent, onClose])

  /* ── Shared inline styles ─────────────────────────────────────────── */

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '8px',
    fontWeight: 600,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'var(--muted-steel)',
    marginBottom: '8px',
  }

  const destBtnStyle = (active: boolean, disabled = false): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '8px 4px',
    borderRadius: '10px',
    background: active ? 'rgba(196, 30, 58, 0.1)' : 'rgba(255, 255, 255, 0.02)',
    border: `1px solid ${active ? 'rgba(196, 30, 58, 0.35)' : 'rgba(112, 112, 112, 0.1)'}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.4 : 1,
  })

  /* ── JSX ──────────────────────────────────────────────────────────── */

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <motion.button
        type="button"
        aria-label="Close export dialog"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          border: 'none',
          cursor: 'default',
        }}
      />

      {/* Modal card */}
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '420px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, rgb(18, 18, 18), rgb(12, 12, 12))',
          border: '1px solid rgba(196, 30, 58, 0.2)',
          borderRadius: '14px',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(196, 30, 58, 0.06)',
        }}
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
              style={{ fontSize: '12px', color: 'var(--silver-white)', marginBottom: '8px', wordBreak: 'break-all' }}
            >
              {entry.fileName}
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <div className="font-orbitron" style={{ fontSize: '7px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted-steel)', marginBottom: '2px' }}>Original</div>
                <div className="font-mono" style={{ fontSize: '12px', color: 'var(--obsidian-silver)' }}>{formatNum(entry.originalChars)}</div>
              </div>
              <div>
                <div className="font-orbitron" style={{ fontSize: '7px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted-steel)', marginBottom: '2px' }}>Compressed</div>
                <div className="font-mono" style={{ fontSize: '12px', color: 'var(--blood-ruby)' }}>{formatNum(entry.compressedChars)}</div>
              </div>
              <div>
                <div className="font-orbitron" style={{ fontSize: '7px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted-steel)', marginBottom: '2px' }}>Reduction</div>
                <div className="font-orbitron" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--blood-ruby)' }}>{entry.reductionPercent}%</div>
              </div>
            </div>
          </div>

          {/* Format selection */}
          <div style={{ marginBottom: '18px' }}>
            <div className="font-orbitron" style={sectionLabelStyle}>Format</div>
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
                    background: selectedFormat === ext ? 'rgba(196, 30, 58, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${selectedFormat === ext ? 'rgba(196, 30, 58, 0.35)' : 'rgba(112, 112, 112, 0.1)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon size={16} style={{ color: selectedFormat === ext ? 'var(--blood-ruby)' : 'var(--muted-steel)', transition: 'color 0.2s' }} />
                  <span className="font-orbitron" style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '1px', color: selectedFormat === ext ? 'var(--silver-white)' : 'var(--muted-steel)', transition: 'color 0.2s' }}>{label}</span>
                  <span className="font-crimson" style={{ fontSize: '9px', color: 'var(--obsidian-silver)', opacity: 0.6 }}>{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filename */}
          <div style={{ marginBottom: '18px' }}>
            <div className="font-orbitron" style={sectionLabelStyle}>Filename</div>
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

          {/* Destination */}
          <div style={{ marginBottom: '18px' }}>
            <div className="font-orbitron" style={sectionLabelStyle}>Destination</div>
            <div style={{ display: 'flex', gap: '6px' }}>

              {/* Browser Downloads */}
              <button onClick={() => setDestination('browser')} style={destBtnStyle(destination === 'browser')}>
                <HardDrive size={14} style={{ color: destination === 'browser' ? 'var(--blood-ruby)' : 'var(--muted-steel)', transition: 'color 0.2s' }} />
                <span className="font-orbitron" style={{ fontSize: '8px', fontWeight: 600, letterSpacing: '0.5px', color: destination === 'browser' ? 'var(--silver-white)' : 'var(--muted-steel)', transition: 'color 0.2s' }}>Downloads</span>
              </button>

              {/* Saved Folder */}
              <button
                onClick={() => {
                  if (!supportsDirectoryPicker) return
                  if (savedDirHandle) {
                    setDestination('folder')
                  } else {
                    void handleBrowseFolder()
                  }
                }}
                disabled={!supportsDirectoryPicker}
                style={destBtnStyle(destination === 'folder', !supportsDirectoryPicker)}
              >
                <FolderOpen size={14} style={{ color: destination === 'folder' ? 'var(--blood-ruby)' : 'var(--muted-steel)', transition: 'color 0.2s' }} />
                <span className="font-orbitron" style={{ fontSize: '8px', fontWeight: 600, letterSpacing: '0.5px', color: destination === 'folder' ? 'var(--silver-white)' : 'var(--muted-steel)', transition: 'color 0.2s' }}>Folder</span>
              </button>

              {/* Save As */}
              <button
                onClick={() => { if (supportsSaveFilePicker) setDestination('saveas') }}
                disabled={!supportsSaveFilePicker}
                style={destBtnStyle(destination === 'saveas', !supportsSaveFilePicker)}
              >
                <FolderSearch size={14} style={{ color: destination === 'saveas' ? 'var(--blood-ruby)' : 'var(--muted-steel)', transition: 'color 0.2s' }} />
                <span className="font-orbitron" style={{ fontSize: '8px', fontWeight: 600, letterSpacing: '0.5px', color: destination === 'saveas' ? 'var(--silver-white)' : 'var(--muted-steel)', transition: 'color 0.2s' }}>Save As</span>
              </button>
            </div>

            {/* Saved folder info / actions */}
            {destination === 'folder' && supportsDirectoryPicker && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {savedFolderName && (
                  <span className="font-mono" style={{ fontSize: '11px', color: 'var(--obsidian-silver)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FolderOpen size={11} style={{ color: 'var(--blood-ruby)', opacity: 0.7 }} />
                    {savedFolderName}
                  </span>
                )}
                <button
                  onClick={() => void handleBrowseFolder()}
                  className="font-orbitron"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '8px',
                    fontWeight: 600,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    background: 'rgba(196, 30, 58, 0.08)',
                    border: '1px solid rgba(196, 30, 58, 0.2)',
                    color: 'var(--blood-ruby)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {savedFolderName ? 'Change' : 'Browse'}
                </button>
                {savedFolderName && (
                  <button
                    onClick={() => void handleClearFolder()}
                    className="font-orbitron"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '8px',
                      fontWeight: 600,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(112, 112, 112, 0.12)',
                      color: 'var(--muted-steel)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Folder not supported note */}
            {!supportsDirectoryPicker && (
              <div className="font-mono" style={{ fontSize: '9px', color: 'var(--muted-steel)', opacity: 0.5, marginTop: '6px' }}>
                Folder export requires a Chromium browser (Chrome, Edge, Brave).
              </div>
            )}

            {/* Error */}
            {folderError && (
              <div className="font-mono" style={{ fontSize: '10px', color: 'var(--blood-ruby)', marginTop: '6px' }}>
                {folderError}
              </div>
            )}
          </div>

          {/* Attribution note */}
          <div
            className="font-mono"
            style={{ fontSize: '10px', color: 'var(--muted-steel)', opacity: 0.7, marginBottom: '18px', lineHeight: 1.5 }}
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
                background: isExporting ? 'rgba(196, 30, 58, 0.3)' : 'var(--blood-ruby)',
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
    </motion.div>
  )
}
