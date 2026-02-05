# 01_VISION_AND_STRATEGY.md

## 1. The Core Vision

To democratize high-fidelity, infinite-duration voice-to-text through a "Dummy-Proof" interface that allows users to choose between **Windy Local** (running on their own hardware for privacy) or **Windy Cloud** (running on a private VPS).

**The Mantra:** "The Green Strobe Never Lies."

## 2. The "Wispr Flow" Gap Analysis

Wispr Flow is the incumbent. Windy Pro is the disruptor.

| Feature | Wispr Flow (Incumbent) | Windy Pro (Our Solution) |
| :--- | :--- | :--- |
| **Session Limit** | ~5 Minutes (Hard Reset) | **Infinite / Unlimited** |
| **Feedback Loop** | Opaque (Black Box) | **Real-Time Streaming** (Text appears instantly) |
| **Confidence** | Low ("Did it catch that?") | **High** (Visual "Green Strobe" & raw text stream) |
| **Privacy** | Cloud Only | **Local-First** OR **Private VPS** |
| **Output Style** | Highly Polished (Bad for coding) | **Raw / Verbatim** (Perfect for LLM prompting) |
| **Cost** | ~$17/mo | **Free (Local) / ~$5/mo (Cloud)** |

## 3. The "Board of Directors" Strategic Synthesis

We analyzed input from four major LLMs. Here are the strategic pillars derived from that session:

### A. The "Trustable State Machine" (ChatGPT)

The user's anxiety comes from not knowing if the tool is recording.

* **Requirement:** A floating window that *always* stays on top.
* **Visuals:** It blinks Green when capturing. It turns Red/Yellow if the websocket drops.
* **Safety:** Text is streamed to a local temp file instantly. If the app crashes, the text is saved.

### B. The "TurboTax" Experience (Grok)

The barrier to entry for local LLMs is "Python Hell" (terminal commands, dependencies).

* **Requirement:** An "Agent-Inside" installer.
* **Behavior:** The installer scans the user's hardware.
  * *Has NVIDIA GPU?* -> Installs CUDA version of Faster-Whisper.
  * *Mac M-Series?* -> Installs CoreML/Metal optimized version.
  * *Potato Laptop?* -> Defaults to Windy Cloud Mode (VPS).

### C. The Mobile Reality Check (Perplexity)

We cannot build a "Local" mobile app that runs in the background due to OS constraints.

* **Strategy:** Mobile is strictly a **Client** that streams audio to the user's VPS instance. We will not waste cycles trying to run Whisper locally on an iPhone background process.

### D. The Concurrency Math (Gemini)

* **Hardware:** Hostinger KVM4 (4 vCPU, 16GB RAM).
* **Capacity:** Supports ~3-5 simultaneous active streams.
* **Scaling:** We cannot put 100 users on one KVM4. We must use a load balancer or force users to "Bring Your Own VPS" for the Pro tier.
