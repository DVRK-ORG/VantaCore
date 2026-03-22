import { useState } from 'react'
import { useCompressionStore } from '../stores/compressionStore'
import { Singularity } from '../engine/singularity'

const engine = new Singularity()

export function CompressButton() {
  const { inputText, isCompressing, setCompressing, setResult, addHistory, inputFileName } = useCompressionStore()
  const [hovered, setHovered] = useState(false)

  const isDisabled = !inputText.trim() || isCompressing

  const handleCompress = async () => {
    if (isDisabled) return
    setCompressing(true)
    await new Promise(r => setTimeout(r, 300))
    const result = engine.process(inputText)
    setResult(result)
    addHistory({
      fileName: inputFileName || 'Pasted text',
      originalChars: result.originalChars,
      compressedChars: result.compressedChars,
      reductionPercent: result.reductionPercent,
    })
  }

  return (
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
      {/* Flood fill */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'var(--blood-ruby)',
        transform: hovered && !isDisabled ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'center',
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 0,
      }} />

      {/* 8 corners */}
      {!isDisabled && (
        <>
          {/* Top-left */}
          <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: hovered ? '100%' : '20px', height: '2px', top: 0, left: 0 }} />
          <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: '2px', height: hovered ? '100%' : '20px', top: 0, left: 0 }} />
          {/* Top-right */}
          <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: hovered ? '100%' : '20px', height: '2px', top: 0, right: 0 }} />
          <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: '2px', height: hovered ? '100%' : '20px', top: 0, right: 0 }} />
          {/* Bottom-right */}
          <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: hovered ? '100%' : '20px', height: '2px', bottom: 0, right: 0 }} />
          <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: '2px', height: hovered ? '100%' : '20px', bottom: 0, right: 0 }} />
          {/* Bottom-left */}
          <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: hovered ? '100%' : '20px', height: '2px', bottom: 0, left: 0 }} />
          <div style={{ position: 'absolute', background: 'var(--blood-ruby)', boxShadow: '0 0 15px rgba(196,30,58,0.5), 0 0 30px rgba(196,30,58,0.3), 0 0 50px rgba(196,30,58,0.2)', transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1, width: '2px', height: hovered ? '100%' : '20px', bottom: 0, left: 0 }} />
        </>
      )}

      {/* Text */}
      <span style={{ position: 'relative', zIndex: 2 }}>
        {isCompressing ? '⚡ PROCESSING... ⚡' : '⚡ UNLEASH THE SINGULARITY ⚡'}
      </span>
    </button>
  )
}
