import { app, BrowserWindow, ipcMain, screen } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = !app.isPackaged

let mainWindow = null
let overlayWindow = null

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

function createOverlayWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize

  overlayWindow = new BrowserWindow({
    width: 360,
    height: 520,
    x: screenW - 380,
    y: 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  overlayWindow.setContentProtection(true)
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (isDev) {
    overlayWindow.loadURL('http://localhost:5173/overlay.html')
  } else {
    overlayWindow.loadFile(path.join(__dirname, '..', 'dist', 'overlay.html'))
  }

  overlayWindow.hide()
}

app.whenReady().then(() => {
  createMainWindow()
  createOverlayWindow()

  ipcMain.on('overlay:toggle', (_event, show) => {
    if (!overlayWindow) return
    if (show) overlayWindow.show()
    else overlayWindow.hide()
  })

  ipcMain.on('overlay:resize', (_event, { width, height }) => {
    if (!overlayWindow) return
    overlayWindow.setSize(width, height)
  })

  ipcMain.on('session:start', () => {
    overlayWindow?.webContents.send('session:started')
  })

  ipcMain.on('session:end', () => {
    overlayWindow?.webContents.send('session:ended')
    overlayWindow?.hide()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
    createOverlayWindow()
  }
})
