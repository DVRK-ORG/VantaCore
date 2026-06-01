import {
  ArrowRight,
  BookOpen,
  Braces,
  Code2,
  Database,
  FileText,
  Gauge,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { ReactNode } from 'react'

type NoteStatus = 'Live' | 'Queued'

type MemoryLabNote = {
  number: string
  title: string
  href: string
  summary: string
  category: string
  status: NoteStatus
}

const notes: MemoryLabNote[] = [
  {
    number: '001',
    title: 'What Is a Memory Capsule for LLMs?',
    href: '/memory-lab/what-is-a-memory-capsule',
    summary: 'A technical primer on portable state, structured compression, and long-session continuity.',
    category: 'Technical Archive',
    status: 'Live',
  },
  {
    number: '002',
    title: 'How to Continue a Long ChatGPT / Claude / Gemini Session Without Restarting',
    href: '/memory-lab',
    summary: 'A practical continuity workflow for moving complex work into a fresh model session.',
    category: 'Field Guide',
    status: 'Queued',
  },
  {
    number: '003',
    title: 'VantaCore Benchmark: 1.6M Characters to 61K',
    href: '/memory-lab',
    summary: 'A transparent look at the benchmark file, reduction profile, protected code, and capsule output.',
    category: 'Benchmark Report',
    status: 'Queued',
  },
  {
    number: '004',
    title: 'RAG Preprocessing: Why Raw Chat Logs Make Bad Knowledge Bases',
    href: '/memory-lab',
    summary: 'How capsule structure can remove filler and preserve useful operational knowledge.',
    category: 'Research Prep',
    status: 'Queued',
  },
  {
    number: '005',
    title: 'Coding Agent Handoff: Compressing Codex, Cursor, Claude, and Dev Logs',
    href: '/memory-lab',
    summary: 'A handoff pattern for decisions, open loops, validations, and next actions across tools.',
    category: 'Agent Ops',
    status: 'Queued',
  },
]

const benchmarkStats = [
  { label: 'Reduction', value: '96.2%', detail: 'benchmark compression' },
  { label: 'Characters', value: '1,607,470', detail: 'to 61,109' },
  { label: 'Protected code', value: '398', detail: 'balanced fenced blocks' },
  { label: 'Dictionary', value: '17 refs', detail: '114 repeated folds' },
]

const articleSections = [
  {
    icon: <Code2 size={18} />,
    title: 'Code Protection',
    label: 'Fencing',
    body: 'VantaCore isolates fenced code blocks before compression so syntax survives the pass and can be referenced back from the capsule.',
  },
  {
    icon: <Network size={18} />,
    title: 'Session Mapping',
    label: 'Clusters',
    body: 'Long transcripts become compact maps of decisions, open loops, constraints, and resolved state instead of a flat wall of chat.',
  },
]

const continuitySteps = [
  'Compress the long session with the Memory Capsule profile.',
  'Carry the capsule output into the next model session.',
  'Ask the model to treat the capsule as operating state, not casual summary.',
  'Continue from the current task, constraints, and next actions.',
]

function LabShell({ children }: { children: ReactNode }) {
  return (
    <main className="memory-lab-page">
      <div className="memory-lab-grid" />
      {children}
    </main>
  )
}

function LabNavTrail({ current }: { current: string }) {
  return (
    <nav className="memory-lab-trail" aria-label="Breadcrumb">
      <a href="/memory-lab">Memory Lab</a>
      <span>/</span>
      <span>{current}</span>
    </nav>
  )
}

function SectionHeading({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div className="memory-lab-section-heading">
      {kicker && <span>{kicker}</span>}
      <h2>{title}</h2>
    </div>
  )
}

function BenchmarkPanel({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={compact ? 'memory-lab-benchmark compact' : 'memory-lab-benchmark'} aria-label="VantaCore benchmark metrics">
      <div className="memory-lab-panel-title">
        <Gauge size={16} />
        <span>Benchmark Metrics</span>
      </div>
      <div className="memory-lab-stat-grid">
        {benchmarkStats.map(stat => (
          <div key={stat.label} className="memory-lab-stat">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </div>
        ))}
      </div>
      <div className="memory-lab-processing">
        <span>Processing</span>
        <strong>100% Client-Side</strong>
      </div>
    </aside>
  )
}

function NoteCard({ note, featured = false }: { note: MemoryLabNote; featured?: boolean }) {
  const content = (
    <>
      <div className="memory-lab-card-topline">
        <span>Note {note.number}</span>
        <strong>{note.status}</strong>
      </div>
      <h3>{note.title}</h3>
      <p>{note.summary}</p>
      <div className="memory-lab-card-footer">
        <span>{note.category}</span>
        {note.status === 'Live' && <ArrowRight size={16} />}
      </div>
    </>
  )

  if (note.status === 'Live') {
    return (
      <a className={featured ? 'memory-lab-note-card featured' : 'memory-lab-note-card'} href={note.href}>
        {content}
      </a>
    )
  }

  return <article className="memory-lab-note-card muted">{content}</article>
}

export function MemoryLabIndex() {
  return (
    <LabShell>
      <section className="memory-lab-hero">
        <div className="memory-lab-hero-copy">
          <LabNavTrail current="Notes" />
          <div className="memory-lab-archive-label">
            <BookOpen size={16} />
            <span>Technical field notes from VantaCore</span>
          </div>
          <h1>
            Memory Lab <span>Notes</span>
          </h1>
          <p>
            Premium static reports on LLM continuity, Memory Capsules, RAG prep, coding-agent handoff, and token cost control. Built
            to educate users and lead them back to the local compression tool.
          </p>
          <div className="memory-lab-actions">
            <a href="/memory-lab/what-is-a-memory-capsule" className="memory-lab-primary-action">
              Read Note 001
              <ArrowRight size={18} />
            </a>
            <a href="/#tool" className="memory-lab-secondary-action">
              Feed the Singularity
            </a>
          </div>
        </div>
        <BenchmarkPanel />
      </section>

      <section className="memory-lab-featured">
        <SectionHeading kicker="Archive Entry" title="Start With the Capsule Primer" />
        <NoteCard note={notes[0]} featured />
      </section>

      <section className="memory-lab-archive">
        <SectionHeading kicker="Roadmap" title="Queued Field Notes" />
        <div className="memory-lab-note-grid">
          {notes.slice(1).map(note => (
            <NoteCard key={note.number} note={note} />
          ))}
        </div>
      </section>

      <section className="memory-lab-promise">
        <div>
          <LockKeyhole size={20} />
          <h2>Static, private, and intentionally boring under the hood.</h2>
        </div>
        <p>
          Memory Lab Notes ships as static client-side content. No comments, no CMS, no auth wall, and no backend publishing system.
          The section exists to explain the craft behind VantaCore without changing the product scope.
        </p>
      </section>
    </LabShell>
  )
}

export function MemoryLabArticle() {
  return (
    <LabShell>
      <div className="memory-lab-article-layout">
        <article className="memory-lab-article">
          <LabNavTrail current="Note 001" />
          <header className="memory-lab-article-header">
            <div className="memory-lab-archive-label">
              <Sparkles size={16} />
              <span>Technical Archive // 001</span>
            </div>
            <h1>
              What Is a <span>Memory Capsule?</span>
            </h1>
            <p>
              An architectural deep dive into context optimization. How VantaCore compresses massive LLM sessions into portable,
              structured state for the next model session.
            </p>
          </header>

          <div className="memory-lab-prose">
            <p>
              In the current landscape of large language models, context window is the practical bottleneck. Every token fed into the
              model costs compute, memory, latency, and attention. A Memory Capsule is VantaCore&apos;s compact representation of a
              long AI interaction history, designed to preserve useful state while stripping repeated filler.
            </p>

            <h2>The Context Horizon Problem</h2>
            <p>
              Complex engineering sessions often hit the context horizon. Early constraints become harder for the model to preserve,
              previously established facts drift, and the newest messages dominate attention. Simply truncating the conversation can
              remove the exact decisions that make the next answer useful.
            </p>

            <div className="memory-lab-diagram" role="img" aria-label="Raw session compressed into capsule version 4">
              <div className="memory-lab-diagram-caption">
                <span>FIG 1: CAPSULE ARCHITECTURE</span>
                <span>VER: 4.4</span>
              </div>
              <div className="memory-lab-diagram-stage">
                <div className="memory-lab-diagram-box">
                  <span>RAW_SESSION</span>
                  <strong>401k TOKENS</strong>
                </div>
                <div className="memory-lab-compress-icon">
                  <Braces size={24} />
                </div>
                <div className="memory-lab-diagram-box capsule">
                  <span>CAPSULE_V4</span>
                  <strong>15k TOKENS</strong>
                </div>
              </div>
            </div>

            <h2>Structural Fencing and Stable References</h2>
            <p>
              A good capsule is not just a shorter summary. It separates structure from noise, keeps durable references stable, and
              gives the next session a compressed operational trail.
            </p>

            <div className="memory-lab-method-list">
              {articleSections.map(section => (
                <section key={section.title}>
                  <div>{section.icon}</div>
                  <div>
                    <strong>{section.title} <span>({section.label})</span></strong>
                    <p>{section.body}</p>
                  </div>
                </section>
              ))}
            </div>

            <h2>How Continuity Works in Practice</h2>
            <ol>
              {continuitySteps.map(step => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <p>
              The result is a dense, machine-readable handoff artifact. It cannot guarantee perfect recall, but it gives the next
              session a much stronger starting state than a casual recap or raw transcript paste.
            </p>
          </div>
        </article>

        <aside className="memory-lab-article-sidebar">
          <BenchmarkPanel compact />
          <div className="memory-lab-cta-card">
            <ShieldCheck size={36} />
            <h2>Feed the Singularity</h2>
            <p>Compress your own long AI sessions into portable memory capsules in the local browser demo.</p>
            <a href="/#tool">
              Try the Free Demo
              <ArrowRight size={16} />
            </a>
            <span>Free Core / Paid Power Later</span>
          </div>
          <div className="memory-lab-format-card">
            <FileText size={18} />
            <div>
              <strong>Import-compatible exports</strong>
              <p>Capsules can move through JSON, MD, and TXT export flows without using daily quota on restore.</p>
            </div>
          </div>
          <div className="memory-lab-format-card">
            <Database size={18} />
            <div>
              <strong>No hosted compression</strong>
              <p>The free demo remains client-side and does not upload user content to a VantaCore backend.</p>
            </div>
          </div>
        </aside>
      </div>
    </LabShell>
  )
}
