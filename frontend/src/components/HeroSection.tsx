import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowDown, Shield, Zap } from 'lucide-react'

const heroSignals = [
  'AI chat continuation',
  'RAG / KB prep',
  'Dev logs',
  'Research notes',
  'MCP workflows',
  'Token cost control',
]

export function HeroSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: 40 },
    animate: isInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.8, delay, ease: [0.4, 0, 0.2, 1] as const },
  })

  return (
    <section ref={ref} className="relative overflow-hidden" style={{ padding: '96px 0 80px', textAlign: 'center' }}>
      <div className="hero-grid-bg" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(196,30,58,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />

      <div className="container-text relative z-[1] flex flex-col items-center gap-6">
        <motion.div
          {...reveal(0)}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-orbitron text-[10px] font-semibold text-blood-ruby tracking-[3px] uppercase"
          style={{ border: '1px solid rgba(196,30,58,0.3)', background: 'rgba(196,30,58,0.05)', animation: 'breathe 3s ease-in-out infinite' }}
        >
          <Zap size={14} />
          FREE CORE / PAID POWER LATER
        </motion.div>

        <motion.img
          {...reveal(0.1)}
          src="/logo-3d.png"
          alt="VantaCore Logo"
          className="w-24 h-24 sm:w-28 sm:h-28"
          style={{
            animation: 'float 6s ease-in-out infinite',
            filter: 'drop-shadow(0 0 30px rgba(196,30,58,0.4)) drop-shadow(0 0 60px rgba(196,30,58,0.15))',
          }}
        />

        <motion.h1
          {...reveal(0.15)}
          className="font-orbitron font-black uppercase tracking-[3px] leading-[1.08]"
          style={{ fontSize: 'clamp(2.1rem, 6vw, 4.6rem)', maxWidth: '980px' }}
        >
          Compress massive AI sessions into portable memory capsules.
        </motion.h1>

        <motion.p
          {...reveal(0.25)}
          className="font-crimson max-w-[760px] leading-[1.55]"
          style={{ fontSize: 'clamp(17px, 2.1vw, 23px)', color: 'rgba(232,232,232,0.9)' }}
        >
          VantaCore turns long chats, dev logs, research notes, and knowledge-base material into LLM-ready memory capsules. 100% client-side.
        </motion.p>

        <motion.div {...reveal(0.33)} className="flex items-center justify-center gap-2 flex-wrap max-w-[860px]">
          {heroSignals.map((signal) => (
            <span
              key={signal}
              className="font-mono text-[11px] text-obsidian-silver"
              style={{
                padding: '8px 12px',
                border: '1px solid rgba(112,112,112,0.18)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.025)',
              }}
            >
              {signal}
            </span>
          ))}
        </motion.div>

        <motion.div {...reveal(0.42)} className="flex items-center justify-center flex-wrap mt-2">
          <div className="flex flex-col items-center px-8 py-4">
            <div className="font-orbitron font-bold text-blood-ruby leading-[1.2]" style={{ fontSize: 'clamp(24px, 3.4vw, 36px)', textShadow: '0 0 20px rgba(196,30,58,0.5), 0 0 40px rgba(196,30,58,0.2)', animation: 'ruby-pulse-text 3s ease-in-out infinite' }}>
              96.2%
            </div>
            <div className="font-mono text-[11px] text-muted-steel tracking-[1px] uppercase mt-1">Battlefield Reduction</div>
          </div>
          <div className="w-px h-12 hidden sm:block" style={{ background: 'rgba(112,112,112,0.2)' }} />
          <div className="flex flex-col items-center px-8 py-4">
            <div className="font-orbitron font-bold text-silver-white leading-[1.2]" style={{ fontSize: 'clamp(24px, 3.4vw, 36px)' }}>401k</div>
            <div className="font-mono text-[11px] text-muted-steel tracking-[1px] uppercase mt-1">tokens to 15k</div>
          </div>
          <div className="w-px h-12 hidden sm:block" style={{ background: 'rgba(112,112,112,0.2)' }} />
          <div className="flex flex-col items-center px-8 py-4">
            <div className="font-orbitron font-bold text-silver-white leading-[1.2]" style={{ fontSize: 'clamp(24px, 3.4vw, 36px)' }}>398</div>
            <div className="font-mono text-[11px] text-muted-steel tracking-[1px] uppercase mt-1">code blocks protected</div>
          </div>
        </motion.div>

        <motion.div {...reveal(0.5)} className="flex items-center gap-2 font-mono text-[11px] text-muted-steel">
          <Shield size={14} className="text-obsidian-silver" />
          Your input stays in your browser. Free demo processing is local.
        </motion.div>

        <motion.a
          {...reveal(0.6)}
          href="#tool"
          className="flex flex-col items-center gap-2 mt-4 text-obsidian-silver hover:text-blood-ruby transition-colors cursor-pointer no-underline"
        >
          <span className="font-orbitron text-[11px] tracking-[3px] uppercase">Try the Free Demo</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ArrowDown size={24} />
          </motion.div>
        </motion.a>
      </div>
    </section>
  )
}
