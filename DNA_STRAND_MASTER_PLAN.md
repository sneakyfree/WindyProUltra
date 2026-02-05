# 🧬 WINDY PRO — DNA STRAND MASTER PLAN

**Version:** 1.0.0
**Created:** 2026-02-04
**Author:** Kit 0 + Grant Whitmer
**Philosophy:** Begin with the end in mind. — Stephen R. Covey

---

## 🎯 THE END STATE (What We're Building Toward)

### The Vision in One Sentence
**Windy Pro is a push-button, TurboTax-simple voice-to-text platform that provides unlimited, real-time transcription with absolute confidence that it's recording — local-first for power users, cloud-backed for everyone else.**

### The User Experience (End State)

```
USER JOURNEY — 60 SECONDS TO FLOW STATE

1. User visits windypro.com
2. Clicks "Download" or "Try Cloud"
3. DOWNLOAD PATH:
   └─ Installer detects hardware (GPU? RAM? CPU?)
   └─ Auto-selects optimal Whisper model
   └─ Installs in < 2 minutes, no terminal ever
   └─ Floating window appears in system tray
   
4. CLOUD PATH:
   └─ Sign up with email
   └─ Instant access via web app
   └─ Works on any device

5. USER SPEAKS:
   └─ Green Strobe pulses — "I am recording"
   └─ Words appear in real-time
   └─ No 5-minute limit. Ever.
   └─ Paste anywhere with one click/hotkey

6. USER TRUSTS:
   └─ Green = Safe. Always.
   └─ Yellow = Processing. Wait.
   └─ Red = Error. Auto-reconnecting.
   └─ Blue = Injecting text to cursor.
```

### Success Metrics (The Numbers That Matter)

| Metric | Target | Why |
|--------|--------|-----|
| Time to First Transcription | < 3 minutes | TurboTax promise |
| Latency (local) | < 500ms | Real-time feel |
| Latency (cloud) | < 1.5s | Acceptable |
| Session Length | Unlimited | Wispr killer |
| Crash Recovery | 100% | Never lose words |
| Mobile-Desktop Parity | 95% | One codebase |

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           WINDY PRO ECOSYSTEM                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐     ┌──────────────────────┐                  │
│  │   WINDY LOCAL        │     │    WINDY CLOUD       │                  │
│  │   (Desktop App)      │     │    (Web + Mobile)    │                  │
│  │                      │     │                      │                  │
│  │  ┌────────────────┐  │     │  ┌────────────────┐  │                  │
│  │  │ Electron Shell │  │     │  │ React PWA      │  │                  │
│  │  │ + Tailwind CSS │  │     │  │ + Tailwind CSS │  │                  │
│  │  └───────┬────────┘  │     │  └───────┬────────┘  │                  │
│  │          │           │     │          │           │                  │
│  │  ┌───────▼────────┐  │     │  ┌───────▼────────┐  │                  │
│  │  │ Local Python   │  │     │  │ WebSocket      │  │                  │
│  │  │ Engine         │  │     │  │ Client         │  │                  │
│  │  │ (faster-whisper│  │     │  └───────┬────────┘  │                  │
│  │  └────────────────┘  │     │          │           │                  │
│  │                      │     │          │           │                  │
│  └──────────────────────┘     └──────────┼───────────┘                  │
│                                          │                               │
│                               ┌──────────▼───────────┐                  │
│                               │   WINDY CLOUD API    │                  │
│                               │   (Hostinger KVM4)   │                  │
│                               │                      │                  │
│                               │  ┌────────────────┐  │                  │
│                               │  │ Python Backend │  │                  │
│                               │  │ + FastAPI      │  │                  │
│                               │  │ + faster-whisper│ │                  │
│                               │  └───────┬────────┘  │                  │
│                               │          │           │                  │
│                               │  ┌───────▼────────┐  │                  │
│                               │  │ PostgreSQL     │  │                  │
│                               │  │ (User Data)    │  │                  │
│                               │  └────────────────┘  │                  │
│                               │                      │                  │
│                               └──────────────────────┘                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🧬 DNA CODONS — ATOMIC COMPONENTS

Each codon is the smallest unit of work. Build these correctly, the organism lives.

### STRAND A: CORE ENGINE (Python Backend)

#### A1: Transcription Engine
```
FILE: src/engine/transcriber.py
STATUS: ✅ COMPLETE (Phase 1.1)

CODONS:
├── A1.1 TranscriptionState enum ✅
│   ├── IDLE (gray)
│   ├── LISTENING (green strobe)
│   ├── BUFFERING (yellow)
│   ├── ERROR (red)
│   └── INJECTING (blue flash)
│
├── A1.2 TranscriptionSegment dataclass ✅
│   ├── text: str
│   ├── start_time: float
│   ├── end_time: float
│   ├── confidence: float
│   ├── is_partial: bool
│   └── words: List[dict]
│
├── A1.3 TranscriberConfig dataclass ✅
│   ├── model_size: tiny|base|small|medium|large-v3|large-v3-turbo
│   ├── device: auto|cpu|cuda
│   ├── compute_type: auto|int8|float16|float32
│   ├── language: str (default "en")
│   ├── vad_enabled: bool (default True)
│   ├── vad_threshold: float (default 0.5)
│   ├── temp_file_path: str (crash recovery)
│   ├── chunk_length_s: float (default 5.0)
│   └── beam_size: int (default 5)
│
├── A1.4 StreamingTranscriber class ✅
│   ├── __init__(config)
│   ├── load_model() -> bool
│   ├── start_session()
│   ├── stop_session() -> str
│   ├── feed_audio(bytes)
│   ├── on_state_change(callback)
│   ├── on_transcript(callback)
│   ├── get_session_file() -> Path
│   └── get_full_transcript() -> str
│
└── A1.5 Crash Recovery ✅
    ├── Write to temp file on EVERY segment
    ├── fsync() to force disk write
    └── Recovery file: ~/windy_session.txt
```

#### A2: Audio Capture
```
FILE: src/engine/audio_capture.py
STATUS: ✅ COMPLETE (Phase 1.1)

CODONS:
├── A2.1 AudioCapture class ✅
│   ├── SAMPLE_RATE = 16000 (Whisper expects 16kHz)
│   ├── CHANNELS = 1 (mono)
│   ├── DTYPE = int16 (16-bit PCM)
│   └── BLOCK_SIZE = 1600 (100ms chunks)
│
├── A2.2 Device Management ✅
│   ├── list_devices() -> List[dict]
│   └── select_device(index: int)
│
├── A2.3 Callbacks ✅
│   ├── on_audio(callback) — raw bytes
│   └── on_level(callback) — 0.0-1.0 for UI meter
│
└── A2.4 Lifecycle ✅
    ├── start() -> bool
    ├── stop()
    └── is_running() -> bool
```

#### A3: WebSocket Server
```
FILE: src/engine/server.py
STATUS: ✅ COMPLETE (Phase 1.1)

CODONS:
├── A3.1 WindyServer class ✅
│   ├── host: str (default "127.0.0.1")
│   ├── port: int (default 9876)
│   └── clients: Set[WebSocket]
│
├── A3.2 Message Protocol ✅
│   ├── INBOUND (from client):
│   │   ├── Binary → audio data
│   │   └── JSON → commands
│   │       ├── {"action": "start"}
│   │       ├── {"action": "stop"}
│   │       ├── {"action": "config", "config": {...}}
│   │       └── {"action": "ping", "timestamp": ...}
│   │
│   └── OUTBOUND (to client):
│       ├── {"type": "state", "state": "listening", "previous": "idle"}
│       ├── {"type": "transcript", "text": "...", "partial": false, ...}
│       ├── {"type": "ack", "action": "...", "success": true}
│       ├── {"type": "pong", "timestamp": ...}
│       └── {"type": "error", "message": "..."}
│
└── A3.3 Lifecycle ✅
    ├── start(config) -> bool
    └── stop()
```

#### A4: Cloud API Server
```
FILE: src/api/main.py
STATUS: 🔲 NOT STARTED (Phase 2)

CODONS:
├── A4.1 FastAPI Application
│   ├── /health — health check
│   ├── /ws/transcribe — WebSocket endpoint
│   ├── /api/auth/register — user registration
│   ├── /api/auth/login — JWT tokens
│   └── /api/vault — prompt history CRUD
│
├── A4.2 Authentication
│   ├── JWT tokens (access + refresh)
│   ├── API key for CLI/automated use
│   └── Rate limiting per user
│
├── A4.3 Audio Handling
│   ├── Opus decoding (from client)
│   ├── Queue management (multiple clients)
│   └── Concurrency limiting (3-5 per KVM4)
│
└── A4.4 Prompt Vault
    ├── PostgreSQL storage
    ├── User-scoped transcripts
    ├── Search by date/keyword
    └── Export to TXT/MD
```

### STRAND B: DESKTOP CLIENT (Electron + Tailwind)

#### B1: Electron Shell
```
FILE: src/client/desktop/main.js
STATUS: 🔲 NOT STARTED (Phase 1.2)

CODONS:
├── B1.1 Main Process
│   ├── Create BrowserWindow (floating, frameless)
│   ├── System tray integration
│   ├── Global hotkey registration
│   ├── Auto-updater
│   └── IPC handlers
│
├── B1.2 Window Properties
│   ├── alwaysOnTop: true
│   ├── frame: false (custom title bar)
│   ├── transparent: true (for strobe effect)
│   ├── resizable: true (min 200x100)
│   └── skipTaskbar: false
│
├── B1.3 Tray Menu
│   ├── Show/Hide window
│   ├── Start/Stop recording
│   ├── Settings
│   ├── Open Vault
│   └── Quit
│
└── B1.4 Global Hotkeys
    ├── Toggle recording: Ctrl+Shift+Space (configurable)
    ├── Paste transcript: Ctrl+Shift+V (configurable)
    └── Show/Hide: Ctrl+Shift+W (configurable)
```

#### B2: Renderer (React + Tailwind)
```
FILE: src/client/desktop/renderer/
STATUS: 🔲 NOT STARTED (Phase 1.2)

CODONS:
├── B2.1 Component: FloatingWindow
│   ├── Draggable header
│   ├── State indicator (color)
│   ├── Transcript display
│   ├── Control buttons
│   └── Settings gear
│
├── B2.2 Component: StateIndicator
│   ├── CSS animation: strobe effect
│   ├── Colors: gray/green/yellow/red/blue
│   ├── Pulse rate: 1Hz for listening
│   └── Accessibility: aria-live region
│
├── B2.3 Component: TranscriptView
│   ├── Auto-scroll to bottom
│   ├── Partial text styling (italics)
│   ├── Word-level highlighting (optional)
│   └── Copy button per segment
│
├── B2.4 Component: ControlBar
│   ├── Start/Stop button
│   ├── Clear button
│   ├── Paste button
│   └── Expand/Collapse toggle
│
└── B2.5 State Management
    ├── WebSocket connection state
    ├── Transcription state (from server)
    ├── Transcript history (current session)
    └── User preferences
```

#### B3: Cursor Injection
```
FILE: src/client/desktop/injection/
STATUS: 🔲 NOT STARTED (Phase 1.3)

CODONS:
├── B3.1 Windows Implementation
│   ├── Use node-ffi or native addon
│   ├── SendInput API for keystrokes
│   ├── Simulate Ctrl+V paste
│   └── Clipboard manipulation
│
├── B3.2 macOS Implementation
│   ├── Accessibility API (AXClient)
│   ├── CGEventCreateKeyboardEvent
│   ├── Paste simulation
│   └── Permission request flow
│
├── B3.3 Linux Implementation
│   ├── xdotool or ydotool
│   ├── X11/Wayland detection
│   └── Fallback: clipboard only
│
└── B3.4 Injection Flow
    ├── User triggers paste (hotkey or button)
    ├── Get current transcript
    ├── Copy to clipboard
    ├── Simulate Ctrl+V / Cmd+V
    └── Flash blue state indicator
```

#### B4: TurboTax Installer
```
FILE: installer/
STATUS: 🔲 NOT STARTED (Phase 1.4)

CODONS:
├── B4.1 Hardware Detection
│   ├── Check NVIDIA GPU (nvidia-smi)
│   ├── Check AMD GPU (rocm-smi)
│   ├── Check Apple Silicon (sysctl)
│   ├── Check available RAM
│   ├── Check available disk space
│   └── Generate hardware profile
│
├── B4.2 Model Selection Logic
│   │
│   │  IF NVIDIA GPU with ≥6GB VRAM:
│   │      → Install CUDA + large-v3-turbo (float16)
│   │
│   │  ELSE IF Apple Silicon:
│   │      → Install MLX + large-v3-turbo (Metal)
│   │
│   │  ELSE IF RAM ≥ 16GB:
│   │      → Install CPU + medium (int8)
│   │
│   │  ELSE IF RAM ≥ 8GB:
│   │      → Install CPU + small (int8)
│   │
│   │  ELSE IF RAM ≥ 4GB:
│   │      → Install CPU + base (int8)
│   │
│   │  ELSE:
│   │      → Recommend Cloud mode
│   │
│   └── Display recommendation with "Why" explanation
│
├── B4.3 Dependency Installation
│   ├── Bundle Python 3.11 (pyinstaller or embedded)
│   ├── Install faster-whisper + deps
│   ├── Download selected model (~1-3GB)
│   ├── Progress bar with ETA
│   └── Verify installation
│
├── B4.4 Permission Requests
│   ├── Windows: Run as admin for path
│   ├── macOS: Accessibility permission
│   ├── macOS: Microphone permission
│   └── Guide user with screenshots
│
├── B4.5 Installer UI
│   ├── Welcome screen
│   ├── Hardware scan (animated)
│   ├── Model recommendation
│   ├── Download progress
│   ├── Permission setup
│   └── "You're ready!" screen
│
└── B4.6 Packaging
    ├── Windows: NSIS or Electron Builder
    ├── macOS: DMG with drag-to-Applications
    └── Linux: AppImage + .deb + .rpm
```

### STRAND C: WEB/MOBILE CLIENT (React PWA + Tailwind)

#### C1: Progressive Web App
```
FILE: src/client/web/
STATUS: 🔲 NOT STARTED (Phase 2.3)

CODONS:
├── C1.1 React Application
│   ├── Vite build system
│   ├── Tailwind CSS
│   ├── Mobile-first responsive
│   └── Service worker for offline
│
├── C1.2 Shared Components (with Desktop)
│   ├── StateIndicator
│   ├── TranscriptView
│   ├── ControlBar
│   └── SettingsPanel
│
├── C1.3 Audio Capture (Web)
│   ├── MediaRecorder API
│   ├── Opus encoding
│   ├── WebSocket streaming
│   └── Permission handling
│
├── C1.4 PWA Features
│   ├── manifest.json
│   ├── Service worker
│   ├── Install prompt
│   └── Offline transcript access
│
└── C1.5 Responsive Breakpoints
    ├── Mobile: < 640px (full-screen mode)
    ├── Tablet: 640-1024px (floating panel)
    └── Desktop: > 1024px (side panel)
```

### STRAND D: INFRASTRUCTURE

#### D1: Cloud Deployment
```
FILE: deploy/
STATUS: 🔲 NOT STARTED (Phase 2)

CODONS:
├── D1.1 Docker Configuration
│   ├── Dockerfile.api (FastAPI + faster-whisper)
│   ├── Dockerfile.web (Nginx + React build)
│   └── docker-compose.yml
│
├── D1.2 Hostinger KVM4 Setup
│   ├── Ubuntu 22.04 LTS
│   ├── Docker + Docker Compose
│   ├── Nginx reverse proxy
│   ├── Let's Encrypt SSL
│   └── UFW firewall rules
│
├── D1.3 Database
│   ├── PostgreSQL 15
│   ├── User table
│   ├── Transcript table
│   └── Session table
│
├── D1.4 Monitoring
│   ├── Health check endpoint
│   ├── Prometheus metrics
│   ├── Log aggregation
│   └── Alerting (email/Discord)
│
└── D1.5 Scaling Strategy
    ├── Single KVM4: 3-5 concurrent streams
    ├── Horizontal: Add more KVM4s behind load balancer
    └── BYOVPS: Users bring own VPS for Pro tier
```

#### D2: Domain & Branding
```
STATUS: 🔲 NOT STARTED

CODONS:
├── D2.1 Domain
│   ├── windypro.com (primary)
│   ├── windypro.app (alternate)
│   └── DNS: Cloudflare
│
├── D2.2 Branding
│   ├── Logo: Wind swirl + microphone
│   ├── Colors: Green (#22C55E), Gray (#374151), White
│   ├── Font: Inter (clean, modern)
│   └── Tagline: "The Green Strobe Never Lies"
│
└── D2.3 Landing Page
    ├── Hero: "Voice-to-Text That Never Stops"
    ├── Comparison table vs Wispr Flow
    ├── Demo video (green strobe in action)
    ├── Download buttons
    └── Pricing
```

---

## 📅 PHASE TIMELINE

### Phase 1: Desktop MVP (Weeks 1-4)
```
WEEK 1:
├── [x] A1: Transcription Engine ✅
├── [x] A2: Audio Capture ✅
├── [x] A3: WebSocket Server ✅
├── [ ] B1: Electron Shell
└── [ ] B2.1-B2.2: FloatingWindow + StateIndicator

WEEK 2:
├── [ ] B2.3-B2.5: TranscriptView + ControlBar + State
├── [ ] B3.1: Windows Cursor Injection
└── [ ] B3.2: macOS Cursor Injection

WEEK 3:
├── [ ] B4.1-B4.3: Hardware Detection + Model Selection + Deps
├── [ ] B4.4: Permission Requests
└── [ ] B4.5: Installer UI

WEEK 4:
├── [ ] B4.6: Packaging (NSIS, DMG, AppImage)
├── [ ] Testing: End-to-end on Win/Mac/Linux
└── [ ] Documentation: User guide
```

### Phase 2: Cloud Backend (Weeks 5-6)
```
WEEK 5:
├── [ ] A4.1-A4.2: FastAPI + Auth
├── [ ] A4.3: Audio Handling
├── [ ] D1.1: Docker Configuration
└── [ ] D1.2: Hostinger Setup

WEEK 6:
├── [ ] A4.4: Prompt Vault
├── [ ] D1.3: Database Setup
├── [ ] D1.4: Monitoring
└── [ ] C1.3: Web Audio Capture
```

### Phase 3: Web/Mobile Client (Weeks 7-8)
```
WEEK 7:
├── [ ] C1.1-C1.2: React App + Shared Components
├── [ ] C1.4: PWA Features
└── [ ] D2: Domain + Branding

WEEK 8:
├── [ ] C1.5: Responsive Polish
├── [ ] Landing Page
├── [ ] Beta Launch
└── [ ] Feedback Collection
```

---

## 🔬 GAP ANALYSIS TEMPLATE

Use this template for each gap analysis session:

```markdown
## Gap Analysis — [DATE]

### Strand A (Engine)
| Codon | Status | Gap | Action Required |
|-------|--------|-----|-----------------|
| A1.1 | ✅ | None | — |
| A1.2 | ✅ | None | — |
| ... | | | |

### Strand B (Desktop)
| Codon | Status | Gap | Action Required |
|-------|--------|-----|-----------------|
| B1.1 | 🔲 | Not started | Create main.js |
| ... | | | |

### Strand C (Web)
| Codon | Status | Gap | Action Required |
|-------|--------|-----|-----------------|
| C1.1 | 🔲 | Not started | Initialize Vite project |
| ... | | | |

### Strand D (Infrastructure)
| Codon | Status | Gap | Action Required |
|-------|--------|-----|-----------------|
| D1.1 | 🔲 | Not started | Write Dockerfiles |
| ... | | | |

### Priority Actions (Top 3)
1. [Most critical gap]
2. [Second critical]
3. [Third critical]
```

---

## 🧪 TESTING REQUIREMENTS

### Unit Tests (Per Codon)
```
Each codon MUST have:
├── At least 2 test cases
├── Happy path test
├── Error handling test
└── Edge case test (if applicable)
```

### Integration Tests
```
├── Engine → Server: Audio flows, transcripts return
├── Server → Client: WebSocket messages correct
├── Client → Injection: Text pastes to target app
└── Installer → Engine: Model loads and runs
```

### End-to-End Tests
```
├── Fresh install on clean Windows VM
├── Fresh install on clean macOS VM
├── Fresh install on clean Ubuntu VM
├── Cloud signup → transcription → vault save
└── Mobile PWA: record → transcribe → copy
```

---

## 📊 METRICS & MONITORING

### User-Facing Metrics
```
├── Time to first transcription
├── Transcription latency (p50, p95, p99)
├── Session length distribution
├── Crash rate
└── NPS (Net Promoter Score)
```

### System Metrics
```
├── CPU utilization per stream
├── Memory usage per model
├── WebSocket connection stability
├── API response times
└── Error rates by type
```

---

## 🚨 CRITICAL INVARIANTS

**These must NEVER be violated:**

1. **If green strobe is on, audio is being captured.** No exceptions.
2. **Every segment is written to temp file before callback.** Crash recovery is non-negotiable.
3. **No terminal commands for end users.** Ever. TurboTax or nothing.
4. **One codebase for mobile and desktop web.** Tailwind responsive, not separate apps.
5. **Local mode works 100% offline.** No network required after install.

---

## 🎯 DEFINITION OF DONE

A codon is DONE when:
- [ ] Code is written and linted
- [ ] Unit tests pass
- [ ] Integration with adjacent codons verified
- [ ] Documented in code comments
- [ ] Added to this DNA plan with ✅

A strand is DONE when:
- [ ] All codons are ✅
- [ ] End-to-end test passes
- [ ] No critical bugs
- [ ] User documentation complete

The organism is DONE when:
- [ ] All strands are ✅
- [ ] Beta users confirm UX goals met
- [ ] Performance metrics hit targets
- [ ] Ready for public launch

---

## 📝 CHANGELOG

| Date | Author | Change |
|------|--------|--------|
| 2026-02-04 | Kit 0 | Initial DNA plan created |
| 2026-02-04 | Kit 0 | Strand A (A1-A3) marked complete |

---

*This document is the single source of truth for Windy Pro development.*
*Any Kit can read this, understand the vision, and execute.*
*Update this document as codons are completed.*

**The Green Strobe Never Lies. Neither does this plan.**
