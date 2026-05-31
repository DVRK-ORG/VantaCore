import { useCompressionStore } from '../stores/compressionStore'
import { COMPRESSION_PROFILES } from '../utils/compressionProfiles'

export function InputModeSelector() {
  const { inputMode, setInputMode } = useCompressionStore()
  
  const selectedProfile = COMPRESSION_PROFILES.find(p => p.id === inputMode)

  return (
    <div style={{ marginTop: '24px', marginBottom: '24px' }}>
      <div
        className="font-orbitron text-[10px] tracking-[2px] uppercase text-muted-steel"
        style={{ marginBottom: '8px', paddingLeft: '2px' }}
      >
        Compression Profile
      </div>
      <div
        style={{
          display: 'inline-flex',
          flexWrap: 'wrap',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(112, 112, 112, 0.15)',
          padding: '3px',
          gap: '2px',
        }}
      >
        {COMPRESSION_PROFILES.map(({ id, shortLabel }) => {
          const isActive = inputMode === id
          return (
            <button
              key={id}
              onClick={() => setInputMode(id)}
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
              {shortLabel}
            </button>
          )
        })}
      </div>

      {selectedProfile && selectedProfile.helperText && (
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
          {selectedProfile.helperText}
        </div>
      )}
    </div>
  )
}
