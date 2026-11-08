import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Map, Layers, Repeat2, ShieldCheck, ClipboardCheck } from 'lucide-react'

const steps = [
  {
    icon: Map,
    title: 'Session Map',
    desc: 'Identifies major topic shifts and builds timeline markers across merged AI sessions.',
    detail: 'Detect topics, project shifts, and state transitions',
  },
  {
    icon: Layers,
    title: 'Memory Capsule Header',
    desc: 'Extracts final state, open loops, decisions, do-not-repeat rules, and key artifacts.',
    detail: 'Isolate decisions, add-ons, and artifacts',
  },
  {
    icon: Repeat2,
    title: 'Reference Dictionary',
    desc: 'Folds repeated commands, prompts, validation checks, and code blocks into compact references.',
    detail: 'Minimizes redundancies and data loss',
  },
  {
    icon: ShieldCheck,
    title: 'Code Block Protection',
    desc: 'Protects fenced code and technical identifiers so capsules stay useful for developer workflows.',
    detail: 'Preserves syntax trees and identifiers',
  },
  {
    icon: ClipboardCheck,
    title: 'Compressed Detail Stream',
    desc: 'Preserves the operational trail while stripping filler, duplicate loops, and low-value chatter.',
    detail: 'Yield the operational trail with max fidelity',
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <section ref={ref} style={{ padding: '96px 0' }}>
      <div className="container-main">
        {/* Stitch eyebrow with red line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="eyebrow-with-line mb-10"
        >
          <span>Memory Capsule Design</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <h2 className="font-orbitron font-black uppercase tracking-[3px] mb-3" style={{ fontSize: 'clamp(22px, 3.2vw, 34px)' }}>
            How <span className="text-blood-ruby">The Singularity</span> Works
          </h2>
          <p className="font-crimson text-muted-steel max-w-[660px] mx-auto leading-[1.6]" style={{ fontSize: 'clamp(15px, 1.6vw, 18px)' }}>
            VantaCore compiles messy context into a structured memory capsule that a fresh LLM can actually continue from.
          </p>
        </motion.div>

        {/* Stitch upgrade: Rich step cards with number badges, details, and visual sections */}
        <div className="how-steps-grid" style={{ marginTop: '48px' }}>
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.05 + i * 0.08, ease: [0.4, 0, 0.2, 1] }}
              className="how-step-card top-accent-strip"
              style={{
                padding: '24px 22px 22px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(17,17,17,0.94), rgba(10,10,10,0.98))',
                border: '1px solid rgba(196,30,58,0.18)',
                boxShadow: 'inset 0 0 20px rgba(196,30,58,0.04)',
                transition: 'border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default',
                paddingTop: '26px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(196,30,58,0.55)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(196,30,58,0.2), inset 0 0 24px rgba(196,30,58,0.1)'
                e.currentTarget.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(196,30,58,0.18)'
                e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(196,30,58,0.04)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Step number + icon row */}
              <div className="flex items-center gap-3 mb-1">
                <span className="step-badge">{i + 1}</span>
                <div className="icon-container-bordered">
                  <step.icon size={16} className="text-blood-ruby" />
                </div>
              </div>

              {/* Title */}
              <div className="font-orbitron text-[12px] font-bold tracking-[1.8px] uppercase text-silver-white">
                {step.title}
              </div>

              {/* Description */}
              <div className="font-crimson text-[14px] text-muted-steel leading-[1.55]">{step.desc}</div>

              {/* Stitch upgrade: Visual thumbnail placeholder area */}
              <div
                style={{
                  marginTop: 'auto',
                  padding: '14px 12px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, rgba(196,30,58,0.04), rgba(5,5,5,0.9))',
                  border: '1px solid rgba(196,30,58,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <step.icon size={14} className="text-blood-ruby" style={{ opacity: 0.6, flexShrink: 0 }} />
                <span className="font-mono text-[10px] text-obsidian-silver leading-[1.4]" style={{ letterSpacing: '0.3px' }}>
                  {step.detail}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
