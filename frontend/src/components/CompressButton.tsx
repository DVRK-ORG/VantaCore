import { useEffect, useState } from 'react'
import { FREE_DAILY_COMPRESSION_LIMIT, useCompressionStore } from '../stores/compressionStore'
import { Singularity } from '../engine/singularity'

const engine = new Singularity()

export function CompressButton() {
  const {
    inputText,
    isCompressing,
    setCompressing,
    setResult,
    addHistory,
    inputFileName,
    dailyCompressionsRemaining,
    canCompressToday,
    refreshDailyUsage,
    claimDailyCompression,
  } = useCompressionStore()
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    refreshDailyUsage()
  }, [refreshDailyUsage])

  const isLimitReached = !canCompressToday
  const isDisabled = !inputText.trim() || isCompressing || isLimitReached

  const handleCompress = async () => {
    if (isDisabled) return
    if (!claimDailyCompression()) return

    setCompressing(true)
    await new Promise(r => setTimeout(r, 300))
    const result = engine.process(inputText)
    setResult(result)
    addHistory({
      fileName: inputFileName || 'Pasted text',
      compressed: result.compressed,
      originalChars: result.originalChars,
      compressedChars: result.compressedChars,
      reductionPercent: result.reductionPercent,
      processingTimeMs: result.processingTimeMs,
      estimatedTokensBefore: result.estimatedTokensBefore,
      estimatedTokensAfter: result.estimatedTokensAfter,
      tokenEstimationMethod: result.tokenEstimationMethod,
      codeBlocksProtected: result.codeBlocksProtected,
      repeatedBlocksFolded: result.repeatedBlocksFolded,
      dictionaryReferencesCreated: result.dictionaryReferencesCreated,
      clustersDetected: result.clustersDetected,
      codeBlocksIntegrityOk: result.codeBlocksIntegrityOk,
    })
  }

  return (
    <>
      <div
        className="font-mono text-[12px] text-obsidian-silver mb-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ padding: '0 4px' }}
      >
        <span>
          Free demo: {dailyCompressionsRemaining} of {FREE_DAILY_COMPRESSION_LIMIT} local compressions left today
        </span>
        <span>100% client-side. No login.</span>
      </div>
      <button
        onClick={handleCompress}
        disabled={isDisabled}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative block w-full cursor-pointer font-orbitron font-bold uppercase tracking-[4px] overflow-hidden mb-10"
        style={{
          padding: '22px 40px',
          background: isDisabled ? 'rgba(255,255,255,0.05)' : 'transparent',
          border: 'none',
          fontSize: 'clamp(12px, 1.5vw, 15px)',
          color: isDisabled ? 'rgba(112,112,112,0.3)' : (hovered ? '#050505' : 'var(--muted-steel)'),
          transition: 'color 0.5s, background 0.5s',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          boxShadow: hovered && !isDisabled ? '0 0 40px rgba(196,30,58,0.4), 0 0 80px rgba(196,30,58,0.15)' : 'none',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          background: 'var(--blood-ruby)',
          transform: hovered && !isDisabled ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'center',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 0,
        }} />

        {!isDisabled && (
          <>
            <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: hovered ? '100%' : '20px', height: '2px', top: 0, left: 0 }} />
            <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: '2px', height: hovered ? '100%' : '20px', top: 0, left: 0 }} />
            <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: hovered ? '100%' : '20px', height: '2px', top: 0, right: 0 }} />
            <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: '2px', height: hovered ? '100%' : '20px', top: 0, right: 0 }} />
            <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: hovered ? '100%' : '20px', height: '2px', bottom: 0, right: 0 }} />
            <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: '2px', height: hovered ? '100%' : '20px', bottom: 0, right: 0 }} />
            <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: hovered ? '100%' : '20px', height: '2px', bottom: 0, left: 0 }} />
            <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: '2px', height: hovered ? '100%' : '20px', bottom: 0, left: 0 }} />
          </>
        )}

        <span style={{ position: 'relative', zIndex: 2 }}>
          {isCompressing ? 'PROCESSING...' : isLimitReached ? 'DAILY FREE LIMIT REACHED' : 'UNLEASH THE SINGULARITY'}
        </span>
      </button>
    </>
  )
}
