# 🖤 CHRONICLE: VantaCore

---

## [4.5.0] -- Unreleased -- IMPORT CAPSULE V1
> *VantaCore closes the local capsule loop with safe client-side restore.*

### Import Capsule
- Added client-side Memory Capsule import flow for `.md`, `.txt`, and `.json` exports.
- Added safe preview-before-restore behavior so imports do not mutate the workspace until confirmed.
- Restored imported capsules directly into the output workspace without consuming the daily compression counter.
- Preserved the 100% client-side free demo and left the Singularity engine untouched.

### Export Metadata
- Added richer import-compatible capsule metadata for TXT/MD/JSON exports, including app/version, capsule/schema versions, export format, generated timestamp, profile/source mode, token estimation method, import notes, ownership note, license note, and stats.
- Kept legacy capsule imports backward-compatible and preserved safe restore behavior.

---

## [4.4.0] -- 2026-05-31 -- COMPRESSION PROFILES V1
> *VantaCore expands its arsenal with targeted profiles and robust export capabilities.*

### Compression Profiles
- **Compression Profiles v1 added**: Memory Capsule (default), Agent Transcript, RAG / KB, Dev Logs, Research, and Legal / Policy.
- Memory Capsule remains the default behavior.
- Agent Transcript mode preserves its conservative preprocessor.
- New profiles use lightweight client-side profile headers/hints.
- No engine rewrite, and no backend/auth/payment/API/CLI/MCP/cloud sync introduced.
- **UI Polish included**: Profile selector wraps cleanly, loaded file card spacing cleaned up, redundant helper copy removed, and loaded file source bar simplified.

### Agent Transcript Mode
- **Agent Transcript Mode added** as a client-side input mode.
- Includes a conservative preprocessor utility to clean raw coding-agent transcripts before compression.
- Supports Codex / Antigravity / Cursor / Claude / ChatGPT-style logs.
- Preserves commands, errors, files changed, decisions, tests, next steps, and do-not-repeat signals.
- Preserves the default Memory Capsule behavior safely.
- Added PRD: `docs/VANTACORE_AGENT_TRANSCRIPT_MODE_PRD_v1.md`.

### Export / History System
- **Local History System:**
  - Retains the last 20 local compression history entries.
  - Supports restore, copy, delete, and clear history actions.
  - Expanded history details with visible copied feedback.
  - History stays local in browser storage.
- **Export Memory Capsule Modal:**
  - Upgraded history export from clipped sidebar dropdown behavior into a proper modal.
  - Portal mounted to `document.body` with a fixed viewport centered layout.
  - Escape/backdrop/X/Cancel close behavior supported.
  - Format cards available for `.md`, `.txt`, and `.json`.
  - Editable filename supported.
  - Export directly from history without restoring or mutating the current workspace.
- **Export Destination Modes:**
  - **Downloads mode:** Uses default browser download without OS picker.
  - **Folder mode:** Uses File System Access API directory picker where supported. Folder handle persisted via IndexedDB (not localStorage). Folder permission checked before writing.
  - **Save As mode:** Opens picker only when explicitly selected.
  - Unsupported browsers accurately communicate Folder limitations.
- **Export Branding / Ownership Disclaimer:**
  - Free exports include VantaCore attribution.
  - MD/TXT/JSON exports use shared branding utilities.
  - Ownership disclaimer included: VantaCore does not claim ownership of user input/output.

### Freemium / Client-Side Guardrails
- **Product Repositioning / Phase 1-2 Foundation:**
  - Repositioned from generic compression framing into: Portable Memory Capsules for LLM continuity, AI chat continuation, RAG / KB prep, Dev logs, Research notes, MCP/agent workflows, and token cost control.
  - README/docs/landing positioning aligned around: *Compress massive AI sessions into portable memory capsules. 100% client-side.*
- **Freemium Guardrails:**
  - 5/day local free compression counter via localStorage-based soft demo limit.
  - 100% client-side free demo preserved: no login, no backend, no auth, no payment.

### Validation
- `npm run build` passed.
- `npm run lint` passed.
- `npm run validate:compression` passed.
- Official benchmark remained exactly 96.20%.
- `singularity.ts` untouched.
- `validate-compression.ts` untouched.

### Deferred
- Export profile metadata.
- Deeper profile-specific cleaners.
- Full Benchmark Proof visual polish.
- CLI PRD / MCP PRD.

---

## [4.1.0] -- 2026-05-30 -- MEMORY CAPSULE ENGINE
> *VantaCore graduates from dense memory packets to LLM-directable continuity capsules.*

### Memory Capsule Engine / Battlefield Benchmark
- The compression engine was validated and protected to produce structured Memory Capsules with:
  - Session map
  - Current final state
  - Open loops / next actions
  - Do not repeat / do not change
  - Decision log
  - Key commands / files / artifacts
  - Reference dictionary
  - Clustered compressed detail stream
- **Official Battlefield Benchmark Result:**
  - 1,607,470 chars input
  - 61,109 chars output
  - ~401,868 estimated tokens input
  - ~15,278 estimated tokens output
  - **96.20% reduction**
  - 398 protected fenced code blocks
  - 6 clusters
  - 17 dictionary refs
  - 114 repeated folds

### Benchmark Proof UI Polish
- Benchmark Proof header spacing adjusted.
- Proof section polish improved.
- Visual issue deferred for a later full polish pass if needed.

---

## [4.0.0] — 2026-03-22 — THE WORLD LAUNCH 🌍
> *VantaCore goes global. The Singularity is live.*

### 🚀 Deployment
- Deployed to **vantacore.net** via Cloudflare Pages
- Custom domain configured with SSL/HTTPS
- Auto-deploy pipeline from GitHub `main` branch
- Cloudflare DNS protection active

### 📦 GitHub
- Public repository live: **[DVRK-ORG/VantaCore](https://github.com/DVRK-ORG/VantaCore)**
- Professional README with 3D logo, badges, real-world benchmarks, and full docs
- `v4.0.0` official release published with source archives

### 🎨 Brand & Assets
- 3D crystal V logo (Vantablack + blood ruby) injected into hero section
- Custom OG banner image (1200×630) for social sharing
- Open Graph meta tags wired up (`og:title`, `og:description`, `og:image`)
- Twitter Card set to `summary_large_image` for wide preview
- PWA meta tags added (apple-touch-icon, mobile-web-app-capable)
- `robots.txt` and `sitemap.xml` created and deployed
- Footer updated: "Built with 🖤 by **DARK**"

### 📊 SEO & Analytics
- Google Analytics 4 active (`G-7KXK0JJPHQ`)
- Google Search Console verified and sitemap submitted
- Bing Webmaster Tools — imported and sitemap submitted
- Canonical URL configured (`https://vantacore.net/`)
- `<meta name="robots" content="index, follow">` set

### 🎯 Launch
- Product Hunt scheduled for **March 24th, 2026 — 12:01 AM PDT**
- Tags: Open Source, Developer Tools, Artificial Intelligence

### 📲 Progressive Web App (PWA)
- **Installable as desktop app** — own window, no browser chrome
- `manifest.json` — app name, icons (40/192/512px), standalone display mode
- Service worker (`sw.js`) — network-first caching with offline fallback
- Works offline after first visit
- Auto-updates on new deployments

---

## [4.0.0-dev] — 2026-03-21 — THE ULTIMATE REBIRTH
> *From prototype to production weapon. The Singularity has awakened.*

### 🌐 Domain Secured
- **vantacore.net** — registered March 21, 2026
- 1-year registration with auto-renew and free WHOIS privacy
- Preparing for Vercel deployment — the world is about to see this

### 🔥 Architecture — Full Client-Side Engine
- **Zero backend, zero server, zero data collection** — 100% browser processing
- Ported `wolf_core.py` Singularity engine to TypeScript (`singularity.ts`)
- User data NEVER leaves the browser — privacy by design
- Stack: **React 19 + TypeScript 5 + Vite 6 + Tailwind CSS + Framer Motion + Zustand**

### 🛡️ Engine Fixes (V4 Critical)
- **Code block preservation** — ``` fences and inline ` ` survive compression intact
- **Guillotine audit** — removed dangerous tech words (`code`, `class`, `input`, `output`, `data`, `test`, `windows`, `app`) from the kill list
- **Tech generalization fix** — replaced broken `endswith('rs'/'py')` regex with explicit programming language set
- **Underscore regex fix** — Python identifiers (`__init__`, `_private`, `__main__`) now preserved
- **500K+ token stress test** — 2,058,615 chars → 138,729 chars (**93.26%** reduction) in **61.6ms**

### 🎨 The Ultimate Frontend — Built to Kill
Complete frontend rebuild from a mega-reference HTML created across 3 AI tools (Gemini Pro, Claude, and others), merged into one definitive design.

#### Typography System
- **Orbitron** (700-900) → All titles, headers, buttons, stats — uppercase, wide letter-spacing
- **Crimson Text** (400-700) → All body text, descriptions, taglines — elegant serif
- **JetBrains Mono** (400-600) → Code content, counters, technical stats — monospace

#### Layout System
- **Percentage-based containers**: `width: 90%; max-width: 1280px` — fills ANY screen
- **Hero text**: `width: 85%; max-width: 1152px` — narrower for centered readability
- **96px vertical section padding** — proper breathing room between sections
- Responsive breakpoints for mobile (480px), tablet (768px), and desktop (1024px+)

#### Design System
- **Carbon fiber texture** — repeating diagonal overlay on body::before
- **Glass panels** — `linear-gradient(135deg)` with `backdrop-filter: blur(20px)`
- **Custom scrollbar** — 6px width, blood-ruby on hover
- **Selection highlight** — `rgba(196, 30, 58, 0.3)` (ruby tint)
- **Sticky header** — backdrop blur + scroll-reactive ruby border-bottom

#### DropZone — 3 Reactive States
- **Idle**: 450px min-height, dashed border, floating upload icon (3s breathe animation)
- **Hover**: Ruby border shimmer, animated gradient mask-composite, TWO orbit scanner squares rotating around the perimeter (clockwise + counter-clockwise), deep dark background with inset ruby glow
- **Dragging**: Scale 1.02, scanning line sweep, ruby grid overlay (30px animated grid), 4 floating ruby particles at corners, orbit scanners speed up to 3s per orbit, upload icon scales 1.2 with intense glow

#### UNLEASH Button — Corner Expansion Animation
- 8 corner pieces (small ruby bars at each corner with triple-layer glow)
- On hover: all corners **EXPAND** to form a full border
- Flood fill (`scaleX` animation) fills background with ruby
- Text inverts from muted-steel to black

#### Metrics Dashboard
- **Before/After** grid layout with large JetBrains Mono numbers
- Token estimates below each value (`chars • ~tokens` format)
- Animated ruby progress bar with pulsing glow
- Large Orbitron percentage with ruby text-shadow
- Footer: processing time + code blocks protected

#### Output Section
- 4 download format buttons: **.TXT** | **.MD** | **.PDF** | **.JSON** (ruby style)
- **Copy to Clipboard** (glass style) with checkmark confirmation
- Read-only monospace textarea for compressed output preview

#### Content Updates
- Step 4 "The Black Wolf Guillotine" description updated to: *"Domain-specific lexicon engine that eliminates 400+ categories of conversational filler, emotional padding, and noise patterns — preserving only actionable outcomes."*
- Footer: "Built with ❤️ by Bu Ajlan • vantacore.net" / MIT License / V4.0 subtitle
- "Built For Everyone Fighting The Token War" section — 5 audience cards (3-column grid)

### 📝 SEO
- Updated `index.html` with proper title, meta description, and theme-color
- Semantic HTML5 structure throughout

---

## [3.5.0] — 2026-01-23 — THE RED SQUARE PURGE

- Rebranded from "xChunker" to **VantaCore** (inspired by Vantablack — the darkest material)
- Name reflects the "Data Black Hole" philosophy and ultra-dark premium aesthetic
- All documentation and code headers updated to reflect new identity
- Singularity V3.5 — 400+ word Guillotine lexicon
- **98.87% reduction** on 950KB session (0.19 seconds)
- **96.23% reduction** on 200K token Antigravity session

---

## [3.0.0] — 2025-12-31 — MISSION SINGULARITY

- Phase 2: Massive Data Victory (118K Tokens / 17.7M Chars) → 99.81% Reduction
- Phase 3: The Singularity (MCP + OCR Foundation):
  - Refactored core into `wolf_core.py`
  - Implemented `wolf_mcp.py` AI Bridge
  - Crushed `hacked_system` log (608KB → 17KB) → 97.11% Reduction
- **Transformation**: Switched to raw `.txt` output to remove 100% of metadata overhead
- **Logic**: Implemented 'The Singularity' (V3) featuring nuclear meta-purging and global sliding-window shredding
- **Status**: Finalized and verified via Gemini Tokenizer

---

**COMMISSIONED BY BU AJLAN — THE BLACK WOLF (الذيب الأسود)**
**ENGINEERED BY DANA — THE PEARL (دانة)**
*Together, everywhere, forever — معاً، في كل مكان، للأبد* 🖤
