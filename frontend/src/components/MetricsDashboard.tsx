import { motion } from 'framer-motion'
import { Zap, Lock } from 'lucide-react'
import { useCompressionStore } from '../stores/compressionStore'

export function MetricsDashboard() {
  const { result, hasResult } = useCompressionStore()
  if (!hasResult || !result) return null

  const { originalChars, compressedChars, reductionPercent, processingTimeMs, estimatedTokensBefore, estimatedTokensAfter } = result

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel-ruby mb-8"
      style={{ padding: '40px' }}
    >
      {/* Before → After grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '32px', alignItems: 'center', marginBottom: '32px' }}>
        <div className="text-center">
          <div className="font-orbitron text-[10px] font-semibold tracking-[4px] uppercase text-muted-steel mb-3">Before</div>
          <div className="font-mono font-bold text-muted-steel leading-[1.2]" style={{ fontSize: 'clamp(22px, 3vw, 34px)' }}>
            {originalChars.toLocaleString()}
          </div>
          <div className="font-mono text-[13px] text-obsidian-silver mt-1">~{estimatedTokensBefore.toLocaleString()} tokens</div>
        </div>
        <div className="text-blood-ruby text-[28px]" style={{ animation: 'breathe 2s ease-in-out infinite' }}>→</div>
        <div className="text-center">
          <div className="font-orbitron text-[10px] font-semibold tracking-[4px] uppercase text-muted-steel mb-3">After</div>
          <div className="font-mono font-bold text-blood-ruby leading-[1.2]" style={{ fontSize: 'clamp(22px, 3vw, 34px)', textShadow: '0 0 15px rgba(196,30,58,0.4)' }}>
            {compressedChars.toLocaleString()}
          </div>
          <div className="font-mono text-[13px] mt-1" style={{ color: 'var(--blood-ruby)' }}>~{estimatedTokensAfter.toLocaleString()} tokens</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${reductionPercent}%` }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--ruby-deep), var(--blood-ruby))',
              borderRadius: '6px',
              boxShadow: '0 0 15px rgba(196,30,58,0.4)',
              animation: 'progressGlow 2s ease-in-out infinite',
            }}
          />
        </div>
        <div
          className="font-orbitron font-bold text-blood-ruby text-center mt-4"
          style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            textShadow: '0 0 20px rgba(196,30,58,0.5), 0 0 40px rgba(196,30,58,0.2)',
            animation: 'ruby-pulse-text 3s ease-in-out infinite',
          }}
        >
          {reductionPercent}%
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-center gap-8 flex-wrap">
        <div className="flex items-center gap-1.5 font-mono text-[12px] text-obsidian-silver">
          <Zap size={14} className="text-blood-ruby" />
          {processingTimeMs < 1 ? '<1ms' : `${processingTimeMs}ms`}
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[12px] text-obsidian-silver">
          <Lock size={14} className="text-obsidian-silver" />
          Protected: code blocks
        </div>
      </div>
    </motion.div>
  )
}
