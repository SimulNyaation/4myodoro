/**
 * 4myo1dolldoll - 고양이·강아지와 함께하는 뽀모도로 & 태스크 위젯
 * Electron 메인 프로세스
 */

const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');

const APP_NAME = '4myo1dolldoll';

let mainWindow = null;
let tray = null;
let isQuitting = false;

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
      webviewTag: true,            // 음악 탭(YouTube Music/Spotify/SoundCloud)용 <webview>
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

/* ---------- 자동 업데이트 (electron-updater + GitHub Releases) ---------- */

function sendUpdaterStatus(msg) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', msg);
  }
}

function setupAutoUpdate() {
  // 패키징된 앱에서만 동작 (개발 모드에서는 건너뜀)
  if (!app.isPackaged) return;
  let autoUpdater;
  try {
    autoUpdater = require('electron-updater').autoUpdater;
  } catch (e) {
    return; // electron-updater 미설치 시 조용히 무시
  }

  autoUpdater.autoDownload = true;
  autoUpdater.on('update-available', () => sendUpdaterStatus('새 버전을 내려받는 중…'));
  autoUpdater.on('update-downloaded', () => sendUpdaterStatus('업데이트 준비 완료 · 다음 실행 때 적용돼요'));
  autoUpdater.on('error', () => { /* 네트워크 문제 등은 조용히 무시 */ });

  autoUpdater.checkForUpdatesAndNotify().catch(() => {});
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
  setupAutoUpdate();
});

app.on('window-all-closed', () => {
  // 트레이로만 살아남기 — 종료는 트레이 메뉴에서
});
