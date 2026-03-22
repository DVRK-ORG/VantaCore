import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Copy, Check } from 'lucide-react'
import { useCompressionStore } from '../stores/compressionStore'

export function OutputSection() {
  const { result, hasResult, inputFileName } = useCompressionStore()
  const [copied, setCopied] = useState(false)

  if (!hasResult || !result) return null

  const baseName = inputFileName ? inputFileName.replace(/\.[^/.]+$/, '') : 'compressed'

  const downloadAs = (ext: string) => {
    const content = ext === '.json'
      ? JSON.stringify({ compressed: result.compressed, stats: { originalChars: result.originalChars, compressedChars: result.compressedChars, reductionPercent: result.reductionPercent } }, null, 2)
      : ext === '.md'
      ? `# VantaCore Compressed Output\n\n${result.compressed}`
      : result.compressed

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${baseName}_SHRUNK${ext}`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(result.compressed) } catch {
      const t = document.createElement('textarea'); t.value = result.compressed; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t)
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const rubyBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px',
    fontFamily: "'Orbitron', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase',
    border: 'none', cursor: 'pointer', background: 'var(--blood-ruby)', color: '#050505',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }
  const glassBtnStyle: React.CSSProperties = {
    ...rubyBtnStyle,
    background: 'linear-gradient(135deg, rgba(17,17,17,0.9), rgba(10,10,10,0.95))',
    border: '1px solid rgba(112,112,112,0.2)', color: 'var(--silver-white)',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-panel"
      style={{ padding: '32px' }}
    >
      <div className="font-orbitron text-[14px] font-bold tracking-[3px] uppercase text-silver-white mb-5">
        Compressed Output
      </div>
      <textarea
        readOnly
        value={result.compressed}
        style={{
          width: '100%', minHeight: '200px',
          background: 'var(--vanta-dark)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px',
          fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: 'var(--obsidian-silver)',
          resize: 'vertical', outline: 'none', marginBottom: '20px', lineHeight: '1.7',
        }}
      />
      <div className="flex gap-4 flex-wrap">
        {['.txt', '.md', '.pdf', '.json'].map(ext => (
          <button
            key={ext}
            style={rubyBtnStyle}
            onClick={() => downloadAs(ext)}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 25px rgba(196,30,58,0.5), 0 0 50px rgba(196,30,58,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
          >
            <Download size={14} />
            {ext.toUpperCase()}
          </button>
        ))}
        <button
          style={glassBtnStyle}
          onClick={handleCopy}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,30,58,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(196,30,58,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(112,112,112,0.2)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
    </motion.div>
  )
}
