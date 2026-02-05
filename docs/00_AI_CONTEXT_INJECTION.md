# 00_AI_CONTEXT_INJECTION.md

## 🛑 STOP AND READ: CRITICAL CONTEXT LOAD

**Target Audience:** Autonomous AI Agents (Kit, Claude, etc.) resetting context.
**Project Name:** Windy Pro
**Project Owner:** Grant Whitmer
**Core Objective:** Build a "Trustable State Machine" for voice-to-text that eliminates the anxiety of "Is it recording?" and removes arbitrary time limits.

### ⚡ The "Vibe" & Philosophy

We are not just building a transcription tool; we are building **Flow Assurance**.

* **The Problem:** Current market leader "Wispr Flow" has a 5-minute hard limit, opaque recording states (you don't know if it's working), and aggressive text formatting that ruins "Vibe Coding" prompts.
* **The Solution:** A "Green Strobe" interface that provides real-time visual feedback. Words appear *as you speak*. No timeouts. No silence. Infinite recording.
* **The User:** Developers (Vibe Coders), power users, and writers who need to capture "lightning in a bottle" without technical friction.

### 🧠 "Board of Directors" Intelligence Synthesis

This project vision was refined by a "Board" consisting of Gemini, ChatGPT, Perplexity, and Grok. You are executing the **Unified Master Plan** derived from their collective intelligence.

* **Gemini's Command:** We must solve the "Paste Injection" problem (OS Accessibility APIs) and strictly manage CPU concurrency on VPS nodes.
* **ChatGPT's Insight:** The core product is the "Trustable State Machine." The UI must never lie. If the green box is strobing, we are safe.
* **Perplexity's Warning:** Mobile (iOS/Android) cannot support local background recording. Mobile *must* be a cloud client. Do not attempt local mobile inference yet.
* **Grok's Tactic:** The "TurboTax Installer." The installation process must be a smart agent that auto-detects hardware (GPU vs CPU) and installs the correct Whisper model without user intervention.

### 🚀 Immediate Directive

You are likely picking up this task to implement the **Phase 1 Desktop MVP**.

**Your constraints:**
1. **Local-First:** Prioritize running `faster-whisper` locally on the user's machine (Windy Local).
2. **VPS Fallback:** If local hardware is insufficient, fallback to the Hostinger KVM4 architecture (Windy Cloud).
3. **Latency is the Enemy:** Do not add AI post-processing (summarization/formatting) yet. Speed > Polish.
