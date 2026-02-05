# 05_OSS_RESEARCH.md
## Open Source Whisper Apps Analysis

**Research Date:** 2026-02-04
**Purpose:** Understand existing solutions before building Windy Pro (per Grok's recommendation)

---

## 🏆 Top Projects to Study

### 1. Buzz (⭐ 17,693)
**Repo:** https://github.com/chidiwilliams/buzz
**License:** MIT

**What it is:**
- Full-featured desktop app for transcription/translation
- Cross-platform: macOS, Windows, Linux (Flatpak/Snap)
- Offline, local-first

**Key Features:**
- ✅ Live realtime audio transcription from microphone
- ✅ Multiple Whisper backend support
- ✅ CUDA acceleration for Nvidia GPUs
- ✅ Apple Silicon support
- ✅ Vulkan acceleration for Whisper.cpp (including integrated GPUs)
- ✅ Export to TXT, SRT, VTT
- ✅ Watch folder for automatic transcription
- ✅ CLI for scripting
- ✅ Speaker identification
- ✅ Speech separation (noisy audio)

**What Windy Pro can learn:**
- Packaging approach (DMG, EXE, Flatpak, Snap)
- Multi-backend support architecture
- Hardware detection for GPU acceleration

**What Windy Pro does differently:**
- Buzz is file-focused; Windy Pro is live-dictation-focused
- Buzz doesn't have the "trustable state machine" UX
- Buzz doesn't have cursor injection / paste-anywhere
- No "Green Strobe" confidence indicator

---

### 2. whisper_streaming (⭐ 3,526)
**Repo:** https://github.com/ufal/whisper_streaming
**License:** MIT

**What it is:**
- Real-time streaming for long speech-to-text
- Academic project from Charles University (Prague)
- Published paper: "Turning Whisper into Real-Time Transcription System"

**Key Technical Insights:**
- Uses "local agreement policy with self-adaptive latency"
- Achieves **3.3 seconds latency** on long-form speech
- Explicitly recommends **faster-whisper with GPU**
- VAD (Voice Activity Detection) is "optional but very recommended"

**Backend Support:**
1. **faster-whisper** (recommended) - requires CUDNN 8.5.0, CUDA 11.7
2. **whisper-timestamped** - slower but less restrictive
3. **OpenAI Whisper API** - fast, no GPU needed, pay-per-use
4. **Whisper MLX** - optimized for Apple Silicon (M1/M2)

**What Windy Pro can learn:**
- Streaming architecture patterns
- Local agreement policy for real-time output
- Multi-backend abstraction

**⚠️ IMPORTANT:** Being replaced by SimulStreaming in 2025

---

### 3. SimulStreaming (⭐ 472)
**Repo:** https://github.com/ufal/SimulStreaming
**Status:** New replacement for whisper_streaming

**What Windy Pro should do:**
- Start with whisper_streaming patterns (better documented, more mature)
- Keep eye on SimulStreaming for future migration

---

## 🔧 Technical Takeaways for Windy Pro

### Backend Selection
```
Priority Order:
1. faster-whisper (CUDA) - best performance if GPU available
2. Whisper MLX - best for Apple Silicon
3. whisper.cpp (Vulkan) - fallback for misc GPUs
4. whisper-timestamped - CPU fallback
```

### Packaging Strategy (from Buzz)
- **macOS:** DMG installer
- **Windows:** EXE/MSI (unsigned = warning, but users accept)
- **Linux:** Flatpak (preferred) + Snap

### Dependencies
- `librosa`, `soundfile` - audio processing
- `torch`, `torchaudio` - VAD
- `faster-whisper` - main engine

### Model Selection
| Model | VRAM | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| tiny | ~1GB | Fastest | Low | Testing, weak hardware |
| base | ~1GB | Fast | Medium | Quick drafts |
| small | ~2GB | Medium | Good | Daily use |
| medium | ~5GB | Slow | Great | Accuracy needed |
| large-v3 | ~10GB | Slowest | Best | High-fidelity |
| large-v3-turbo | ~6GB | Fast | Great | **Best balance** |

---

## 🚫 What Doesn't Exist (Windy Pro's Opportunity)

1. **No "trustable state machine" UX** - No app explicitly shows recording state as primary feature
2. **No cursor injection built-in** - All apps output to file/window, not directly to cursor
3. **No "infinite session" marketing** - No one positions against Wispr Flow's 5-min limit
4. **No TurboTax installer** - All require some technical setup
5. **No real-time text streaming to floating window** - Buzz has it but not as primary mode

---

## 📋 Recommended Build Approach

### Phase 1: MVP (Don't Reinvent)
- Use **faster-whisper** as engine (proven, documented)
- Borrow streaming patterns from **whisper_streaming**
- Package like **Buzz** (DMG/EXE/Flatpak)

### Phase 1: Differentiate
- Build the state machine UX (Green Strobe)
- Add cursor injection (Win32/Accessibility)
- Real-time text to floating window
- Crash recovery (write to temp file)

### Future: Optimize
- Watch SimulStreaming for latency improvements
- Consider Whisper MLX for Apple-only optimizations
- Evaluate whisper.cpp Vulkan for broader GPU support

---

## 📚 Documentation Links

- Buzz docs: https://chidiwilliams.github.io/buzz/
- whisper_streaming paper: https://aclanthology.org/2023.ijcnlp-demo.3.pdf
- faster-whisper: https://github.com/guillaumekln/faster-whisper
- Whisper MLX: https://github.com/ml-explore/mlx-examples/tree/main/whisper
