"""
Windy Pro - Streaming Transcription Engine
Based on faster-whisper with real-time partial token output.

Core design principles:
1. Stream partial transcripts as they're recognized
2. Write to temp file continuously (crash recovery)
3. Use VAD to detect speech/silence
4. Support multiple backends (faster-whisper, whisper.cpp, MLX)
"""

import os
import sys
import time
import tempfile
import threading
import queue
from pathlib import Path
from dataclasses import dataclass, field
from typing import Generator, Callable, Optional, List
from enum import Enum

# Optional imports with graceful fallback
try:
    from faster_whisper import WhisperModel
    FASTER_WHISPER_AVAILABLE = True
except ImportError:
    FASTER_WHISPER_AVAILABLE = False
    WhisperModel = None

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    np = None


class TranscriptionState(Enum):
    """State machine states for trustable UI feedback."""
    IDLE = "idle"           # Gray - not recording
    LISTENING = "listening" # Green strobe - actively capturing
    BUFFERING = "buffering" # Yellow - processing backlog
    ERROR = "error"         # Red - connection/processing error
    INJECTING = "injecting" # Blue flash - pasting to cursor


@dataclass
class TranscriptionSegment:
    """A segment of transcribed text with metadata."""
    text: str
    start_time: float
    end_time: float
    confidence: float = 1.0
    is_partial: bool = False  # True if this may be revised
    words: List[dict] = field(default_factory=list)


@dataclass
class TranscriberConfig:
    """Configuration for the transcription engine."""
    model_size: str = "base"  # tiny, base, small, medium, large-v3, large-v3-turbo
    device: str = "auto"      # auto, cpu, cuda
    compute_type: str = "auto"  # auto, int8, float16, float32
    language: str = "en"
    vad_enabled: bool = True
    vad_threshold: float = 0.5
    temp_file_path: Optional[str] = None  # For crash recovery
    chunk_length_s: float = 5.0  # Audio chunk length for processing
    beam_size: int = 5


class StreamingTranscriber:
    """
    Real-time streaming transcription engine.
    
    Design goals:
    - Partial tokens stream out as recognized
    - State machine for UI feedback (green strobe never lies)
    - Crash recovery via continuous temp file writes
    - Backend-agnostic (faster-whisper primary, others pluggable)
    """
    
    def __init__(self, config: TranscriberConfig = None):
        self.config = config or TranscriberConfig()
        self.model = None
        self.state = TranscriptionState.IDLE
        self._state_callbacks: List[Callable] = []
        self._transcript_callbacks: List[Callable] = []
        self._audio_queue = queue.Queue()
        self._running = False
        self._worker_thread = None
        
        # Crash recovery: temp file for continuous writes
        if self.config.temp_file_path:
            self._temp_file = Path(self.config.temp_file_path)
        else:
            self._temp_file = Path(tempfile.gettempdir()) / "windy_session.txt"
        
        # Accumulated transcript for the session
        self._full_transcript = []
        
    def _set_state(self, new_state: TranscriptionState):
        """Update state and notify callbacks."""
        if self.state != new_state:
            old_state = self.state
            self.state = new_state
            for callback in self._state_callbacks:
                try:
                    callback(old_state, new_state)
                except Exception as e:
                    print(f"State callback error: {e}", file=sys.stderr)
    
    def on_state_change(self, callback: Callable):
        """Register a callback for state changes."""
        self._state_callbacks.append(callback)
        
    def on_transcript(self, callback: Callable):
        """Register a callback for new transcript segments."""
        self._transcript_callbacks.append(callback)
    
    def _emit_segment(self, segment: TranscriptionSegment):
        """Emit a transcript segment to callbacks and temp file."""
        # Always write to temp file first (crash recovery)
        self._write_to_temp(segment)
        
        # Track full transcript
        if not segment.is_partial:
            self._full_transcript.append(segment)
        
        # Notify callbacks
        for callback in self._transcript_callbacks:
            try:
                callback(segment)
            except Exception as e:
                print(f"Transcript callback error: {e}", file=sys.stderr)
    
    def _write_to_temp(self, segment: TranscriptionSegment):
        """Write segment to temp file for crash recovery."""
        try:
            mode = "a" if self._temp_file.exists() else "w"
            with open(self._temp_file, mode, encoding="utf-8") as f:
                prefix = "[partial] " if segment.is_partial else ""
                f.write(f"{prefix}{segment.text}\n")
                f.flush()
                os.fsync(f.fileno())  # Force write to disk
        except Exception as e:
            print(f"Temp file write error: {e}", file=sys.stderr)
    
    def load_model(self) -> bool:
        """Load the Whisper model based on config."""
        if not FASTER_WHISPER_AVAILABLE:
            print("faster-whisper not installed. Run: pip install faster-whisper", 
                  file=sys.stderr)
            return False
        
        try:
            self._set_state(TranscriptionState.BUFFERING)
            
            # Auto-detect device
            device = self.config.device
            if device == "auto":
                try:
                    import torch
                    device = "cuda" if torch.cuda.is_available() else "cpu"
                except ImportError:
                    device = "cpu"
            
            # Auto-detect compute type
            compute_type = self.config.compute_type
            if compute_type == "auto":
                compute_type = "float16" if device == "cuda" else "int8"
            
            print(f"Loading model: {self.config.model_size} on {device} ({compute_type})")
            
            self.model = WhisperModel(
                self.config.model_size,
                device=device,
                compute_type=compute_type
            )
            
            self._set_state(TranscriptionState.IDLE)
            print(f"Model loaded successfully")
            return True
            
        except Exception as e:
            self._set_state(TranscriptionState.ERROR)
            print(f"Failed to load model: {e}", file=sys.stderr)
            return False
    
    def start_session(self):
        """Start a new transcription session."""
        if self._running:
            return
        
        # Clear temp file for new session
        try:
            self._temp_file.unlink(missing_ok=True)
        except:
            pass
        
        self._full_transcript = []
        self._running = True
        self._worker_thread = threading.Thread(target=self._process_audio_loop)
        self._worker_thread.daemon = True
        self._worker_thread.start()
        self._set_state(TranscriptionState.LISTENING)
    
    def stop_session(self) -> str:
        """Stop the session and return full transcript."""
        self._running = False
        self._set_state(TranscriptionState.IDLE)
        
        if self._worker_thread:
            self._worker_thread.join(timeout=2.0)
            self._worker_thread = None
        
        # Return accumulated transcript
        return " ".join(seg.text for seg in self._full_transcript)
    
    def feed_audio(self, audio_chunk: bytes):
        """Feed audio data to the transcriber."""
        if self._running:
            self._audio_queue.put(audio_chunk)
    
    def _process_audio_loop(self):
        """Background thread for processing audio chunks."""
        audio_buffer = b""
        
        while self._running:
            try:
                # Get audio from queue with timeout
                try:
                    chunk = self._audio_queue.get(timeout=0.1)
                    audio_buffer += chunk
                except queue.Empty:
                    continue
                
                # Process when we have enough audio
                # (16kHz * 2 bytes * chunk_length_s)
                min_buffer_size = int(16000 * 2 * self.config.chunk_length_s)
                
                if len(audio_buffer) >= min_buffer_size:
                    self._set_state(TranscriptionState.BUFFERING)
                    self._process_chunk(audio_buffer)
                    audio_buffer = b""
                    self._set_state(TranscriptionState.LISTENING)
                    
            except Exception as e:
                self._set_state(TranscriptionState.ERROR)
                print(f"Processing error: {e}", file=sys.stderr)
                time.sleep(0.5)
                self._set_state(TranscriptionState.LISTENING)
    
    def _process_chunk(self, audio_data: bytes):
        """Process a chunk of audio and emit segments."""
        if not self.model or not NUMPY_AVAILABLE:
            return
        
        try:
            # Convert bytes to numpy array (assuming 16-bit PCM, 16kHz mono)
            audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
            
            # Transcribe with word-level timestamps
            segments, info = self.model.transcribe(
                audio_np,
                language=self.config.language,
                beam_size=self.config.beam_size,
                word_timestamps=True,
                vad_filter=self.config.vad_enabled,
                vad_parameters=dict(threshold=self.config.vad_threshold)
            )
            
            # Emit each segment
            for segment in segments:
                ts = TranscriptionSegment(
                    text=segment.text.strip(),
                    start_time=segment.start,
                    end_time=segment.end,
                    confidence=getattr(segment, 'avg_logprob', 0.0),
                    is_partial=False,
                    words=[
                        {"word": w.word, "start": w.start, "end": w.end, "prob": w.probability}
                        for w in (segment.words or [])
                    ]
                )
                if ts.text:
                    self._emit_segment(ts)
                    
        except Exception as e:
            print(f"Transcription error: {e}", file=sys.stderr)
    
    def get_session_file(self) -> Path:
        """Get path to the crash-recovery temp file."""
        return self._temp_file
    
    def get_full_transcript(self) -> str:
        """Get the full transcript from this session."""
        return " ".join(seg.text for seg in self._full_transcript)


# Example usage and testing
if __name__ == "__main__":
    print("Windy Pro Transcription Engine")
    print("=" * 40)
    
    # Check dependencies
    print(f"faster-whisper: {'✓' if FASTER_WHISPER_AVAILABLE else '✗ (pip install faster-whisper)'}")
    print(f"numpy: {'✓' if NUMPY_AVAILABLE else '✗ (pip install numpy)'}")
    
    if not FASTER_WHISPER_AVAILABLE:
        print("\nInstall dependencies:")
        print("  pip install faster-whisper numpy")
        sys.exit(1)
    
    # Demo config
    config = TranscriberConfig(
        model_size="tiny",  # Use tiny for quick testing
        device="auto",
        vad_enabled=True
    )
    
    transcriber = StreamingTranscriber(config)
    
    # Register callbacks
    transcriber.on_state_change(
        lambda old, new: print(f"State: {old.value} → {new.value}")
    )
    transcriber.on_transcript(
        lambda seg: print(f"[{seg.start_time:.1f}s] {seg.text}")
    )
    
    # Load model
    if transcriber.load_model():
        print(f"\nTemp file: {transcriber.get_session_file()}")
        print("\nEngine ready. Integrate with audio capture for full functionality.")
    else:
        print("\nFailed to load model.")
