import { app, BrowserWindow, screen, ipcMain } from 'electron';
import './ipcPrinter';
import './callerServer';
import './scalerServer';
import './appServer';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';

let win: BrowserWindow = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
  app.quit();
}

if (serve) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  app.setPath('userData', `${app.getPath('userData')}-dev`);
}

function createWindow(): BrowserWindow {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 1366,
    height: 768,
    frame: true,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      allowRunningInsecureContent: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  win.setMenu(null);
  win.setFullScreen(true);

  if (serve) {
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
    win.loadURL('http://localhost:4200');
    win.setFullScreen(false);
    win.webContents.openDevTools();
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
       // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    win.loadURL(url.format({
      pathname: path.join(__dirname, pathIndex),
      protocol: 'file:',
      slashes: true
    }));
  }

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
    win.reload();
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
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) {
        win.restore();
      }
      win.focus();
    }
  });
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
