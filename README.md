# Windy Pro Ultra

**Built with Gemini Ultra** (compare to WindyPro built with Opus 4.5)

---

# Original Windy Pro

**Real-time voice-to-text with a trustable state machine.**

> "The Green Strobe Never Lies."

## What is Windy Pro?

A local-first voice-to-text platform that eliminates the anxiety of "Is it recording?" with clear visual feedback and no arbitrary time limits.

### Key Differentiators vs Wispr Flow

| Feature | Wispr Flow | Windy Pro |
|---------|------------|-----------|
| Session Limit | ~5 minutes | **Unlimited** |
| Feedback | Opaque | **Real-time Green Strobe** |
| Privacy | Cloud only | **Local-first** |
| Output | Polished | **Raw/Verbatim** (perfect for LLM prompts) |
| Cost | ~$17/mo | **Free (local) / $5 (cloud)** |

## Quick Start

### Prerequisites

- Python 3.10+
- CUDA 11.7+ (for GPU acceleration, optional)

### Installation

```bash
# Clone and enter directory
cd windy-pro

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Download a model (happens automatically on first run)
```

### Run the Demo

```bash
# Quick test with tiny model
python src/engine/demo.py --model tiny

# Better accuracy with base model
python src/engine/demo.py --model base

# Best accuracy (requires more RAM/VRAM)
python src/engine/demo.py --model large-v3-turbo
```

### Run the WebSocket Server (for Electron client)

```bash
python -m src.engine.server --model base --port 9876
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Client (Future)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Green Strobe│  │ Text Display │  │ Cursor Injection   │  │
│  └──────┬──────┘  └──────┬───────┘  └─────────┬──────────┘  │
│         │                │                    │              │
│         └────────────────┴────────────────────┘              │
│                          │                                   │
│                   WebSocket Connection                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                    Python Backend                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │Audio Capture│→ │ Transcriber  │→ │  WebSocket Server  │  │
│  │(Microphone) │  │(faster-whis) │  │   (JSON/Binary)    │  │
│  └─────────────┘  └──────┬───────┘  └────────────────────┘  │
│                          │                                   │
│                  ┌───────┴────────┐                         │
│                  │  Temp File     │  (Crash Recovery)       │
│                  │ session.txt    │                         │
│                  └────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## State Machine

The core of Windy Pro's UX is the **Trustable State Machine**:

```
┌─────────────┐
│   IDLE      │ ← Gray, not recording
└──────┬──────┘
       │ User presses hotkey
       ▼
┌─────────────┐
│  LISTENING  │ ← GREEN STROBE (you are safe)
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

**Rule:** If the Green Strobe is on, your words are being captured. Period.

## Project Structure

```
windy-pro/
├── README.md
├── requirements.txt
├── src/
│   ├── engine/           # Python backend
│   │   ├── transcriber.py    # Core transcription engine
│   │   ├── audio_capture.py  # Microphone input
│   │   ├── server.py         # WebSocket server
│   │   └── demo.py           # CLI demo
│   └── client/           # Electron frontend (Phase 1.2)
└── docs/
    ├── 00_AI_CONTEXT_INJECTION.md
    ├── 01_VISION_AND_STRATEGY.md
    ├── 02_TECHNICAL_ARCHITECTURE.md
    ├── 03_MASTER_ROADMAP.md
    └── 04_BOARD_SYNTHESIS_ANALYSIS.md
```

## Roadmap

### Phase 1: Desktop MVP ✅ In Progress
- [x] Python wrapper for faster-whisper
- [x] Streaming partial tokens
- [x] Crash recovery (temp file)
- [x] WebSocket server
- [ ] Electron floating window
- [ ] Cursor injection
- [ ] TurboTax installer

### Phase 2: Windy Cloud
- [ ] Dockerize backend
- [ ] Deploy to VPS
- [ ] Opus audio compression
- [ ] API key authentication

### Phase 3: Ecosystem
- [ ] Prompt Vault (history)
- [ ] VS Code extension
- [ ] Mobile PWA

## License

MIT

---

*Built with the collective wisdom of Gemini, ChatGPT, Perplexity, and Grok.*
*Executed by Kit 0.*
