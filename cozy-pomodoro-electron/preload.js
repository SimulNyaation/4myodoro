/**
 * 4myo1dolldoll preload - 렌더러에서 안전하게 윈도우 컨트롤을 호출하기 위한 브리지
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cozy', {
  minimize:          () => ipcRenderer.invoke('window:minimize'),
  hideToTray:        () => ipcRenderer.invoke('window:hideToTray'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggleAlwaysOnTop'),
  isAlwaysOnTop:     () => ipcRenderer.invoke('window:isAlwaysOnTop'),
  // 자동 업데이트 상태 알림 (메인 → 렌더러)
  onUpdaterStatus:   (cb) => ipcRenderer.on('updater:status', (_e, msg) => cb(msg)),
});
