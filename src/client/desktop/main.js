const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, screen, clipboard } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow = null;
let tray = null;
let isRecording = false;

// Codon B1.2: Window Properties
function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600, // Increased height to show transcript
    x: width - 420, // Position bottom-right by default
    y: height - 620,
    frame: false, // Custom title bar
    transparent: true, // For strobe effect
    alwaysOnTop: true, // Keep visibility
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, // Secure, uses preload
      backgroundThrottling: false, // Keep running in background
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Open DevTools for debugging (remove in production)
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

// Codon B1.3: Tray Menu
function createTray() {
  // TODO: Add real icon asset. For now, skipping to avoid crash if missing.
  /*
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Windy Pro', click: () => mainWindow.show() },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('Windy Pro');
  tray.setContextMenu(contextMenu);
  */
}

// Codon B1.4: Global Hotkeys
function registerHotkeys() {
  // Toggle Recording: Ctrl+Shift+Space
  const retRecord = globalShortcut.register('CommandOrControl+Shift+Space', () => {
    toggleRecording();
  });

  if (!retRecord) {
    console.log('Registration of Ctrl+Shift+Space failed');
  }

  // Toggle Window: Ctrl+Shift+W
  const retWindow = globalShortcut.register('CommandOrControl+Shift+W', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
  
  // Paste Transcript: Ctrl+Shift+V
  // Note: This logic needs to be handled carefully to avoid conflict with system paste
}

function toggleRecording() {
  isRecording = !isRecording;
  console.log(`Recording state: ${isRecording}`);
  
  // Notify renderer to update UI (Green Strobe)
  if (mainWindow) {
    // Send both the boolean toggle AND the explicit state
    mainWindow.webContents.send('toggle-recording', isRecording);
    mainWindow.webContents.send('state-change', isRecording ? 'listening' : 'idle');
  }
}

app.whenReady().then(() => {
  createMainWindow();
  createTray();
  registerHotkeys();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister hotkeys
  globalShortcut.unregisterAll();
});

// --- IPC Handlers ---

// Get Server Config (for WebSocket connection)
ipcMain.handle('get-server-config', async () => {
  return {
    host: store.get('server.host', '127.0.0.1'),
    port: store.get('server.port', 9876)
  };
});

// Get Settings
ipcMain.handle('get-settings', async () => {
  return store.get('settings', {});
});

// Update Settings
ipcMain.on('update-settings', (event, settings) => {
  store.set('settings', settings);
});

// Quit App
ipcMain.on('app-quit', () => {
  app.quit();
});

// Handle Transcript Paste
ipcMain.on('transcript-for-paste', (event, text) => {
  if (text) {
    clipboard.writeText(text);
    // In Phase 1.3, we will add robotjs/xdotool here to simulate Ctrl+V
    console.log('Transcript copied to clipboard for paste:', text.substring(0, 20) + '...');
  }
});
