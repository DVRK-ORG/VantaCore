import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Braces, Boxes, Code2, Repeat2 } from 'lucide-react'

const metrics = [
  { label: 'Input Tokens', value: '1,607,728', detail: 'to 61,109', segments: [1, 1, 1, 1, 1] },
  { label: 'Net Change Removed', value: '-401,568', detail: '~15,278 remain', segments: [1, 1, 1, 1, 1] },
  { label: 'Characters', value: '96.2%', detail: 'reduction ratio', segments: [1, 1, 1, 1, 1] },
  { label: 'Dehydrated Code', value: '398', detail: 'fenced blocks balanced', segments: [1, 1, 1, 1, 0] },
]

const proofSignals = [
  { icon: Boxes, title: 'Clusters', text: 'Smart blocks curate content chunks based instead of a flat transcript.' },
  { icon: Repeat2, title: 'LLM Dictionary', text: 'Catalogues, correlates, identifies, and link-drops repeat near-results.' },
  { icon: Code2, title: 'Code Protection', text: 'Fenced code survives the compression pass with balanced output fences.' },
  { icon: Braces, title: 'LLM Continuity', text: 'Final state, open loops, decisions, and do-not-repeat signals stay visible.' },
]

export function BenchmarkProof() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <section ref={ref} style={{ padding: '64px 0 96px 0', background: 'rgba(10,10,10,0.45)' }}>
      <div className="container-main">
        {/* Stitch eyebrow + section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-10"
        >
          <div className="eyebrow-with-line mb-5">
            <span>Verified Telemetry</span>
          </div>
          <h2 className="font-orbitron font-black uppercase tracking-[3px]" style={{ fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
            Battlefield <span className="text-blood-ruby">Proof</span>
          </h2>
          <p className="font-crimson text-obsidian-silver max-w-[700px] leading-[1.7] mt-3" style={{ fontSize: 'clamp(15px, 1.6vw, 17px)' }}>
            Expect the battle-tested benchmark-compact results from multi-session AI exports into LLM-ready capsule directly in your next session.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)', gap: '28px', alignItems: 'start' }} className="proof-grid">
          {/* HUD-framed terminal image */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="terminal-frame"
          >
            <img
              src="/Preview.png"
              alt="VantaCore benchmark showing 96.2 percent reduction and Memory Capsule output"
              className="terminal-screen"
            />
            <span className="corner-bl" />
            <span className="corner-br" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.18 }}
          >
            {/* Stat tiles 2x2 with segmented progress bars — Stitch improved labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="top-accent-strip"
                  style={{
                    padding: '18px 20px 20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(17,17,17,0.94), rgba(10,10,10,0.98))',
                    border: '1px solid rgba(196,30,58,0.2)',
                    boxShadow: 'inset 0 0 20px rgba(196,30,58,0.04)',
                    paddingTop: '22px',
                  }}
                >
                  <div className="font-mono text-[9px] tracking-[2px] uppercase text-muted-steel mb-2">{metric.label}</div>
                  <div className="font-orbitron font-black text-blood-ruby" style={{ fontSize: 'clamp(20px, 2.2vw, 28px)', textShadow: '0 0 12px rgba(196,30,58,0.4)' }}>{metric.value}</div>
                  <div className="font-mono text-[10px] text-obsidian-silver mt-1">{metric.detail}</div>
                  <div className="segmented-progress">
                    {metric.segments.map((s, idx) => (
                      <span key={idx} className={s ? 'filled' : ''} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Stitch upgrade: Enhanced proof signals with Clusters + LLM Dictionary */}
            <div className="flex flex-col gap-3">
              {proofSignals.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.06 }}
                  className="flex items-start gap-3"
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(112,112,112,0.1)',
                    background: 'rgba(255,255,255,0.015)',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(196,30,58,0.3)'
                    e.currentTarget.style.background = 'rgba(196,30,58,0.03)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(112,112,112,0.1)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.015)'
                  }}
                >
                  <div className="icon-container-bordered">
                    <item.icon size={16} className="text-blood-ruby" />
                  </div>
                  <div>
                    <div className="font-orbitron text-[11px] font-bold tracking-[2px] uppercase text-silver-white">{item.title}</div>
                    <div className="font-crimson text-[14px] text-muted-steel leading-[1.5]">{item.text}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
