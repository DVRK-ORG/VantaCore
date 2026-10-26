import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Bot, Database, FileCode2, Microscope, ReceiptText, Workflow } from 'lucide-react'

// Restore original 6-card content from main, keep new Stitch visual style
const useCases = [
  { icon: Bot, title: 'AI Chat Continuation', desc: 'Restart long ChatGPT, Claude, Gemini, or local-model sessions with final state, open loops, and decisions intact.' },
  { icon: Database, title: 'RAG / KB Prep', desc: 'Pre-compress messy chats, notes, transcripts, and docs before chunking, embedding, or indexing.' },
  { icon: FileCode2, title: 'Dev Logs / Agents', desc: 'Turn coding-agent transcripts, terminal logs, PR threads, and build output into handoff-ready capsules.' },
  { icon: Microscope, title: 'Research Notes', desc: 'Compress literature-review chats, paper notes, interviews, and analysis sessions into compact research memory.' },
  { icon: ReceiptText, title: 'API Cost Reduction', desc: 'Remove duplicated commands, repeated prompt blocks, and filler before paid LLM or embedding calls.' },
  { icon: Workflow, title: 'MCP / Agent Workflows', desc: 'Prepare the same Memory Capsule format that future CLI and MCP tools can hand to coding assistants.' },
]

export function WhoIsItFor() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <section ref={ref} style={{ padding: '96px 0', background: 'rgba(10,10,10,0.5)' }}>
      <div className="container-main">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h2 className="font-orbitron font-black uppercase tracking-[3px] mb-3" style={{ fontSize: 'clamp(22px, 3.2vw, 34px)' }}>
            Built For <span className="text-blood-ruby">LLM Continuity</span>
          </h2>
          <p className="font-crimson text-muted-steel max-w-[700px] mx-auto leading-[1.6]" style={{ fontSize: 'clamp(15px, 1.6vw, 18px)' }}>
            Use VantaCore wherever raw context is too large, too repetitive, or too messy to use.
          </p>
        </motion.div>

        {/* Stitch upgrade: 5 cards with icons above title, improved spacing */}
        <div className="who-grid" style={{ marginTop: '48px' }}>
          {useCases.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.07 }}
              className="top-accent-strip who-card"
              style={{
                padding: '28px 22px 24px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(17,17,17,0.94), rgba(10,10,10,0.98))',
                border: '1px solid rgba(196,30,58,0.18)',
                boxShadow: 'inset 0 0 20px rgba(196,30,58,0.04)',
                transition: 'border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(196,30,58,0.5)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(196,30,58,0.18), inset 0 0 24px rgba(196,30,58,0.08)'
                e.currentTarget.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(196,30,58,0.18)'
                e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(196,30,58,0.04)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Icon — moved above title per Stitch */}
              <div className="icon-container-bordered">
                <item.icon size={18} className="text-blood-ruby" />
              </div>
              <div className="font-orbitron text-[12px] font-bold tracking-[1.8px] uppercase text-silver-white">
                {item.title}
              </div>
              <div className="font-crimson text-[14px] text-muted-steel leading-[1.55]">{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
