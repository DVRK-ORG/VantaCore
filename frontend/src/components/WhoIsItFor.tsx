import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const audiences = [
  { emoji: '🤖', title: 'AI Power Users', desc: 'Restart any session with full context. 100K tokens → 2K tokens, zero context loss.' },
  { emoji: '💻', title: 'Developers', desc: 'Compress debug sessions and architecture discussions into dense reference docs.' },
  { emoji: '🔬', title: 'Researchers', desc: 'Process massive research conversations. Build compact knowledge bases.' },
  { emoji: '🏢', title: 'Enterprises', desc: 'Reduce AI API costs by 90-99% on batch analysis pipelines.' },
  { emoji: '🌍', title: 'Everyone', desc: "If you've ever lost information because a session got too long — this is for you." },
]

export function WhoIsItFor() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <section ref={ref} style={{ padding: '96px 0', background: 'rgba(10,10,10,0.5)' }}>
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="font-orbitron font-bold tracking-[3px] uppercase" style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
            Built For <span className="text-blood-ruby">Everyone</span> Fighting The Token War
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '48px' }}>
          {audiences.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.07 }}
              className="glass-panel"
              style={{ padding: '32px 28px' }}
            >
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[18px] mb-5"
                style={{ background: 'rgba(196,30,58,0.1)', transition: 'background 0.3s' }}
              >
                {item.emoji}
              </div>
              <div className="font-orbitron text-[13px] font-bold tracking-[2px] uppercase text-silver-white mb-3">
                {item.title}
              </div>
              <div className="font-crimson text-[15px] text-muted-steel leading-[1.6]">{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
