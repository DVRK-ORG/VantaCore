import { useCallback, useState, useRef } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { useCompressionStore } from '../stores/compressionStore'

const ACCEPTED_TYPES = ['.txt', '.md', '.json', '.csv', '.log']

export function DropZone() {
  const [isHovering, setIsHovering] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const { inputFileName, setInputText, setInputFileName } = useCompressionStore()

  const handleFile = useCallback((file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_TYPES.includes(ext)) { alert(`Unsupported file type.`); return }
    const reader = new FileReader()
    reader.onload = (e) => { setInputText(e.target?.result as string); setInputFileName(file.name) }
    reader.readAsText(file)
  }, [setInputText, setInputFileName])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setIsHovering(false); setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }, [isDragging])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    const rect = dropRef.current?.getBoundingClientRect()
    if (rect && (e.clientX <= rect.left || e.clientX >= rect.right || e.clientY <= rect.top || e.clientY >= rect.bottom)) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setIsDragging(false); setIsHovering(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleClick = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = ACCEPTED_TYPES.join(',')
    input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFile(f) }
    input.click()
  }, [handleFile])

  const clearFile = useCallback(() => { setInputText(''); setInputFileName('') }, [setInputText, setInputFileName])

  if (inputFileName) {
    return (
      <div className="glass-panel-ruby p-5 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(196,30,58,0.2)' }}>
            <FileText size={20} className="text-blood-ruby" />
          </div>
          <div>
            <p className="text-silver-white text-sm font-orbitron font-semibold tracking-[1px]">{inputFileName}</p>
            <p className="text-muted-steel text-xs font-crimson">File loaded • Ready to compress</p>
          </div>
        </div>
        <button onClick={clearFile} className="p-2 rounded-lg text-muted-steel hover:text-blood-ruby transition-colors cursor-pointer" style={{ background: 'transparent', border: 'none' }}>
          <X size={18} />
        </button>
      </div>
    )
  }

  const stateClass = isDragging ? 'dragging' : isHovering ? 'hovering' : ''

  return (
    <div className="relative mb-8">
      <div
        ref={dropRef}
        className={`dropzone ${stateClass}`}
        onMouseEnter={() => { if (!isDragging) setIsHovering(true) }}
        onMouseLeave={() => setIsHovering(false)}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          position: 'relative',
          minHeight: '450px',
          border: isDragging ? '2px solid rgba(196,30,58,0.8)' : '2px dashed rgba(112,112,112,0.3)',
          borderRadius: '16px',
          background: isDragging ? 'rgba(40, 15, 15, 0.9)' : isHovering ? 'rgba(40, 20, 20, 0.8)' : 'linear-gradient(135deg, rgba(17,17,17,0.7), rgba(10,10,10,0.85))',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px',
          cursor: 'pointer', overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isDragging ? 'scale(1.02)' : isHovering ? 'translateY(-2px)' : 'none',
          boxShadow: isDragging
            ? '0 0 50px rgba(196,30,58,0.5), inset 0 0 60px rgba(196,30,58,0.2)'
            : isHovering
            ? '0 0 30px rgba(196,30,58,0.4), inset 0 0 40px rgba(196,30,58,0.15)'
            : 'none',
          borderColor: isHovering && !isDragging ? 'rgba(196,30,58,0.7)' : undefined,
        }}
      >
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '16px', pointerEvents: 'none',
          opacity: isDragging ? 1 : 0, transition: 'opacity 0.4s',
          backgroundImage: 'linear-gradient(rgba(196,30,58,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(196,30,58,0.25) 1px, transparent 1px)',
          backgroundSize: '30px 30px', animation: 'gridMove 20s linear infinite',
        }} />

        {/* Orbit scanners */}
        <div style={{
          position: 'absolute', width: '16px', height: '16px', border: '2px solid var(--blood-ruby)', borderRadius: '3px',
          pointerEvents: 'none', zIndex: 5,
          opacity: (isHovering || isDragging) ? 1 : 0,
          animation: (isHovering || isDragging) ? `orbitScan ${isDragging ? '3s' : '6s'} linear infinite, orbitGlow ${isDragging ? '1s' : '2s'} ease-in-out infinite` : 'none',
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
        <div style={{
          position: 'absolute', width: '12px', height: '12px', border: '1.5px solid rgba(196,30,58,0.6)', borderRadius: '2px',
          pointerEvents: 'none', zIndex: 5,
          opacity: isDragging ? 0.9 : isHovering ? 0.7 : 0,
          animation: (isHovering || isDragging) ? `orbitScan ${isDragging ? '3s' : '6s'} linear infinite reverse, orbitGlow ${isDragging ? '1.5s' : '2.5s'} ease-in-out infinite` : 'none',
          animationDelay: isDragging ? '-1.5s' : '-3s',
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />

        {/* Particles */}
        {[
          { cls: 'p1', top: '20px', left: '20px', anim: 'particleFloat1 2.5s ease-in-out infinite' },
          { cls: 'p2', top: '20px', right: '20px', anim: 'particleFloat2 3s ease-in-out infinite 0.5s' },
          { cls: 'p3', bottom: '20px', left: '20px', anim: 'particleFloat3 2.8s ease-in-out infinite 1s' },
          { cls: 'p4', bottom: '20px', right: '20px', anim: 'particleFloat4 3.2s ease-in-out infinite 1.5s' },
        ].map((p) => (
          <div key={p.cls} style={{
            position: 'absolute', width: '6px', height: '6px', borderRadius: '50%',
            background: 'radial-gradient(circle, var(--blood-ruby), transparent)',
            opacity: isDragging ? 1 : 0, pointerEvents: 'none', transition: 'opacity 0.4s',
            animation: p.anim, top: p.top, left: p.left, right: p.right, bottom: p.bottom,
          }} />
        ))}

        {/* Scanline */}
        {isDragging && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(196,30,58,0.15) 50%, transparent 100%)',
            animation: 'scanline 2s linear infinite',
          }} />
        )}

        {/* Shimmer border (hover only) */}
        {isHovering && !isDragging && (
          <div style={{
            position: 'absolute', inset: '-2px', borderRadius: '16px', padding: '2px', pointerEvents: 'none',
            background: 'linear-gradient(45deg, rgba(196,30,58,0.6), rgba(139,0,0,0.2), rgba(196,30,58,0.6), rgba(139,0,0,0.2))',
            backgroundSize: '200% 200%',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            animation: 'borderShimmer 2s linear infinite',
          }} />
        )}

        {/* Icon */}
        <Upload
          size={80}
          strokeWidth={1.2}
          style={{
            color: (isHovering || isDragging) ? 'var(--blood-ruby)' : 'var(--obsidian-silver)',
            animation: isDragging ? 'none' : 'float 3s ease-in-out infinite',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isDragging ? 'scale(1.2)' : 'none',
            filter: isDragging ? 'drop-shadow(0 0 15px rgba(196,30,58,0.8))' : isHovering ? 'drop-shadow(0 0 10px rgba(196,30,58,0.6))' : 'none',
            position: 'relative', zIndex: 2,
          }}
        />

        {/* Text */}
        <div className="font-orbitron text-[16px] font-semibold tracking-[2px] uppercase relative z-[2]" style={{ color: isDragging ? 'var(--blood-ruby)' : 'var(--silver-white)' }}>
          Drag and drop files here
        </div>
        <div className="font-crimson text-[15px] text-muted-steel relative z-[2]">
          Supports .txt, .md, .json, .csv, .log
        </div>
        <button
          className="font-orbitron text-[11px] font-semibold tracking-[2px] uppercase text-silver-white cursor-pointer relative z-[2]"
          onClick={(e) => { e.stopPropagation(); handleClick() }}
          style={{
            padding: '10px 28px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(17,17,17,0.9), rgba(10,10,10,0.95))',
            border: '1px solid rgba(112,112,112,0.25)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,30,58,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(196,30,58,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(112,112,112,0.25)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
        >
          Browse Files
        </button>
      </div>
    </div>
  )
}
