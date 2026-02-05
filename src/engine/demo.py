#!/usr/bin/env python3
"""
Windy Pro - Live Demo
Captures from microphone and transcribes in real-time.

Usage:
    python demo.py [--model base] [--device auto]
"""

import sys
import time
import argparse

# Add parent to path for imports
sys.path.insert(0, str(__file__).rsplit('/', 2)[0])

from engine.transcriber import StreamingTranscriber, TranscriberConfig, TranscriptionState
from engine.audio_capture import AudioCapture


def state_indicator(state: TranscriptionState) -> str:
    """Get visual indicator for state."""
    indicators = {
        TranscriptionState.IDLE: "⚪ IDLE",
        TranscriptionState.LISTENING: "🟢 LISTENING",
        TranscriptionState.BUFFERING: "🟡 PROCESSING",
        TranscriptionState.ERROR: "🔴 ERROR",
        TranscriptionState.INJECTING: "🔵 INJECTING",
    }
    return indicators.get(state, "❓ UNKNOWN")


def main():
    parser = argparse.ArgumentParser(description="Windy Pro Live Demo")
    parser.add_argument("--model", default="tiny", help="Model size (tiny/base/small/medium/large-v3)")
    parser.add_argument("--device", default="auto", help="Device (auto/cpu/cuda)")
    parser.add_argument("--language", default="en", help="Language code")
    args = parser.parse_args()
    
    print("=" * 60)
    print("  WINDY PRO - Real-Time Transcription Demo")
    print("=" * 60)
    print()
    
    # Configure
    config = TranscriberConfig(
        model_size=args.model,
        device=args.device,
        language=args.language,
        vad_enabled=True
    )
    
    # Initialize components
    transcriber = StreamingTranscriber(config)
    capture = AudioCapture()
    
    # State tracking
    current_state = [TranscriptionState.IDLE]
    transcript_lines = []
    
    def on_state_change(old, new):
        current_state[0] = new
        print(f"\r{state_indicator(new):<20}", end='', flush=True)
    
    def on_transcript(segment):
        text = segment.text.strip()
        if text:
            transcript_lines.append(text)
            print(f"\r{state_indicator(current_state[0]):<20} {text}")
    
    def on_level(level):
        # Visual audio level meter
        bars = int(level * 20)
        meter = '█' * bars + '░' * (20 - bars)
        print(f"\r{state_indicator(current_state[0]):<20} [{meter}]", end='', flush=True)
    
    # Register callbacks
    transcriber.on_state_change(on_state_change)
    transcriber.on_transcript(on_transcript)
    capture.on_audio(transcriber.feed_audio)
    capture.on_level(on_level)
    
    # List devices
    print("Available audio devices:")
    for dev in capture.list_devices():
        marker = "→" if dev['index'] == 0 else " "
        print(f"  {marker} [{dev['index']}] {dev['name']}")
    print()
    
    # Load model
    print(f"Loading model: {args.model} (this may take a moment)...")
    if not transcriber.load_model():
        print("❌ Failed to load model. Check dependencies.")
        return 1
    
    print(f"✅ Model loaded")
    print(f"📁 Session file: {transcriber.get_session_file()}")
    print()
    print("Press Ctrl+C to stop")
    print("-" * 60)
    
    # Start
    transcriber.start_session()
    if not capture.start():
        print("❌ Failed to start audio capture")
        return 1
    
    try:
        while True:
            time.sleep(0.1)
    except KeyboardInterrupt:
        pass
    finally:
        print("\n" + "-" * 60)
        capture.stop()
        final_text = transcriber.stop_session()
        
        print("\n📝 Full Transcript:")
        print(final_text or "(empty)")
        
        print(f"\n💾 Saved to: {transcriber.get_session_file()}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
