import { useCompressionStore } from '../stores/compressionStore'

export function TextInput() {
  const { inputText, setInputText, setInputFileName } = useCompressionStore()
  const charCount = inputText.length
  const tokenEstimate = Math.round(charCount / 4)

  return (
    <div className="relative mb-6">
      <textarea
        value={inputText}
        onChange={(e) => { setInputText(e.target.value); setInputFileName('') }}
        placeholder="Paste your AI session, log, or knowledge base..."
        className="text-input"
        style={{
          width: '100%',
          minHeight: '320px',
          background: 'var(--vanta-surface)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '24px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '13px',
          color: 'var(--silver-white)',
          resize: 'vertical',
          outline: 'none',
          transition: 'border-color 0.3s, box-shadow 0.3s',
          lineHeight: '1.7',
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = 'rgba(196,30,58,0.4)'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,30,58,0.1), 0 0 20px rgba(196,30,58,0.1)'
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
      {charCount > 0 && (
        <div className="absolute bottom-4 right-5 font-mono text-[11px] text-muted-steel pointer-events-none">
          {charCount.toLocaleString()} chars • ~{tokenEstimate.toLocaleString()} tokens
        </div>
      )}
    </div>
  )
}
