# 🌪️ WINDY PRO — MASTER CONTEXT FILE

**Read this FIRST before doing ANY work on this project.**

This file captures the complete vision, strategy, technical decisions, and execution plan for Windy Pro. It was synthesized from a "Board of Directors" session with Gemini, ChatGPT, Perplexity, and Grok, combined with Grant Whitmer's original vision.

---

## 🎯 THE ONE-SENTENCE PITCH

**Windy Pro is a voice-to-text tool where the green strobe never lies — unlimited recording, real-time feedback, local-first privacy, and a TurboTax-simple installer.**

---

## 🔥 THE PROBLEM WE'RE SOLVING

### The Wispr Flow Pain Points

Grant's original frustration with Wispr Flow:

> "Wispr Flow resets every 5 minutes. It's a big pain because when I'm discussing a vision or vibe coding, I want to talk longer than 5 minutes. It just shuts me off. If I don't hear the little beeps, I might talk another 5-10 minutes and when I go to paste, I realize it wasn't recording anything. Very frustrating because you're in the zone, creating, articulating a vision — then you have to go back and try to capture lightning in a bottle again."

> "Also if the computer freezes up or you don't hit the buttons just right, you may think it started recording and talk for 2-3 minutes crafting the perfect prompt. When you hit paste — whoops, it wasn't actually recording."

### The Emotional Core

**The product isn't transcription. The product is CONFIDENCE.**

Users need to know — with 100% certainty — that their words are being captured. The anxiety of "is it recording?" destroys flow state.

---

## ✅ THE SOLUTION

### What Windy Pro Delivers

| Feature | Wispr Flow | Windy Pro |
|---------|------------|-----------|
| **Session Limit** | ~5 minutes | **UNLIMITED** |
| **Visual Feedback** | Opaque black box | **Real-time Green Strobe** |
| **Confidence** | "Did it catch that?" | **Green = Safe. Always.** |
| **Privacy** | Cloud only | **Local-first** or private VPS |
| **Output** | Auto-polished (bad for code) | **Raw/Verbatim** (perfect for LLMs) |
| **Cost** | ~$17/month | **Free (local) / ~$5 (cloud)** |
| **Crash Recovery** | None | **Every segment saved instantly** |

### The Green Strobe UX

```
Grant's description of the ideal experience:

"The whole box just blinks green. It slowly strobes green, so the whole 
time I'm talking, I know it's recording. I can see my words going. 
There's never any stress on whether or not it's recording. I never 
have to go check. I just talk and talk and talk. Way past 5 minutes, 
as long as I want."
```

This is the north star. If the green strobe is on, the user is safe. Period.

---

## 🧠 BOARD OF DIRECTORS SYNTHESIS

Four major LLMs analyzed this vision. Here are their unique contributions:

### ChatGPT's Key Insight: "Trustable State Machine"
- The UI must NEVER lie
- If green = recording, that must be 100% true
- State machine: IDLE → LISTENING → BUFFERING → ERROR → INJECTING
- **Crash recovery is critical** — write to temp file on EVERY segment

### Perplexity's Key Insight: "Mobile is a Dead End"
- iOS/Android have OS-level restrictions on background audio
- You CANNOT run Whisper in background on mobile
- **Mobile must be cloud-only client** — don't waste cycles on local mobile
- Also: Opus compression = 24kbps = 10MB/hour (bandwidth not the bottleneck)

### Grok's Key Insight: "Study Existing OSS First"
- Buzz (17.7k stars) — excellent Whisper GUI, MIT license
- whisper_streaming (3.5k stars) — real-time streaming patterns
- **Don't reinvent** — borrow proven patterns
- Budget: $5K-20K for MVP, 1-3 months timeline

### Gemini's Key Insight: "Concurrency Math Matters"
- Hostinger KVM4 (4 vCPU, 16GB) = 3-5 concurrent streams max
- Can't put 100 users on one KVM4 at peak
- Multi-region deployment needed for latency (Boston→California = noticeable)
- Solution: BYOVPS (Bring Your Own VPS) for Pro tier

---

## 🏗️ TECHNICAL ARCHITECTURE

### Operating Modes

**Mode A: Windy Local (Priority)**
- Electron app spawns Python subprocess
- faster-whisper runs locally on user's machine
- Zero latency, zero cost, 100% privacy
- **Target: Users with ≥8GB RAM and decent CPU/GPU**

**Mode B: Windy Cloud (Fallback)**
- Same Electron app, but connects to VPS
- Audio streams via WebSocket (Opus encoded)
- VPS runs faster-whisper, streams text back
- **Target: Weak hardware, mobile users**

### Tech Stack

```
BACKEND (Python):
├── faster-whisper — Core transcription engine
├── Silero VAD — Voice activity detection
├── WebSocket server — Client communication
└── FastAPI — Cloud API (auth, vault, etc.)

FRONTEND (Electron + React):
├── Electron — Desktop shell
├── React — UI components
├── Tailwind CSS — Styling (mobile-responsive)
└── WebSocket client — Backend connection

INFRASTRUCTURE:
├── Hostinger KVM4 — Reference cloud server
├── Docker — Containerization
├── PostgreSQL — User data, Prompt Vault
└── Cloudflare — DNS, SSL, CDN
```

### State Machine (Critical)

```
┌─────────────┐
│   IDLE      │ ← Gray, not recording
└──────┬──────┘
       │ User presses hotkey
       ▼
┌─────────────┐
│  LISTENING  │ ← GREEN STROBE (1Hz pulse)
└──────┬──────┘
       │ Processing backlog
       ▼
┌─────────────┐
│  BUFFERING  │ ← Yellow (temporary)
└──────┬──────┘
       │ Error condition
       ▼
┌─────────────┐
│   ERROR     │ ← Red + auto-reconnect
└──────┬──────┘
       │ Hotkey release
       ▼
┌─────────────┐
│  INJECTING  │ ← Blue flash (pasting to cursor)
└─────────────┘
```

---

## 🚫 CRITICAL INVARIANTS (Never Violate)

1. **If green strobe is on, audio IS being captured.** No exceptions.
2. **Every segment is written to temp file BEFORE callback.** Crash recovery is non-negotiable.
3. **No terminal commands for end users.** TurboTax or nothing.
4. **One codebase for mobile and desktop web.** Tailwind responsive.
5. **Local mode works 100% offline** after initial install.

---

## 🎨 BRANDING & POSITIONING

### Name
**Windy Pro** (domain available, trademarkable)

### Tagline
**"The Green Strobe Never Lies."**

### Marketing Copy (from Perplexity)
- "No 5-minute reset. No nagging. Just talk."
- "Your voice. Your machine. Your data."
- "Wispr Flow but local, unlimited, and no time limit."

### Target Users
1. **Vibe Coders** — Developers using voice for LLM prompts
2. **Writers** — Long-form content creators
3. **Podcasters** — Real-time transcription
4. **Power Users** — Anyone frustrated with Wispr Flow's limits

---

## 📁 PROJECT STRUCTURE

```
windy-pro/
├── CONTEXT.md                    # THIS FILE — read first!
├── DNA_STRAND_MASTER_PLAN.md     # Granular build plan
├── README.md                     # User-facing docs
├── requirements.txt              # Python dependencies
│
├── docs/
│   ├── 00_AI_CONTEXT_INJECTION.md
│   ├── 01_VISION_AND_STRATEGY.md
│   ├── 02_TECHNICAL_ARCHITECTURE.md
│   ├── 03_MASTER_ROADMAP.md
│   ├── 04_BOARD_SYNTHESIS_ANALYSIS.md
│   └── 05_OSS_RESEARCH.md
│
├── src/
│   ├── engine/                   # Python backend
│   │   ├── transcriber.py        # Core engine (✅ complete)
│   │   ├── audio_capture.py      # Mic input (✅ complete)
│   │   ├── server.py             # WebSocket server (✅ complete)
│   │   └── demo.py               # CLI test (✅ complete)
│   │
│   ├── client/
│   │   ├── desktop/              # Electron app
│   │   │   ├── main.js           # Main process (✅ complete)
│   │   │   ├── preload.js        # IPC bridge (✅ complete)
│   │   │   ├── package.json      # Electron config (✅ complete)
│   │   │   └── renderer/         # React UI (✅ complete)
│   │   │       ├── index.html
│   │   │       ├── styles.css    # Green Strobe CSS
│   │   │       └── app.js
│   │   │
│   │   └── web/                  # React PWA (🔲 Phase 2-3)
│   │
│   └── api/                      # Cloud API (🔲 Phase 2)
│
├── installer/                    # TurboTax installer (🔲 Phase 1.4)
│
└── deploy/                       # Docker, Nginx, etc. (🔲 Phase 2)
```

---

## 📅 BUILD PHASES

### Phase 1: Desktop MVP (Weeks 1-4)
- [x] Python transcription engine
- [x] Audio capture module
- [x] WebSocket server
- [x] Electron shell (floating window, tray, hotkeys)
- [x] Green Strobe UI
- [ ] Cursor injection (Windows/Mac)
- [ ] TurboTax installer
- [ ] Packaging (NSIS, DMG, AppImage)

### Phase 2: Cloud Backend (Weeks 5-6)
- [ ] FastAPI server with auth
- [ ] Prompt Vault (PostgreSQL)
- [ ] Docker containerization
- [ ] Hostinger KVM4 deployment

### Phase 3: Web/Mobile + Launch (Weeks 7-8)
- [ ] React PWA
- [ ] Landing page
- [ ] Beta launch
- [ ] Marketing push

---

## 🔧 HOW TO BUILD (For Future Kit)

### Prerequisites
```bash
# Python 3.10+ with pip
python --version

# Node.js 18+ with npm
node --version

# Git
git --version
```

### Setup
```bash
# Clone the repo
git clone https://github.com/sneakyfree/windy-pro.git
cd windy-pro

# Python backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Electron frontend
cd src/client/desktop
npm install

# Run demo (Python only)
cd ../../..
python src/engine/demo.py --model tiny

# Run full app (Electron + Python)
# Terminal 1: Start Python server
python -m src.engine.server --model base

# Terminal 2: Start Electron
cd src/client/desktop
npm start
```

### Test the Green Strobe
1. Start the Python server
2. Start Electron app
3. Press Ctrl+Shift+Space
4. The window should pulse GREEN
5. Speak — words should appear in real-time
6. Press Ctrl+Shift+Space again to stop

---

## 💡 KEY TECHNICAL DECISIONS

### Why faster-whisper over OpenAI Whisper?
- 4x faster on CPU
- Same accuracy
- Quantization support (int8 for weak hardware)
- MIT license

### Why Electron over Tauri?
- Better ecosystem for audio handling
- More mature for cross-platform
- Easier Python subprocess management
- Can migrate to Tauri later if needed

### Why NOT mobile local inference?
- iOS/Android don't allow background audio processing
- Battery and thermal constraints
- OS restrictions on always-on services
- Mobile = cloud client, period

### Why write to temp file on every segment?
- If app crashes mid-session, text survives
- Users dictate for 20+ minutes — can't lose that
- fsync() ensures disk write, not just buffer

---

## 📊 SUCCESS METRICS

| Metric | Target | Current |
|--------|--------|---------|
| Time to First Transcription | < 3 min | TBD |
| Latency (local) | < 500ms | TBD |
| Latency (cloud) | < 1.5s | TBD |
| Session Length | Unlimited | ✅ |
| Crash Recovery | 100% | ✅ Built |
| Green Strobe Accuracy | 100% | ✅ Built |

---

## 🚨 COMMON PITFALLS TO AVOID

1. **Don't try mobile local inference** — it's a dead end per Perplexity
2. **Don't skip crash recovery** — users will lose work and hate you
3. **Don't make users touch terminal** — TurboTax or fail
4. **Don't auto-polish output** — vibe coders need raw text
5. **Don't lie about state** — if green is on, you better be recording

---

## 📞 CONTACTS & RESOURCES

- **Project Owner:** Grant Whitmer
- **GitHub:** sneakyfree/windy-pro
- **Reference:** Wispr Flow (competitor to beat)
- **OSS References:** 
  - Buzz: https://github.com/chidiwilliams/buzz
  - whisper_streaming: https://github.com/ufal/whisper_streaming

---

## ✅ CHECKLIST FOR NEW KIT

When you wake up fresh and need to work on Windy Pro:

1. [ ] Read this CONTEXT.md file completely
2. [ ] Read DNA_STRAND_MASTER_PLAN.md for granular tasks
3. [ ] Check which codons are ✅ vs 🔲
4. [ ] Pick the next 🔲 codon in sequence
5. [ ] Build it, test it, mark it ✅
6. [ ] Commit and push to GitHub
7. [ ] Update DNA_STRAND_MASTER_PLAN.md

**Remember:** The green strobe never lies. Neither should your code.

---

*This document is the source of truth for Windy Pro.*
*Last updated: 2026-02-04 by Kit 0*
