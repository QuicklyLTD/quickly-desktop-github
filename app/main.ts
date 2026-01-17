import {app, BrowserWindow, screen, ipcMain} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import './ipcPrinter';
import './callerServer';
import './scalerServer';
import './appServer';

let win: BrowserWindow = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function loadAppWindow(hash?: string) {
  if (!win) return;
  if (serve) {
    const hashSuffix = hash ? `#${hash.replace(/^#/, '')}` : '';
    win.loadURL(`http://localhost:4200${hashSuffix}`);
    return;
  }

  let indexPath = path.join(__dirname, 'index.html');
  if (!fs.existsSync(indexPath) && fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
    indexPath = path.join(__dirname, '../dist/index.html');
  }

  if (hash) {
    win.loadFile(indexPath, { hash: hash.replace(/^#/, '') });
  } else {
    win.loadFile(indexPath);
  }
}

function createWindow(): BrowserWindow {

  const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve),
      contextIsolation: false,  // false if you want to run e2e test with Spectron
    },
  });

  if (serve) {
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
  }

  loadAppWindow();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

ipcMain.on('app-reload', () => {
  if (win) {
    const currentUrl = win.webContents.getURL();
    const hashIndex = currentUrl.indexOf('#');
    const hash = hashIndex >= 0 ? currentUrl.slice(hashIndex + 1) : '';
    loadAppWindow(hash);
  }
});

ipcMain.on('app-relaunch', () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.on('app-quit', () => {
  app.quit();
});

ipcMain.on('app-devtools', () => {
  if (win) {
    win.webContents.openDevTools();
  }
});

ipcMain.on('app-fullscreen', (_event, status: boolean) => {
  if (win) {
    win.setResizable(true);
    win.setFullScreen(!!status);
  }
});

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
