/**
 * Windy Pro - Preload Script
 * Exposes safe APIs to the renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('windyAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.send('update-settings', settings),
  getServerConfig: () => ipcRenderer.invoke('get-server-config'),
  
  // Recording control
  onToggleRecording: (callback) => {
    ipcRenderer.on('toggle-recording', (event, isRecording) => callback(isRecording));
  },
  
  // Transcript paste
  onRequestTranscript: (callback) => {
    ipcRenderer.on('request-transcript', () => callback());
  },
  sendTranscriptForPaste: (transcript) => {
    ipcRenderer.send('transcript-for-paste', transcript);
  },
  
  // State changes
  onStateChange: (callback) => {
    ipcRenderer.on('state-change', (event, state) => callback(state));
  },
  
  // Navigation
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', () => callback());
  },
  onOpenVault: (callback) => {
    ipcRenderer.on('open-vault', () => callback());
  },
  
  // Platform info
  platform: process.platform
});
