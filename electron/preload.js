const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  toggleOverlay: (show) => ipcRenderer.send('overlay:toggle', show),
  resizeOverlay: (width, height) => ipcRenderer.send('overlay:resize', { width, height }),
  startSession: () => ipcRenderer.send('session:start'),
  endSession: () => ipcRenderer.send('session:end'),

  onSessionStarted: (callback) => {
    ipcRenderer.on('session:started', callback)
    return () => ipcRenderer.removeListener('session:started', callback)
  },
  onSessionEnded: (callback) => {
    ipcRenderer.on('session:ended', callback)
    return () => ipcRenderer.removeListener('session:ended', callback)
  },
})
