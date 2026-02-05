/**
 * Windy Pro - Electron Main Process
 * 
 * Creates a floating, always-on-top window with:
 * - System tray integration
 * - Global hotkeys
 * - WebSocket connection to Python backend
 * 
 * DNA Strand: B1.1
 */

const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, clipboard } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Persistent settings storage
const store = new Store({
  defaults: {
    hotkeys: {
      toggleRecording: 'CommandOrControl+Shift+Space',
      pasteTranscript: 'CommandOrControl+Shift+V',
      showHide: 'CommandOrControl+Shift+W'
    },
    window: {
      width: 400,
      height: 300,
      x: null,
      y: null
    },
    server: {
      host: '127.0.0.1',
      port: 9876
    },
    appearance: {
      alwaysOnTop: true,
      opacity: 1.0
    }
  }
});

let mainWindow = null;
let tray = null;
let isRecording = false;

/**
 * Create the main floating window
 */
function createWindow() {
  const windowConfig = store.get('window');
  const appearance = store.get('appearance');
  
  mainWindow = new BrowserWindow({
    width: windowConfig.width,
    height: windowConfig.height,
    x: windowConfig.x,
    y: windowConfig.y,
    
    // Floating window properties
    alwaysOnTop: appearance.alwaysOnTop,
    frame: false,           // Frameless for custom UI
    transparent: true,      // Allow CSS transparency for strobe effect
    resizable: true,
    minimizable: true,
    maximizable: false,
    skipTaskbar: false,
    
    // Minimum size
    minWidth: 250,
    minHeight: 150,
    
    // Web preferences
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    
    // Visual
    backgroundColor: '#00000000',  // Transparent
    hasShadow: true,
    opacity: appearance.opacity,
    
    // Platform specific
    titleBarStyle: 'hidden',
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined
  });
  
  // Load the renderer
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  
  // Save window position on move/resize
  mainWindow.on('move', saveWindowBounds);
  mainWindow.on('resize', saveWindowBounds);
  
  // Hide instead of close (keep in tray)
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  
  // Open DevTools in dev mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

/**
 * Save window bounds to store
 */
function saveWindowBounds() {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  store.set('window', bounds);
}

/**
 * Create system tray
 */
function createTray() {
  // Create tray icon (green circle for now, will be replaced with proper icon)
  const iconSize = process.platform === 'darwin' ? 16 : 32;
  const icon = createTrayIcon('idle', iconSize);
  
  tray = new Tray(icon);
  tray.setToolTip('Windy Pro - Click to show');
  
  updateTrayMenu();
  
  // Click to show/hide window
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

/**
 * Update tray context menu
 */
function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: mainWindow?.isVisible() ? 'Hide Window' : 'Show Window',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: isRecording ? '⏹ Stop Recording' : '🎤 Start Recording',
      click: () => toggleRecording()
    },
    { type: 'separator' },
    {
      label: '⚙️ Settings',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('open-settings');
      }
    },
    {
      label: '📋 Open Vault',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('open-vault');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Windy Pro',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

/**
 * Create a simple tray icon based on state
 */
function createTrayIcon(state, size) {
  const canvas = require('canvas');
  // For now, return a placeholder - in production, load from assets
  // This would be replaced with proper icon files
  
  // Fallback to built-in icon creation
  const colors = {
    idle: '#6B7280',      // Gray
    listening: '#22C55E', // Green
    buffering: '#EAB308', // Yellow
    error: '#EF4444',     // Red
    injecting: '#3B82F6'  // Blue
  };
  
  // Create a simple colored circle icon
  // In production, use pre-made icon files
  return nativeImage.createEmpty();
}

/**
 * Register global hotkeys
 */
function registerHotkeys() {
  const hotkeys = store.get('hotkeys');
  
  // Toggle recording
  globalShortcut.register(hotkeys.toggleRecording, () => {
    toggleRecording();
  });
  
  // Paste transcript
  globalShortcut.register(hotkeys.pasteTranscript, () => {
    pasteTranscript();
  });
  
  // Show/hide window
  globalShortcut.register(hotkeys.showHide, () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

/**
 * Toggle recording state
 */
function toggleRecording() {
  isRecording = !isRecording;
  mainWindow.webContents.send('toggle-recording', isRecording);
  updateTrayMenu();
  
  // Update tray icon color based on state
  if (tray) {
    tray.setToolTip(isRecording ? 'Windy Pro - Recording...' : 'Windy Pro');
  }
}

/**
 * Paste current transcript to cursor position
 */
function pasteTranscript() {
  mainWindow.webContents.send('request-transcript');
}

// IPC Handlers

// Get transcript and paste it
ipcMain.on('transcript-for-paste', (event, transcript) => {
  if (transcript && transcript.trim()) {
    // Copy to clipboard
    clipboard.writeText(transcript);
    
    // Simulate Ctrl+V / Cmd+V
    // This is handled by the injection module in B3
    mainWindow.webContents.send('state-change', 'injecting');
    
    setTimeout(() => {
      mainWindow.webContents.send('state-change', isRecording ? 'listening' : 'idle');
    }, 200);
  }
});

// Update settings
ipcMain.on('update-settings', (event, settings) => {
  if (settings.hotkeys) {
    // Unregister old hotkeys
    globalShortcut.unregisterAll();
    store.set('hotkeys', settings.hotkeys);
    registerHotkeys();
  }
  if (settings.server) {
    store.set('server', settings.server);
  }
  if (settings.appearance) {
    store.set('appearance', settings.appearance);
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(settings.appearance.alwaysOnTop);
      mainWindow.setOpacity(settings.appearance.opacity);
    }
  }
});

// Get settings
ipcMain.handle('get-settings', () => {
  return {
    hotkeys: store.get('hotkeys'),
    server: store.get('server'),
    appearance: store.get('appearance')
  };
});

// Get server config for WebSocket connection
ipcMain.handle('get-server-config', () => {
  return store.get('server');
});

// App lifecycle

app.whenReady().then(() => {
  createWindow();
  createTray();
  registerHotkeys();
  
  app.on('activate', () => {
    // macOS: re-create window if dock icon clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit on window close (keep in tray)
  // Only quit on explicit quit action
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('will-quit', () => {
  // Unregister all hotkeys
  globalShortcut.unregisterAll();
});

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Focus existing window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
