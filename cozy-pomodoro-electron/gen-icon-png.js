/**
 * cozyappicon.png -> 모서리 라운딩 -> PNG -> ICO 변환기
 * (Electron 캔버스로 라운딩, 외부 도구 불필요)
 *   npm run icon:png  으로 실행
 */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const png2icons = require('png2icons');

const BUILD = path.join(__dirname, 'build');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 256, height: 256, show: false,
    frame: false, transparent: true,
    webPreferences: { offscreen: false },
  });

  await win.loadFile(path.join(BUILD, '__iconmaker.html'));

  // 캔버스에 이미지가 그려질 때까지 대기
  for (let i = 0; i < 50; i++) {
    const ok = await win.webContents.executeJavaScript('window.__ready === true').catch(() => false);
    if (ok) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 150));

  const img = await win.webContents.capturePage();
  const png = img.toPNG();
  fs.writeFileSync(path.join(BUILD, 'icon.png'), png);
  console.log('icon.png written (' + png.length + ' bytes)');

  const ico = png2icons.createICO(png, png2icons.BILINEAR, 0, false);
  if (ico) {
    fs.writeFileSync(path.join(BUILD, 'icon.ico'), ico);
    console.log('icon.ico written (' + ico.length + ' bytes)');
  } else {
    console.error('ICO 변환 실패');
  }

  app.quit();
});
