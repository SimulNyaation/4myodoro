/**
 * POMODOLLDOLL - 고양이·강아지와 함께하는 뽀모도로 & 태스크 위젯
 * Electron 메인 프로세스
 */

const { app, BrowserWindow, WebContentsView, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');

const APP_NAME = 'POMODOLLDOLL';
const MUSIC_URL = 'https://music.youtube.com';

let mainWindow = null;
let tray = null;
let isQuitting = false;
let musicView = null;
let musicLoaded = false;

/* ---------- IPC: 윈도우 컨트롤 ---------- */

ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:hideToTray', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('window:toggleAlwaysOnTop', () => {
  if (!mainWindow) return false;
  const next = !mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(next);
  rebuildTrayMenu();
  return next;
});

ipcMain.handle('window:isAlwaysOnTop', () => {
  return mainWindow ? mainWindow.isAlwaysOnTop() : false;
});

/* ---------- 음악: WebContentsView (메인이 크기를 직접 제어 → webview 뷰포트 버그 회피) ---------- */

function getMusicView() {
  if (musicView || !mainWindow) return musicView;
  musicView = new WebContentsView({
    webPreferences: { partition: 'persist:music' },
  });
  // 로그인 팝업 등은 기본 창으로 허용
  musicView.webContents.setWindowOpenHandler(() => ({ action: 'allow' }));
  mainWindow.contentView.addChildView(musicView);
  musicView.setVisible(false);
  return musicView;
}

function setMusicBounds(rect) {
  if (!musicView || !rect) return;
  musicView.setBounds({
    x: Math.round(rect.x), y: Math.round(rect.y),
    width: Math.round(rect.width), height: Math.round(rect.height),
  });
}

ipcMain.handle('music:show', (e, rect) => {
  const v = getMusicView();
  if (!v) return;
  setMusicBounds(rect);
  v.setVisible(true);
  if (!musicLoaded) { musicLoaded = true; v.webContents.loadURL(MUSIC_URL); }
});

ipcMain.handle('music:hide', () => { if (musicView) musicView.setVisible(false); });
ipcMain.handle('music:bounds', (e, rect) => setMusicBounds(rect));
ipcMain.handle('music:reload', () => { if (musicView) musicView.webContents.reload(); });
ipcMain.handle('music:home', () => { if (musicView) musicView.webContents.loadURL(MUSIC_URL); });
ipcMain.handle('music:back', () => {
  if (!musicView) return;
  const wc = musicView.webContents;
  const nh = wc.navigationHistory;
  if (nh && nh.canGoBack()) nh.goBack();
  else if (wc.canGoBack && wc.canGoBack()) wc.goBack();
});

/* ---------- 윈도우 ---------- */

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 820,
    minWidth: 420,
    minHeight: 560,
    frame: false,
    transparent: false,
    backgroundColor: '#f4ece1',
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    title: APP_NAME,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false, // 타이머가 백그라운드에서도 정확히 흐르도록
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 닫기 버튼 → 트레이로 숨기기 (종료는 트레이 메뉴에서)
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

/* ---------- 트레이 ---------- */

function createTray() {
  const iconPath = path.join(__dirname, 'build', 'icon.ico');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) icon = nativeImage.createEmpty();
  } catch (e) {
    icon = nativeImage.createEmpty();
  }
  tray = new Tray(icon);
  tray.setToolTip(APP_NAME + ' - 고양이·강아지와 함께하는 몰입 시간');
  rebuildTrayMenu();
  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) mainWindow.hide();
    else { mainWindow.show(); mainWindow.focus(); }
  });
}

function rebuildTrayMenu() {
  const aot = mainWindow ? mainWindow.isAlwaysOnTop() : true;
  const menu = Menu.buildFromTemplate([
    { label: APP_NAME + ' 보이기', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { label: '숨기기',             click: () => mainWindow.hide() },
    { type: 'separator' },
    {
      label: '항상 위에 표시', type: 'checkbox', checked: aot,
      click: (item) => {
        mainWindow.setAlwaysOnTop(item.checked);
        rebuildTrayMenu();
      }
    },
    { type: 'separator' },
    { label: '종료', click: () => { isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(menu);
}

/* ---------- 단일 인스턴스 ---------- */

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

/* ---------- 앱 라이프사이클 ---------- */

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // 트레이로만 살아남기 — 종료는 트레이 메뉴에서
});
