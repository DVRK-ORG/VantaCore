import { useCompressionStore } from '../stores/compressionStore'
import type { InputMode } from '../utils/agentTranscript'

const modes: { key: InputMode; label: string }[] = [
  { key: 'memory-capsule', label: 'Memory Capsule' },
  { key: 'agent-transcript', label: 'Agent Transcript' },
]

export function InputModeSelector() {
  const { inputMode, setInputMode } = useCompressionStore()

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        className="font-orbitron text-[10px] tracking-[2px] uppercase text-muted-steel"
        style={{ marginBottom: '8px', paddingLeft: '2px' }}
      >
        Mode
      </div>
      <div
        style={{
          display: 'inline-flex',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(112, 112, 112, 0.15)',
          padding: '3px',
          gap: '2px',
        }}
      >
        {modes.map(({ key, label }) => {
          const isActive = inputMode === key
          return (
            <button
              key={key}
              onClick={() => setInputMode(key)}
              className="font-orbitron text-[10px] font-semibold tracking-[1.5px] uppercase cursor-pointer"
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: isActive
                  ? 'rgba(196, 30, 58, 0.15)'
                  : 'transparent',
                color: isActive
                  ? 'var(--blood-ruby)'
                  : 'var(--muted-steel)',
                borderColor: isActive
                  ? 'rgba(196, 30, 58, 0.25)'
                  : 'transparent',
                borderWidth: '1px',
                borderStyle: 'solid',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive
                  ? '0 0 12px rgba(196, 30, 58, 0.1)'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--silver-white)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--muted-steel)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Helper text for Agent Transcript mode */}
      {inputMode === 'agent-transcript' && (
        <div
          className="font-crimson text-[12px]"
          style={{
            color: 'var(--obsidian-silver)',
            opacity: 0.7,
            marginTop: '8px',
            paddingLeft: '2px',
            lineHeight: '1.5',
          }}
        >
          Best for Codex, Antigravity, Cursor, Claude, ChatGPT exports, terminal logs, build output, and repo handoff transcripts.
        </div>
      )}
    </div>
  )
}
