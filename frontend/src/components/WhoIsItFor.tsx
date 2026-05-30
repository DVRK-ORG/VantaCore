import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Bot, Database, FileCode2, Microscope, ReceiptText, Workflow } from 'lucide-react'

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
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="font-orbitron font-bold tracking-[3px] uppercase mb-3" style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
            Built For <span className="text-blood-ruby">LLM Continuity</span>
          </h2>
          <p className="font-crimson text-muted-steel max-w-[700px] mx-auto leading-[1.6]" style={{ fontSize: 'clamp(15px, 1.6vw, 18px)' }}>
            Use VantaCore wherever raw context is too large, too repetitive, or too messy for the next model to use cleanly.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginTop: '48px' }}>
          {useCases.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.07 }}
              className="glass-panel"
              style={{ padding: '30px 28px', borderRadius: '10px' }}
            >
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-5"
                style={{ background: 'rgba(196,30,58,0.1)', border: '1px solid rgba(196,30,58,0.18)' }}
              >
                <item.icon size={18} className="text-blood-ruby" />
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
