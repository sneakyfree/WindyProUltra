# 03_MASTER_ROADMAP.md

## Phase 1: The "TurboTax" Desktop MVP

*Goal: A working local app that replaces Wispr Flow for the Founder.*

* [ ] **Task 1.1:** Build the Python Wrapper for `faster-whisper`.
  * Must accept audio stream.
  * Must output partial tokens (real-time).
* [ ] **Task 1.2:** Build the Electron "Floating Window."
  * Implement "Always on Top."
  * Implement the "Green Strobe" visual state.
* [ ] **Task 1.3:** Implement "Cursor Injection."
  * Script the key-press simulation for Windows/Mac.
* [ ] **Task 1.4:** The Installer.
  * Create the logic to detect CPU vs GPU.

## Phase 2: The "Windy Cloud" Connector

*Goal: Enable the laptop to offload processing to the KVM4 VPS.*

* [ ] **Task 2.1:** Dockerize the Python Wrapper from Phase 1.
* [ ] **Task 2.2:** Deploy to Hostinger KVM4.
* [ ] **Task 2.3:** Update Electron Client to allow "Server URL" configuration.
* [ ] **Task 2.4:** Implement Opus audio compression (to reduce bandwidth/latency to the VPS).

## Phase 3: The "Kit" Integration & Features

*Goal: Add value beyond raw transcription.*

* [ ] **Task 3.1:** The "Prompt Vault."
  * Local SQLite database storing all past dictations.
* [ ] **Task 3.2:** "Vibe Toggle."
  * Option to pass the raw transcript through a tiny local LLM (e.g., Llama-3-8b-Quantized) to fix grammar *only if requested*.
* [ ] **Task 3.3:** Mobile Client (Web App).
  * A simple PWA (Progressive Web App) that records audio and sends it to the VPS.
