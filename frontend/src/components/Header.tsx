import { useEffect, useState } from 'react'
import { Github, Zap } from 'lucide-react'

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className="sticky top-0 z-[1000] backdrop-blur-[24px]"
      style={{
        background: 'rgba(5, 5, 5, 0.85)',
        borderBottom: `1px solid ${scrolled ? 'rgba(196, 30, 58, 0.15)' : 'rgba(112, 112, 112, 0.1)'}`,
        padding: '0 24px',
        animation: 'headerSlide 0.6s ease-out',
        transition: 'border-color 0.3s',
      }}
    >
      <div className="flex items-center justify-between h-[72px] max-w-full">
        {/* Left */}
        <div className="flex items-center gap-[14px]">
          <div
            className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0 font-orbitron font-black text-[20px] text-white"
            style={{
              background: 'linear-gradient(135deg, var(--blood-ruby), var(--ruby-deep))',
              boxShadow: '0 0 20px rgba(196,30,58,0.4), 0 0 40px rgba(196,30,58,0.15)',
              animation: 'ruby-pulse 3s ease-in-out infinite',
            }}
          >
            V
          </div>
          <div className="flex flex-col">
            <div className="font-orbitron font-bold text-[18px] tracking-[2px] leading-[1.2]">
              Vanta<span className="text-blood-ruby">Core</span>
            </div>
            <div className="font-orbitron text-[9px] font-medium text-muted-steel tracking-[4px] uppercase leading-[1.2]">
              THE SINGULARITY V4.0
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-obsidian-silver tracking-[0.5px]">
            <Zap size={14} className="text-blood-ruby" />
            <span>100% Client-Side</span>
          </div>
          <a
            href="https://github.com/DVRK-ORG/VantaCore"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] font-orbitron text-[11px] font-semibold tracking-[1px] uppercase text-silver-white cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgba(17,17,17,0.9), rgba(10,10,10,0.95))',
              border: '1px solid rgba(112,112,112,0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(196,30,58,0.4)'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(196,30,58,0.2), 0 0 40px rgba(196,30,58,0.08)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(112,112,112,0.2)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <Github size={16} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  )
}
