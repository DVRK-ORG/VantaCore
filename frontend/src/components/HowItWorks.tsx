import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { CaseLower, Layers, Ban, Wrench, RefreshCcw } from 'lucide-react'

const steps = [
  {
    icon: CaseLower, iconColor: 'var(--obsidian-silver)', bgColor: 'rgba(112,112,112,0.15)',
    borderColor: 'var(--obsidian-silver)',
    title: 'Universal Lowercase',
    desc: 'Normalizes all text for consistent processing across the entire document.',
  },
  {
    icon: Layers, iconColor: '#EAB308', bgColor: 'rgba(234,179,8,0.15)',
    borderColor: '#EAB308',
    title: 'Nuclear Metadata Purge',
    desc: 'Eradicates UI elements, model thinking blocks, system warnings, UUIDs, and URLs.',
  },
  {
    icon: Ban, iconColor: '#F97316', bgColor: 'rgba(249,115,22,0.15)',
    borderColor: '#F97316',
    title: 'Punctuation Dissolving',
    desc: 'Strips formatting noise while preserving technical identifiers and code blocks.',
  },
  {
    icon: Wrench, iconColor: 'var(--blood-ruby)', bgColor: 'rgba(196,30,58,0.15)',
    borderColor: 'var(--blood-ruby)',
    title: 'The Black Wolf Guillotine',
    desc: 'Domain-specific lexicon engine that eliminates 400+ categories of conversational filler, emotional padding, and noise patterns — preserving only actionable outcomes.',
  },
  {
    icon: RefreshCcw, iconColor: '#F87171', bgColor: 'rgba(248,113,113,0.15)',
    borderColor: '#F87171',
    title: 'Absolute Global Shredder',
    desc: 'Sliding-window N-Gram deduplication ensures every logical sequence appears exactly once.',
  },
]

export function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <section ref={ref} style={{ padding: '96px 0' }}>
      <div className="container-main">
        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-5 mb-16"
        >
          <div className="flex-1 h-px" style={{ background: 'rgba(112,112,112,0.15)' }} />
          <span className="font-orbitron text-[10px] font-semibold tracking-[4px] uppercase text-muted-steel whitespace-nowrap">
            UNLEASH THE SINGULARITY
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(112,112,112,0.15)' }} />
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <h2 className="font-orbitron font-bold tracking-[3px] uppercase mb-3" style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
            How <span className="text-blood-ruby">The Singularity</span> Works
          </h2>
          <p className="font-crimson text-muted-steel max-w-[600px] mx-auto leading-[1.6]" style={{ fontSize: 'clamp(15px, 1.6vw, 18px)' }}>
            Five sequential operations that strip every molecule of conversational waste until only the raw DNA of the logic remains.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="flex flex-col gap-5 mt-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.05 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
              className="glass-panel flex items-start gap-5"
              style={{ padding: '28px 32px', borderLeft: `2px solid ${step.borderColor}` }}
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
