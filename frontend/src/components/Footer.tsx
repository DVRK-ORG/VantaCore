export function Footer() {
  return (
    <footer className="footer-brackets">
      <span className="corner-bl" />
      <span className="corner-br" />

      <div className="font-crimson text-[16px] text-obsidian-silver mb-3">
        Built by <strong className="text-silver-white font-semibold">DARK</strong> —{' '}
        <a href="https://vantacore.net" className="text-blood-ruby no-underline hover:opacity-80">vantacore.net</a>
      </div>
      <div className="font-mono text-[11px] text-muted-steel tracking-[1.5px] uppercase mb-2">
        MIT License · Open Core · 100% Client-Side Free Demo
      </div>
      <div className="font-mono text-[10px] text-muted-steel tracking-[1.5px] uppercase" style={{ opacity: 0.5 }}>
        V4.4 — Portable Memory Capsules for LLMs
      </div>
    </footer>
  )
}
