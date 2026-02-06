"""
Windy Pro - Audio Capture Module
Captures audio from microphone and feeds to transcriber.
"""

import sys
import threading
import queue
from typing import Callable, Optional

try:
    import sounddevice as sd
    SOUNDDEVICE_AVAILABLE = True
except ImportError:
    SOUNDDEVICE_AVAILABLE = False
    sd = None

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    np = None


class AudioCapture:
    """
    Captures audio from the default microphone.
    Outputs 16-bit PCM at 16kHz mono - the format faster-whisper expects.
    """
    
    SAMPLE_RATE = 16000  # 16kHz - Whisper's expected rate
    CHANNELS = 1         # Mono
    DTYPE = 'int16'      # 16-bit PCM
    BLOCK_SIZE = 1600    # 100ms chunks (16000 * 0.1)
    
    def __init__(self, device: Optional[int] = None, allow_mock: bool = False):
        """
        Initialize audio capture.
        
        Args:
            device: Audio device index, or None for default
            allow_mock: Fallback to simulated audio if device init fails
        """
        self.device = device
        self.allow_mock = allow_mock
        self._stream = None
        self._running = False
        self._mock_thread = None
        self._audio_callback: Optional[Callable] = None
        self._level_callback: Optional[Callable] = None
        
    def list_devices(self) -> list:
        """List available audio input devices."""
        if not SOUNDDEVICE_AVAILABLE:
            return []
        
        devices = sd.query_devices()
        input_devices = []
        for i, dev in enumerate(devices):
            if dev['max_input_channels'] > 0:
                input_devices.append({
                    'index': i,
                    'name': dev['name'],
                    'channels': dev['max_input_channels'],
                    'sample_rate': dev['default_samplerate']
                })
        return input_devices
    
    def on_audio(self, callback: Callable):
        """Register callback for audio data. Receives bytes (16-bit PCM)."""
        self._audio_callback = callback
        
    def on_level(self, callback: Callable):
        """Register callback for audio level (0.0-1.0). For UI meters."""
        self._level_callback = callback
    
    def _audio_handler(self, indata, frames, time_info, status):
        """Internal callback from sounddevice."""
        if status:
            print(f"Audio status: {status}", file=sys.stderr)
        
        if not self._running:
            return
        
        # Convert to bytes
        audio_bytes = indata.tobytes()
        
        # Calculate audio level for UI feedback
        if self._level_callback and NUMPY_AVAILABLE:
            # RMS level normalized to 0-1
            rms = np.sqrt(np.mean(indata.astype(np.float32) ** 2))
            level = min(1.0, rms / 10000.0)  # Normalize
            try:
                self._level_callback(level)
            except:
                pass
        
        # Send audio to callback
        if self._audio_callback:
            try:
                self._audio_callback(audio_bytes)
            except Exception as e:
                print(f"Audio callback error: {e}", file=sys.stderr)
    
    def start(self) -> bool:
        """Start capturing audio."""
        if not SOUNDDEVICE_AVAILABLE and not self.allow_mock:
            print("sounddevice not installed. Run: pip install sounddevice", 
                  file=sys.stderr)
            return False
        
        if self._running:
            return True
        
        self._running = True
        
        # Try real capture first
        if SOUNDDEVICE_AVAILABLE:
            try:
                self._stream = sd.InputStream(
                    device=self.device,
                    channels=self.CHANNELS,
                    samplerate=self.SAMPLE_RATE,
                    dtype=self.DTYPE,
                    blocksize=self.BLOCK_SIZE,
                    callback=self._audio_handler
                )
                self._stream.start()
                return True
            except Exception as e:
                print(f"Failed to start audio capture: {e}", file=sys.stderr)
                if not self.allow_mock:
                    self._running = False
                    return False
        
        # Fallback to mock
        if self.allow_mock:
            print("Falling back to simulated audio (Mock Mode)", file=sys.stderr)
            self._mock_thread = threading.Thread(target=self._mock_loop)
            self._mock_thread.daemon = True
            self._mock_thread.start()
            return True
            
        self._running = False
        return False

    def _mock_loop(self):
        """Generate silence/noise for testing without mic."""
        import time
        import random
        
        # Create silent buffer
        buffer_size = self.BLOCK_SIZE * 2 # 16-bit = 2 bytes per sample
        silence = bytes(buffer_size)
        
        while self._running:
            start_time = time.time()
            
            # Send silence (or maybe random noise for level meter?)
            if self._audio_callback:
                try:
                    self._audio_callback(silence)
                except:
                    pass
            
            # Simulate random level for UI testing
            if self._level_callback:
                try:
                    # Random 0.0-0.3 to show activity
                    self._level_callback(random.random() * 0.1) 
                except:
                    pass
            
            # Sleep to match block rate (100ms)
            elapsed = time.time() - start_time
            sleep_time = (self.BLOCK_SIZE / self.SAMPLE_RATE) - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)

    def stop(self):
        """Stop capturing audio."""
        self._running = False
        
        if self._stream:
            try:
                self._stream.stop()
                self._stream.close()
            except:
                pass
            self._stream = None
            
        if self._mock_thread:
            self._mock_thread.join(timeout=1.0)
            self._mock_thread = None
    
    def is_running(self) -> bool:
        """Check if capture is active."""
        return self._running


# Test if run directly
if __name__ == "__main__":
    print("Audio Capture Test")
    print("=" * 40)
    
    print(f"sounddevice: {'✓' if SOUNDDEVICE_AVAILABLE else '✗'}")
    print(f"numpy: {'✓' if NUMPY_AVAILABLE else '✗'}")
    
    if not SOUNDDEVICE_AVAILABLE:
        print("\nInstall: pip install sounddevice")
        sys.exit(1)
    
    capture = AudioCapture()
    
    print("\nAvailable input devices:")
    for dev in capture.list_devices():
        print(f"  [{dev['index']}] {dev['name']}")
    
    print("\nStarting capture (Ctrl+C to stop)...")
    
    bytes_received = [0]
    
    def on_audio(data):
        bytes_received[0] += len(data)
    
    def on_level(level):
        bars = int(level * 50)
        print(f"\rLevel: {'█' * bars}{'░' * (50-bars)} {level:.2f}", end='')
    
    capture.on_audio(on_audio)
    capture.on_level(on_level)
    
    if capture.start():
        try:
            import time
            while True:
                time.sleep(0.1)
        except KeyboardInterrupt:
            pass
        finally:
            capture.stop()
            print(f"\n\nReceived {bytes_received[0]:,} bytes")
    else:
        print("Failed to start capture")
