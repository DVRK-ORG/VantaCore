import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, FileUp, RotateCcw, ShieldCheck, X } from 'lucide-react'
import { useCompressionStore } from '../stores/compressionStore'
import { parseImportedCapsule, type ImportedCapsule } from '../utils/importCapsule'

const ACCEPTED_IMPORT_TYPES = '.md,.txt,.json'

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatImportFormat(format: ImportedCapsule['format']) {
  if (format === 'json') return 'JSON'
  if (format === 'markdown') return 'Markdown'
  return 'Text'
}

function PreviewStat({ label, value, ruby = false }: { label: string; value: string; ruby?: boolean }) {
  return (
    <div>
      <div
        className="font-orbitron"
        style={{
          fontSize: '7px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'var(--muted-steel)',
          marginBottom: '3px',
        }}
      >
        {label}
      </div>
      <div
        className="font-mono"
        style={{
          fontSize: '12px',
          color: ruby ? 'var(--blood-ruby)' : 'var(--obsidian-silver)',
          wordBreak: 'break-word',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function ImportPreviewModal({
  capsule,
  onCancel,
  onRestore,
}: {
  capsule: ImportedCapsule | null
  onCancel: () => void
  onRestore: () => void
}) {
  useEffect(() => {
    if (!capsule) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [capsule, onCancel])

  const preview = capsule
    ? capsule.compressed.length > 900
      ? `${capsule.compressed.slice(0, 900)}...`
      : capsule.compressed
    : ''

  return createPortal(
    <AnimatePresence>
      {capsule && (
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
          <motion.button
            type="button"
            aria-label="Close import dialog"
            onClick={onCancel}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              border: 'none',
              cursor: 'default',
            }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'relative',
              zIndex: 10,
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'linear-gradient(180deg, rgb(18, 18, 18), rgb(12, 12, 12))',
              border: '1px solid rgba(196, 30, 58, 0.2)',
              borderRadius: '14px',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(196, 30, 58, 0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 22px 14px',
                borderBottom: '1px solid rgba(112, 112, 112, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileUp size={15} style={{ color: 'var(--blood-ruby)' }} />
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
                  Import Capsule
                </span>
              </div>
              <button
                onClick={onCancel}
                aria-label="Cancel import"
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

            <div style={{ padding: '18px 22px' }}>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(112, 112, 112, 0.08)',
                  marginBottom: '18px',
                }}
              >
                <div
                  className="font-mono"
                  style={{ fontSize: '12px', color: 'var(--silver-white)', marginBottom: '10px', wordBreak: 'break-all' }}
                >
                  {capsule.fileName}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '12px',
                  }}
                >
                  <PreviewStat label="Format" value={formatImportFormat(capsule.format)} />
                  <PreviewStat
                    label="Stats"
                    value={capsule.hasTrustedStats ? 'Trusted' : 'Estimated'}
                    ruby={capsule.hasTrustedStats}
                  />
                  <PreviewStat label="Compressed" value={`${formatNum(capsule.result.compressedChars)} chars`} ruby />
                  <PreviewStat label="Tokens" value={`~${formatNum(capsule.result.estimatedTokensAfter)}`} />
                  {capsule.hasTrustedStats && (
                    <PreviewStat label="Reduction" value={`${capsule.result.reductionPercent}%`} ruby />
                  )}
                </div>
              </div>

              {capsule.warnings.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gap: '8px',
                    marginBottom: '18px',
                  }}
                >
                  {capsule.warnings.map((warning) => (
                    <div
                      key={warning}
                      className="font-mono"
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(196, 30, 58, 0.08)',
                        border: '1px solid rgba(196, 30, 58, 0.18)',
                        color: 'var(--obsidian-silver)',
                        fontSize: '10px',
                        lineHeight: 1.5,
                      }}
                    >
                      <AlertTriangle size={13} style={{ color: 'var(--blood-ruby)', flexShrink: 0, marginTop: '1px' }} />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

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
                  Capsule Preview
                </div>
                <pre
                  className="font-mono"
                  style={{
                    maxHeight: '180px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(112, 112, 112, 0.1)',
                    color: 'var(--obsidian-silver)',
                    fontSize: '11px',
                    lineHeight: 1.6,
                  }}
                >
                  {preview}
                </pre>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={onCancel}
                  className="font-orbitron"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                  onClick={onRestore}
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
                    background: 'var(--blood-ruby)',
                    border: 'none',
                    color: '#050505',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <RotateCcw size={13} />
                  Restore Capsule
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export function ImportCapsuleButton() {
  const inputRef = useRef<HTMLInputElement>(null)
  const restoreImportedCapsule = useCompressionStore((state) => state.restoreImportedCapsule)
  const [capsule, setCapsule] = useState<ImportedCapsule | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isReading, setIsReading] = useState(false)

  const openFilePicker = () => {
    setError(null)
    inputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    setError(null)
    setIsReading(true)

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = parseImportedCapsule(file.name, String(reader.result ?? ''))
        setCapsule(parsed)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not import this capsule.')
      } finally {
        setIsReading(false)
      }
    }
    reader.onerror = () => {
      setError('Could not read this capsule file.')
      setIsReading(false)
    }
    reader.readAsText(file)
  }

  const handleRestore = () => {
    if (!capsule) return
    restoreImportedCapsule(capsule.fileName, capsule.result)
    setCapsule(null)
    setError(null)
  }

  return (
    <div
      className="flex items-center justify-between gap-3 flex-wrap"
      style={{ marginBottom: '18px', padding: '0 4px' }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMPORT_TYPES}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={openFilePicker}
        disabled={isReading}
        className="font-orbitron"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderRadius: '10px',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          background: 'linear-gradient(135deg, rgba(17,17,17,0.9), rgba(10,10,10,0.95))',
          border: '1px solid rgba(196, 30, 58, 0.24)',
          color: 'var(--silver-white)',
          cursor: isReading ? 'not-allowed' : 'pointer',
          opacity: isReading ? 0.6 : 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <FileUp size={14} style={{ color: 'var(--blood-ruby)' }} />
        {isReading ? 'Reading...' : 'Import Capsule'}
      </button>

      <div
        className="font-mono"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: error ? 'var(--blood-ruby)' : 'var(--obsidian-silver)',
          minHeight: '18px',
        }}
      >
        {error ? (
          <>
            <AlertTriangle size={12} />
            <span>{error}</span>
          </>
        ) : (
          <>
            <ShieldCheck size={12} style={{ color: 'var(--blood-ruby)', opacity: 0.8 }} />
            <span>.md .txt .json</span>
          </>
        )}
      </div>

      <ImportPreviewModal
        capsule={capsule}
        onCancel={() => setCapsule(null)}
        onRestore={handleRestore}
      />
    </div>
  )
}
