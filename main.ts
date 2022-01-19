import { app, BrowserWindow, screen, webContents, ipcMain } from 'electron';

import './main/ipcPrinter';
import './main/appServer';
import './main/callerServer';
import './main/scalerServer';
import { exec } from 'child_process';

let win: BrowserWindow;
let serve: any;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

if (serve) {
  require('electron-reload')(__dirname, {});
}

function createWindow() {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 1366,
    height: 768,
    frame: true,
    resizable: true,
  });
  win.setMenu(null);
  win.setFullScreen(true);
  win.loadURL('file://' + __dirname + '/index.html');
  if (serve) {
    win.setFullScreen(false);
    win.webContents.openDevTools();
  }
  require('devtron').install();
  win.on('closed', () => {
    win = null;
    exec('killall cidshow');
  });
}

try {
  app.on('ready', createWindow);
  app.on('activate', () => {
    if (win === null) {
      createWindow();
    }
  });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
      exec('killall cidshow');


    }
  });
} catch (e) {

}
