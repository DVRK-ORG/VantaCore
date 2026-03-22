export function Footer() {
  return (
    <footer style={{ padding: '56px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
      <div className="font-crimson text-[16px] text-obsidian-silver mb-3">
        Built with 🖤 by <strong className="text-silver-white font-semibold">DARK</strong> •{' '}
        <a href="https://vantacore.net" className="text-blood-ruby no-underline">vantacore.net</a>
      </div>
      <div className="font-mono text-[11px] text-muted-steel tracking-[1px] mb-3">
        MIT License • Open Source • 100% Free Forever
      </div>
      <div className="font-crimson italic text-[11px]" style={{ opacity: 0.3, marginTop: '8px' }}>
        V4.0 — The Singularity Engine
      </div>
    </footer>
  )
}
