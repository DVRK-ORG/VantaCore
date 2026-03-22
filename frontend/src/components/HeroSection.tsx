import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowDown, Shield, Zap } from 'lucide-react'

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
      {/* Grid background */}
      <div className="hero-grid-bg" />
      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(196,30,58,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }}
      />

      <div className="container-text relative z-[1] flex flex-col items-center gap-6">
        {/* Badge */}
        <motion.div
          {...reveal(0)}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-orbitron text-[10px] font-semibold text-blood-ruby tracking-[3px] uppercase"
          style={{ border: '1px solid rgba(196,30,58,0.3)', background: 'rgba(196,30,58,0.05)', animation: 'breathe 3s ease-in-out infinite' }}
        >
          <Zap size={14} />
          OPEN SOURCE • FREE FOREVER
        </motion.div>

        {/* Logo Icon */}
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

        {/* Title */}
        <motion.h1
          {...reveal(0.15)}
          className="font-orbitron font-black uppercase tracking-[6px] leading-[1.1]"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
        >
          VANTA<span className="text-blood-ruby">CORE</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.div
          {...reveal(0.2)}
          className="font-orbitron font-medium text-obsidian-silver uppercase tracking-[8px]"
          style={{ fontSize: 'clamp(10px, 1.5vw, 14px)' }}
        >
          THE SINGULARITY ENGINE
        </motion.div>

        {/* Tagline */}
        <motion.p
          {...reveal(0.3)}
          className="font-crimson italic max-w-[650px] leading-[1.6]"
          style={{ fontSize: 'clamp(16px, 2.2vw, 22px)', color: 'rgba(232,232,232,0.9)' }}
        >
          "In the era of infinite context, noise is the enemy of reason."
        </motion.p>

        {/* Sub-tagline */}
        <motion.p
          {...reveal(0.35)}
          className="font-crimson font-semibold text-blood-ruby"
          style={{ fontSize: 'clamp(15px, 1.8vw, 19px)' }}
        >
          We are the filter that leaves only the truth.
        </motion.p>

        {/* Stats */}
        <motion.div {...reveal(0.4)} className="flex items-center justify-center flex-wrap mt-2">
          <div className="flex flex-col items-center px-8 py-4">
            <div className="font-orbitron font-bold text-blood-ruby leading-[1.2]" style={{ fontSize: 'clamp(22px, 3vw, 32px)', textShadow: '0 0 20px rgba(196,30,58,0.5), 0 0 40px rgba(196,30,58,0.2)', animation: 'ruby-pulse-text 3s ease-in-out infinite' }}>
              98.87%
            </div>
            <div className="font-mono text-[11px] text-muted-steel tracking-[1px] uppercase mt-1">Max Reduction</div>
          </div>
          <div className="w-px h-12 hidden sm:block" style={{ background: 'rgba(112,112,112,0.2)' }} />
          <div className="flex flex-col items-center px-8 py-4">
            <div className="font-orbitron font-bold text-silver-white leading-[1.2]" style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}>0.19s</div>
            <div className="font-mono text-[11px] text-muted-steel tracking-[1px] uppercase mt-1">Processing Time</div>
          </div>
          <div className="w-px h-12 hidden sm:block" style={{ background: 'rgba(112,112,112,0.2)' }} />
          <div className="flex flex-col items-center px-8 py-4">
            <div className="font-orbitron font-bold text-silver-white leading-[1.2]" style={{ fontSize: 'clamp(22px, 3vw, 32px)' }}>950KB</div>
            <div className="font-mono text-[11px] text-muted-steel tracking-[1px] uppercase mt-1">→ 10.8KB</div>
          </div>
        </motion.div>

        {/* Privacy */}
        <motion.div {...reveal(0.5)} className="flex items-center gap-2 font-mono text-[11px] text-muted-steel">
          <Shield size={14} className="text-obsidian-silver" />
          100% client-side • Your data never leaves your browser
        </motion.div>

        {/* Scroll CTA */}
        <motion.a
          {...reveal(0.6)}
          href="#tool"
          className="flex flex-col items-center gap-2 mt-4 text-obsidian-silver hover:text-blood-ruby transition-colors cursor-pointer no-underline"
        >
          <span className="font-orbitron text-[11px] tracking-[3px] uppercase">Start Compressing</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ArrowDown size={24} />
          </motion.div>
        </motion.a>
      </div>
    </section>
  )
}
