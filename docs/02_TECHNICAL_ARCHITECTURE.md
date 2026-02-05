# 02_TECHNICAL_ARCHITECTURE.md

## 1. Technology Stack

### Client Side (The "App")

* **Framework:** **Electron** (or Tauri) for cross-platform desktop.
* **Audio Capture:** `portaudio` or native OS streams.
* **Injection Mechanism:**
  * *Windows:* Win32 API (`SendInput`) to inject text at cursor.
  * *MacOS:* Accessibility API (AXClient) to inject text.
* **Visuals:** WebSockets for real-time text streaming from the backend (even if backend is `localhost`).

### Engine Side (The "Brain")

* **Core Model:** **Faster-Whisper** (CTranslate2 implementation).
* **Quantization:** `int8` for CPU-only fallback; `float16` for GPU.
* **VAD (Voice Activity Detection):** Silero VAD (to prevent processing silence).

### Infrastructure (Windy Cloud Mode)

* **Provider:** Hostinger KVM4 (Reference Architecture).
* **Specs:** 4 vCPU, 16GB RAM, NVMe SSD.
* **OS:** Ubuntu 22.04 LTS (Headless).
* **Deployment:** Docker Compose (containing Faster-Whisper server + Nginx + Auth).

## 2. Operating Modes

### Mode A: Windy Local (Priority)

* **Architecture:** The Electron app spawns a Python subprocess running `faster-whisper`.
* **Latency:** Near zero.
* **Cost:** $0.
* **Challenge:** Packaging the Python environment (PyInstaller) to be "click-and-run."

### Mode B: Windy Cloud (Fallback/Mobile)

* **Architecture:** The Electron app captures audio -> Opus Encodes -> Streams via WebSocket -> VPS.
* **VPS:** Decodes Opus -> Runs Whisper -> Streams Text Tokens back to Client.
* **Auth:** Simple API Key authentication (to prevent unauthorized usage of the user's VPS).

## 3. Critical Technical Challenges to Solve

1. **OS Permissions:** The app requires aggressive permissions to "paste" into other apps (VS Code, Chrome, etc.). The installer must guide the user through granting these permissions (Accessibility Access).
2. **Audio "Dumping":** We need a "Buffer Safety Net." If the user talks for 20 minutes, we cannot rely on the system clipboard alone. We must write to a local `current_session.txt` file in real-time.
