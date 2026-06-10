/**
 * SVG -> PNG -> ICO 변환기 (Electron으로 렌더링, 외부 도구 불필요)
 *   npm run icon  으로 실행
 */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const png2icons = require('png2icons');

const BUILD = path.join(__dirname, 'build');
const svg = fs.readFileSync(path.join(BUILD, 'icon.svg'), 'utf8');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 256, height: 256, show: false,
    frame: false, transparent: true,
    webPreferences: { offscreen: false },
  });

  const html =
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<style>html,body{margin:0;padding:0;width:256px;height:256px;background:transparent;overflow:hidden}svg{display:block}</style>' +
    '</head><body>' + svg + '</body></html>';

  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  await new Promise((r) => setTimeout(r, 400));

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
