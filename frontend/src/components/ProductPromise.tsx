import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Laptop, LockKeyhole, TerminalSquare, Workflow } from 'lucide-react'

const privacyPromises = [
  'Free web demo processes text in your browser.',
  'No signup, login, or backend compression for the free demo.',
  'Local history stays in browser storage.',
  'VantaCore attribution does not claim ownership of your content.',
]

const futureTracks = [
  { icon: TerminalSquare, title: 'CLI', text: 'Local file compression, validation, stats, and developer automation.' },
  { icon: Workflow, title: 'MCP', text: 'Agent tools for compressing files, creating capsules, and preparing RAG inputs.' },
  { icon: Laptop, title: 'Pro Web', text: 'Batch workflows, advanced exports, profiles, and deeper local history later.' },
]

export function ProductPromise() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <section ref={ref} style={{ padding: '96px 0' }}>
      <div className="container-main">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)', gap: '28px' }} className="promise-grid">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                style={{ background: 'rgba(196,30,58,0.12)', border: '1px solid rgba(196,30,58,0.22)' }}
              >
                <LockKeyhole size={18} className="text-blood-ruby" />
              </div>
              <div>
                <div className="font-orbitron text-[10px] tracking-[3px] uppercase text-muted-steel">Privacy Promise</div>
                <h2 className="font-orbitron font-bold tracking-[3px] uppercase text-silver-white" style={{ fontSize: 'clamp(20px, 3vw, 30px)' }}>
                  Client-side stays sacred.
                </h2>
              </div>
            </div>
            <p className="font-crimson text-muted-steel leading-[1.65] mb-5" style={{ fontSize: '17px' }}>
              The free VantaCore web demo remains local-first. The Pro path adds scale and automation later without turning the core demo into an account wall.
            </p>
            <div className="flex flex-col gap-3">
              {privacyPromises.map((promise) => (
                <div key={promise} className="font-mono text-[12px] text-obsidian-silver" style={{ padding: '12px 14px', border: '1px solid rgba(112,112,112,0.14)', borderRadius: '8px', background: 'rgba(255,255,255,0.025)' }}>
                  {promise}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="glass-panel-ruby"
            style={{ padding: '30px' }}
          >
            <div className="font-orbitron text-[10px] tracking-[3px] uppercase text-muted-steel mb-2">Coming Soon</div>
            <h2 className="font-orbitron font-bold tracking-[3px] uppercase text-silver-white mb-4" style={{ fontSize: 'clamp(20px, 3vw, 30px)' }}>
              Pro / CLI / MCP
            </h2>
            <p className="font-crimson text-muted-steel leading-[1.65] mb-6" style={{ fontSize: '17px' }}>
              VantaCore Pro is being shaped for developers and AI power users who need batch compression, CLI workflows, MCP tools, advanced exports, and project memory capsules.
            </p>
            <div className="flex flex-col gap-4">
              {futureTracks.map((track) => (
                <div key={track.title} className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(196,30,58,0.12)' }}
                  >
                    <track.icon size={16} className="text-blood-ruby" />
                  </div>
                  <div>
                    <div className="font-orbitron text-[11px] font-bold tracking-[2px] uppercase text-silver-white">{track.title}</div>
                    <div className="font-crimson text-[14px] text-muted-steel leading-[1.5]">{track.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <a
              href="https://github.com/DVRK-ORG/VantaCore"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex mt-7 font-orbitron text-[11px] font-semibold tracking-[2px] uppercase text-blood-ruby no-underline"
            >
              Watch the Pro / MCP roadmap
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
