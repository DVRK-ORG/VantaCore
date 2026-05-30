import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Clock, FileText, Zap, ChevronDown, ChevronUp, Copy, RotateCcw } from 'lucide-react'
import { FREE_HISTORY_LIMIT, useCompressionStore } from '../stores/compressionStore'

function formatDate(timestamp: number) {
  const d = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatChars(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

interface HistorySidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function HistorySidebar({ isOpen, onClose }: HistorySidebarProps) {
  const { history, clearHistory, restoreHistoryEntry, deleteHistoryEntry } = useCompressionStore()
  const [width, setWidth] = useState(340)
  const [isResizing, setIsResizing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => {
    setShowClearConfirm(false)
    onClose()
  }, [onClose])

  const copyHistoryEntry = useCallback(async (compressed: string) => {
    if (!compressed) return
    try { await navigator.clipboard.writeText(compressed) } catch {
      const textarea = document.createElement('textarea')
      textarea.value = compressed
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)

    const startX = e.clientX
    const startWidth = width

    const handleMouseMove = (event: MouseEvent) => {
      const delta = startX - event.clientX
      setWidth(Math.min(520, Math.max(280, startWidth + delta)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [width])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) handleClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, handleClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1100,
              backdropFilter: 'blur(4px)',
            }}
          />

          <motion.div
            ref={sidebarRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: `${width}px`,
              zIndex: 1200,
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(180deg, rgba(12, 12, 12, 0.98), rgba(8, 8, 8, 0.99))',
              borderLeft: '1px solid rgba(196, 30, 58, 0.15)',
              backdropFilter: 'blur(24px)',
              boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.6), -2px 0 20px rgba(196, 30, 58, 0.05)',
            }}
          >
            <div
              onMouseDown={handleMouseDown}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '6px',
                cursor: 'col-resize',
                zIndex: 10,
                background: isResizing ? 'rgba(196, 30, 58, 0.3)' : 'transparent',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196, 30, 58, 0.2)' }}
              onMouseLeave={(e) => { if (!isResizing) e.currentTarget.style.background = 'transparent' }}
            />

            <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(112, 112, 112, 0.1)', flexShrink: 0 }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5">
                  <Clock size={16} className="text-blood-ruby" />
                  <span className="font-orbitron font-bold text-[13px] tracking-[2px] uppercase text-silver-white">
                    History
                  </span>
                  {history.length > 0 && (
                    <span
                      className="font-mono text-[11px] px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(196, 30, 58, 0.15)',
                        color: 'var(--blood-ruby)',
                        border: '1px solid rgba(196, 30, 58, 0.2)',
                      }}
                    >
                      {history.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center w-[30px] h-[30px] rounded-[8px] cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(112, 112, 112, 0.1)',
                    color: 'var(--muted-steel)',
                    transition: 'all 0.2s',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
              <p className="font-crimson text-[12px] text-obsidian-silver" style={{ opacity: 0.7 }}>
                Free local history keeps the last {FREE_HISTORY_LIMIT} compressions in this browser only.
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center" style={{ opacity: 0.4 }}>
                  <FileText size={40} className="text-muted-steel mb-4" />
                  <p className="font-orbitron text-[11px] tracking-[2px] uppercase text-muted-steel mb-2">
                    No compressions yet
                  </p>
                  <p className="font-crimson text-[13px] text-obsidian-silver italic">
                    Capsules stay local.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((entry, i) => {
                    const isExpanded = expandedId === entry.id
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className="cursor-pointer"
                        style={{
                          padding: '14px 16px',
                          borderRadius: '10px',
                          background: isExpanded
                            ? 'linear-gradient(135deg, rgba(196, 30, 58, 0.08), rgba(20, 20, 20, 0.9))'
                            : 'rgba(255, 255, 255, 0.02)',
                          border: `1px solid ${isExpanded ? 'rgba(196, 30, 58, 0.2)' : 'rgba(112, 112, 112, 0.08)'}`,
                          transition: 'all 0.25s ease',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[12px] text-silver-white truncate" style={{ maxWidth: '60%' }}>
                            {entry.fileName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-orbitron font-bold text-[13px]" style={{ color: 'var(--blood-ruby)' }}>
                              {entry.reductionPercent}%
                            </span>
                            {isExpanded ? (
                              <ChevronUp size={12} className="text-muted-steel" />
                            ) : (
                              <ChevronDown size={12} className="text-muted-steel" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-obsidian-silver">
                            {formatChars(entry.originalChars)} to {formatChars(entry.compressedChars)}
                          </span>
                          <span className="font-mono text-[10px] text-obsidian-silver" style={{ opacity: 0.6 }}>
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div
                                style={{
                                  marginTop: '12px',
                                  paddingTop: '12px',
                                  borderTop: '1px solid rgba(112, 112, 112, 0.1)',
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: '10px',
                                }}
                              >
                                <div>
                                  <div className="font-orbitron text-[8px] tracking-[2px] uppercase text-muted-steel mb-1">Original</div>
                                  <div className="font-mono text-[12px] text-silver-white">{entry.originalChars.toLocaleString()} chars</div>
                                </div>
                                <div>
                                  <div className="font-orbitron text-[8px] tracking-[2px] uppercase text-muted-steel mb-1">Compressed</div>
                                  <div className="font-mono text-[12px] text-blood-ruby">{entry.compressedChars.toLocaleString()} chars</div>
                                </div>
                                <div>
                                  <div className="font-orbitron text-[8px] tracking-[2px] uppercase text-muted-steel mb-1">Speed</div>
                                  <div className="font-mono text-[12px] text-silver-white flex items-center gap-1">
                                    <Zap size={10} className="text-blood-ruby" />
                                    {entry.processingTimeMs ? `${entry.processingTimeMs}ms` : '-'}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-orbitron text-[8px] tracking-[2px] uppercase text-muted-steel mb-1">Date</div>
                                  <div className="font-mono text-[12px] text-silver-white">
                                    {new Date(entry.timestamp).toLocaleDateString('en-US', {
                                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                    })}
                                  </div>
                                </div>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    restoreHistoryEntry(entry.id)
                                  }}
                                  disabled={!entry.compressed}
                                  className="flex items-center justify-center gap-1.5 py-2 rounded-[8px] font-orbitron text-[9px] font-semibold tracking-[1px] uppercase cursor-pointer"
                                  style={{
                                    gridColumn: 'span 2',
                                    background: 'rgba(196, 30, 58, 0.12)',
                                    border: '1px solid rgba(196, 30, 58, 0.24)',
                                    color: entry.compressed ? 'var(--blood-ruby)' : 'var(--muted-steel)',
                                  }}
                                >
                                  <RotateCcw size={11} />
                                  Restore Capsule
                                </button>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    void copyHistoryEntry(entry.compressed)
                                  }}
                                  disabled={!entry.compressed}
                                  className="flex items-center justify-center gap-1.5 py-2 rounded-[8px] font-orbitron text-[9px] font-semibold tracking-[1px] uppercase cursor-pointer"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(112, 112, 112, 0.15)',
                                    color: entry.compressed ? 'var(--silver-white)' : 'var(--muted-steel)',
                                  }}
                                >
                                  <Copy size={11} />
                                  Copy
                                </button>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    deleteHistoryEntry(entry.id)
                                  }}
                                  className="flex items-center justify-center gap-1.5 py-2 rounded-[8px] font-orbitron text-[9px] font-semibold tracking-[1px] uppercase cursor-pointer"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(112, 112, 112, 0.15)',
                                    color: 'var(--muted-steel)',
                                  }}
                                >
                                  <Trash2 size={11} />
                                  Delete
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(112, 112, 112, 0.1)', flexShrink: 0 }}>
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-[8px] font-orbitron text-[10px] font-semibold tracking-[2px] uppercase cursor-pointer"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(112, 112, 112, 0.1)',
                      color: 'var(--muted-steel)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Trash2 size={12} />
                    Clear History
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { clearHistory(); setShowClearConfirm(false) }}
                      className="flex-1 py-2.5 rounded-[8px] font-orbitron text-[10px] font-semibold tracking-[1px] uppercase cursor-pointer"
                      style={{
                        background: 'rgba(196, 30, 58, 0.15)',
                        border: '1px solid rgba(196, 30, 58, 0.3)',
                        color: 'var(--blood-ruby)',
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-2.5 rounded-[8px] font-orbitron text-[10px] font-semibold tracking-[1px] uppercase cursor-pointer"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(112, 112, 112, 0.15)',
                        color: 'var(--muted-steel)',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
