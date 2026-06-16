/**
 * POMODOLLDOLL preload - 렌더러에서 안전하게 윈도우 컨트롤을 호출하기 위한 브리지
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cozy', {
  minimize:          () => ipcRenderer.invoke('window:minimize'),
  hideToTray:        () => ipcRenderer.invoke('window:hideToTray'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggleAlwaysOnTop'),
  isAlwaysOnTop:     () => ipcRenderer.invoke('window:isAlwaysOnTop'),
  // 음악 탭: 메인 프로세스가 관리하는 WebContentsView 제어
  music: {
    show:      (rect) => ipcRenderer.invoke('music:show', rect),
    hide:      ()     => ipcRenderer.invoke('music:hide'),
    setBounds: (rect) => ipcRenderer.invoke('music:bounds', rect),
    reload:    ()     => ipcRenderer.invoke('music:reload'),
    home:      ()     => ipcRenderer.invoke('music:home'),
    back:      ()     => ipcRenderer.invoke('music:back'),
  },
});
