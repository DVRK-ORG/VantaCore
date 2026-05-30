import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Braces, Boxes, Code2, Repeat2 } from 'lucide-react'

const metrics = [
  { label: 'Characters', value: '1,607,470', detail: 'to 61,109' },
  { label: 'Estimated Tokens', value: '~401,868', detail: 'to ~15,278' },
  { label: 'Reduction', value: '96.2%', detail: 'memory capsule output' },
  { label: 'Protected Code', value: '398', detail: 'fenced blocks balanced' },
  { label: 'Clusters', value: '6', detail: 'topic groups detected' },
  { label: 'Dictionary', value: '17 refs', detail: '114 folds' },
]

const proofSignals = [
  { icon: Boxes, title: 'Clusters', text: 'Topic shifts become compact session maps instead of a flat transcript.' },
  { icon: Repeat2, title: 'Reference Dictionary', text: 'Repeated commands, prompts, and code blocks fold into stable references.' },
  { icon: Code2, title: 'Code Protection', text: 'Fenced code survives the compression pass with balanced output fences.' },
  { icon: Braces, title: 'LLM Continuity', text: 'Final state, open loops, decisions, and do-not-repeat signals stay visible.' },
]

export function BenchmarkProof() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <section ref={ref} style={{ padding: '96px 0', background: 'rgba(10,10,10,0.45)' }}>
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <h2 className="font-orbitron font-bold tracking-[3px] uppercase mb-4" style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
            Battlefield <span className="text-blood-ruby">Proof</span>
          </h2>
          <p className="font-crimson text-obsidian-silver max-w-[640px] mx-auto leading-[1.7]" style={{ fontSize: 'clamp(15px, 1.6vw, 18px)' }}>
            The current official benchmark compresses a merged multi-session AI export into a portable Memory Capsule ready for the next LLM.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)', gap: '28px', alignItems: 'center' }} className="proof-grid">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="glass-panel-ruby"
            style={{ padding: '18px' }}
          >
            <img
              src="/Preview.png"
              alt="VantaCore benchmark showing 96.2 percent reduction and Memory Capsule output"
              style={{
                width: '100%',
                display: 'block',
                borderRadius: '10px',
                border: '1px solid rgba(112,112,112,0.18)',
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.18 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px', marginBottom: '18px' }}>
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="glass-panel"
                  style={{ padding: '20px', borderRadius: '10px' }}
                >
                  <div className="font-orbitron text-[9px] tracking-[2px] uppercase text-muted-steel mb-2">{metric.label}</div>
                  <div className="font-mono font-bold text-blood-ruby" style={{ fontSize: 'clamp(18px, 2vw, 26px)' }}>{metric.value}</div>
                  <div className="font-mono text-[11px] text-obsidian-silver mt-1">{metric.detail}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {proofSignals.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(196,30,58,0.12)', border: '1px solid rgba(196,30,58,0.22)' }}
                  >
                    <item.icon size={16} className="text-blood-ruby" />
                  </div>
                  <div>
                    <div className="font-orbitron text-[11px] font-bold tracking-[2px] uppercase text-silver-white">{item.title}</div>
                    <div className="font-crimson text-[14px] text-muted-steel leading-[1.5]">{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
