import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Map, Layers, Repeat2, ShieldCheck, ClipboardCheck } from 'lucide-react'

const steps = [
  {
    icon: Map, iconColor: 'var(--obsidian-silver)', bgColor: 'rgba(112,112,112,0.15)',
    borderColor: 'var(--obsidian-silver)',
    title: 'Session Map',
    desc: 'Detects major topics, project shifts, and timeline markers across merged AI sessions.',
  },
  {
    icon: Layers, iconColor: '#EAB308', bgColor: 'rgba(234,179,8,0.15)',
    borderColor: '#EAB308',
    title: 'Memory Capsule Header',
    desc: 'Extracts final state, open loops, decisions, do-not-repeat rules, and key artifacts.',
  },
  {
    icon: Repeat2, iconColor: '#F97316', bgColor: 'rgba(249,115,22,0.15)',
    borderColor: '#F97316',
    title: 'Reference Dictionary',
    desc: 'Folds repeated commands, prompts, validation checks, and code blocks into compact references.',
  },
  {
    icon: ShieldCheck, iconColor: 'var(--blood-ruby)', bgColor: 'rgba(196,30,58,0.15)',
    borderColor: 'var(--blood-ruby)',
    title: 'Code Block Protection',
    desc: 'Protects fenced code and technical identifiers so capsules stay useful for developer workflows.',
  },
  {
    icon: ClipboardCheck, iconColor: '#F87171', bgColor: 'rgba(248,113,113,0.15)',
    borderColor: '#F87171',
    title: 'Compressed Detail Stream',
    desc: 'Preserves the operational trail while stripping filler, duplicate loops, and low-value chatter.',
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <section ref={ref} style={{ padding: '96px 0' }}>
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-5 mb-16"
        >
          <div className="flex-1 h-px" style={{ background: 'rgba(112,112,112,0.15)' }} />
          <span className="font-orbitron text-[10px] font-semibold tracking-[4px] uppercase text-muted-steel whitespace-nowrap">
            MEMORY CAPSULE ENGINE
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(112,112,112,0.15)' }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <h2 className="font-orbitron font-bold tracking-[3px] uppercase mb-3" style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
            How <span className="text-blood-ruby">The Singularity</span> Works
          </h2>
          <p className="font-crimson text-muted-steel max-w-[660px] mx-auto leading-[1.6]" style={{ fontSize: 'clamp(15px, 1.6vw, 18px)' }}>
            VantaCore compiles messy context into structured memory that a fresh LLM can actually continue from.
          </p>
        </motion.div>

        <div className="flex flex-col gap-5 mt-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.05 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
              className="glass-panel flex items-start gap-5"
              style={{ padding: '28px 32px', borderLeft: `2px solid ${step.borderColor}`, borderRadius: '10px' }}
            >
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: step.bgColor, animation: 'iconBreath 3s ease-in-out infinite' }}
              >
                <step.icon size={18} style={{ color: step.iconColor }} />
              </div>
              <div className="flex-1">
                <div className="font-mono text-[10px] text-muted-steel tracking-[2px] mb-1 flex items-center gap-2">
                  STEP {i + 1} <span className="w-1 h-1 rounded-full bg-obsidian-silver inline-block" />
                </div>
                <div className="font-orbitron font-bold tracking-[2px] uppercase text-silver-white mb-2" style={{ fontSize: 'clamp(13px, 1.4vw, 16px)' }}>
                  {step.title}
                </div>
                <div className="font-crimson text-[15px] text-muted-steel leading-[1.6]">{step.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
