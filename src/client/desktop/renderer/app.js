/**
 * Windy Pro - Renderer Application
 * 
 * Handles:
 * - WebSocket connection to Python backend
 * - State indicator updates (The Green Strobe)
 * - Transcript display
 * - User interactions
 */

class WindyApp {
  constructor() {
    // State
    this.isRecording = false;
    this.currentState = 'idle';
    this.transcript = [];
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    
    // DOM Elements
    this.stateIndicator = document.getElementById('stateIndicator');
    this.stateGlow = document.getElementById('stateGlow');
    this.stateLabel = document.getElementById('stateLabel');
    this.transcriptContent = document.getElementById('transcriptContent');
    this.transcriptScroll = document.getElementById('transcriptScroll');
    this.recordBtn = document.getElementById('recordBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.copyBtn = document.getElementById('copyBtn');
    this.pasteBtn = document.getElementById('pasteBtn');
    this.connectionDot = document.getElementById('connectionDot');
    this.connectionText = document.getElementById('connectionText');
    this.closeBtn = document.getElementById('closeBtn');
    this.minimizeBtn = document.getElementById('minimizeBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    
    // Initialize
    this.init();
  }
  
  async init() {
    this.bindEvents();
    this.bindIPCEvents();
    await this.connect();
  }
  
  /**
   * Bind DOM events
   */
  bindEvents() {
    // Record button
    this.recordBtn.addEventListener('click', () => this.toggleRecording());
    
    // Clear button
    this.clearBtn.addEventListener('click', () => this.clearTranscript());
    
    // Copy button
    this.copyBtn.addEventListener('click', () => this.copyTranscript());
    
    // Paste button
    this.pasteBtn.addEventListener('click', () => this.pasteTranscript());
    
    // Window controls
    this.closeBtn.addEventListener('click', () => window.close());
    this.minimizeBtn.addEventListener('click', () => {
      // Electron will handle minimize
    });
    this.settingsBtn.addEventListener('click', () => {
      // Open settings panel
      console.log('Settings clicked');
    });
  }
  
  /**
   * Bind IPC events from main process
   */
  bindIPCEvents() {
    // Toggle recording from hotkey
    window.windyAPI.onToggleRecording((isRecording) => {
      this.isRecording = isRecording;
      if (isRecording) {
        this.startRecording();
      } else {
        this.stopRecording();
      }
    });
    
    // Request transcript for paste
    window.windyAPI.onRequestTranscript(() => {
      const text = this.getFullTranscript();
      window.windyAPI.sendTranscriptForPaste(text);
    });
    
    // State change from main process
    window.windyAPI.onStateChange((state) => {
      this.setState(state);
    });
  }
  
  /**
   * Connect to WebSocket server
   */
  async connect() {
    const config = await window.windyAPI.getServerConfig();
    const url = `ws://${config.host}:${config.port}`;
    
    this.setConnectionStatus('connecting');
    
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.setConnectionStatus('connected');
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.setConnectionStatus('disconnected');
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.setConnectionStatus('error');
      };
      
    } catch (error) {
      console.error('Connection failed:', error);
      this.setConnectionStatus('error');
      this.scheduleReconnect();
    }
  }
  
  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    }
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(msg) {
    switch (msg.type) {
      case 'state':
        this.setState(msg.state);
        break;
        
      case 'transcript':
        this.addTranscriptSegment(msg);
        break;
        
      case 'ack':
        console.log('Ack:', msg.action, msg.success);
        break;
        
      case 'error':
        console.error('Server error:', msg.message);
        break;
        
      case 'pong':
        // Latency check
        break;
    }
  }
  
  /**
   * Send command to server
   */
  send(action, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...data }));
    }
  }
  
  /**
   * Set visual state
   */
  setState(state) {
    this.currentState = state;
    
    // Remove all state classes
    this.stateIndicator.classList.remove('idle', 'listening', 'buffering', 'error', 'injecting');
    
    // Add current state class
    this.stateIndicator.classList.add(state);
    
    // Update label
    const labels = {
      idle: 'Ready',
      listening: 'Recording',
      buffering: 'Processing',
      error: 'Error',
      injecting: 'Pasting'
    };
    this.stateLabel.textContent = labels[state] || state;
    
    // Update record button
    if (state === 'listening') {
      this.recordBtn.classList.add('recording');
      this.recordBtn.querySelector('.label').textContent = 'Stop';
    } else {
      this.recordBtn.classList.remove('recording');
      this.recordBtn.querySelector('.label').textContent = 'Record';
    }
  }
  
  /**
   * Set connection status
   */
  setConnectionStatus(status) {
    this.connectionDot.classList.remove('connected', 'connecting', 'error');
    
    switch (status) {
      case 'connected':
        this.connectionDot.classList.add('connected');
        this.connectionText.textContent = 'Connected';
        break;
      case 'connecting':
        this.connectionDot.classList.add('connecting');
        this.connectionText.textContent = 'Connecting...';
        break;
      case 'disconnected':
        this.connectionText.textContent = 'Disconnected';
        break;
      case 'error':
        this.connectionDot.classList.add('error');
        this.connectionText.textContent = 'Connection Error';
        break;
    }
  }
  
  /**
   * Toggle recording state
   */
  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }
  
  /**
   * Start recording
   */
  startRecording() {
    this.isRecording = true;
    this.send('start');
    this.setState('listening');
    
    // Clear placeholder if exists
    const placeholder = this.transcriptContent.querySelector('.placeholder');
    if (placeholder) {
      placeholder.remove();
    }
  }
  
  /**
   * Stop recording
   */
  stopRecording() {
    this.isRecording = false;
    this.send('stop');
    this.setState('idle');
  }
  
  /**
   * Add transcript segment to display
   */
  addTranscriptSegment(msg) {
    // Remove any existing partial segment
    const existingPartial = this.transcriptContent.querySelector('.segment.partial');
    if (existingPartial) {
      existingPartial.remove();
    }
    
    // Create segment element
    const segment = document.createElement('div');
    segment.className = `segment${msg.partial ? ' partial' : ''}`;
    
    // Add timestamp
    const time = document.createElement('div');
    time.className = 'segment-time';
    time.textContent = this.formatTime(msg.start);
    segment.appendChild(time);
    
    // Add text
    const text = document.createElement('div');
    text.className = 'segment-text';
    text.textContent = msg.text;
    segment.appendChild(text);
    
    this.transcriptContent.appendChild(segment);
    
    // Store non-partial segments
    if (!msg.partial) {
      this.transcript.push(msg);
    }
    
    // Auto-scroll to bottom
    this.transcriptScroll.scrollTop = this.transcriptScroll.scrollHeight;
  }
  
  /**
   * Format time in seconds to MM:SS
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  /**
   * Get full transcript text
   */
  getFullTranscript() {
    return this.transcript.map(s => s.text).join(' ');
  }
  
  /**
   * Clear transcript
   */
  clearTranscript() {
    this.transcript = [];
    this.transcriptContent.innerHTML = '<div class="placeholder">Press <kbd>Ctrl+Shift+Space</kbd> to start recording</div>';
  }
  
  /**
   * Copy transcript to clipboard
   */
  copyTranscript() {
    const text = this.getFullTranscript();
    if (text) {
      navigator.clipboard.writeText(text);
      // Visual feedback
      this.copyBtn.querySelector('.icon').textContent = '✓';
      setTimeout(() => {
        this.copyBtn.querySelector('.icon').textContent = '📋';
      }, 1000);
    }
  }
  
  /**
   * Paste transcript to cursor
   */
  pasteTranscript() {
    const text = this.getFullTranscript();
    window.windyAPI.sendTranscriptForPaste(text);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new WindyApp();
});
