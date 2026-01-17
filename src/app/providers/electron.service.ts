import { Injectable } from '@angular/core';
import { app, remote, screen, shell, Remote, App, BrowserWindow, WebContents, ipcRenderer, webFrame } from 'electron';
import * as fs from 'fs';
import * as https from 'https';
import * as childProcess from 'child_process';
import * as os from 'os';

@Injectable()
export class ElectronService {
  app: App;
  appWindow: BrowserWindow;
  appWebContents: WebContents;
  appPath: string;
  appRealPath: string;
  electronRemote: Remote;
  fileSystem: typeof fs;
  ipcRenderer: typeof ipcRenderer;
  ipAddress: Array<string>;
  webFrame: typeof webFrame;

  constructor() {
    this.app = remote.app;
    this.appWindow = remote.getCurrentWindow();
    this.appWebContents = this.appWindow.webContents;
    this.appPath = this.app.getAppPath();
    this.appRealPath = window.process.cwd();
    this.ipcRenderer = ipcRenderer;
    this.webFrame = webFrame;
    this.fileSystem = fs;
  }

  isElectron() {
    webFrame.setVisualZoomLevelLimits(1, 1);
    webFrame.setLayoutZoomLevelLimits(0, 0);
    return window && window.process && window.process.type;
  }

  getLocalIP() {
    const interfaces = os.networkInterfaces();
    this.ipAddress = [];
    Object.keys(interfaces).forEach(k => {
      interfaces[k].forEach(address => {
        if (address.family === 'IPv4' && !address.internal) {
          this.ipAddress.push(address.address);
        }
      });
    });
    return this.ipAddress[0];
  }

  saveLogo(data) {
    const base64Data = data.replace(/^data:image\/png;base64,/, '');
    const binaryData = new Buffer(base64Data, 'base64');

    fs.exists(this.appRealPath + '/data/', (exists) => {
      if (!exists) {
        fs.mkdir(this.appRealPath + '/data/', (err) => {
          if (!err) {
            fs.writeFile(this.appRealPath + '/data/customer.png', binaryData, (writeErr) => {
              if (writeErr) {
                console.log(writeErr);
              }
            });
          }
        });
      } else {
        fs.writeFile(this.appRealPath + '/data/customer.png', binaryData, (writeErr) => {
          if (writeErr) {
            console.log(writeErr);
          }
        });
      }
    });
  }

  backupData(data, date) {
    const json = JSON.stringify(data);
    fs.exists(this.appRealPath + '/data/backup/', (exists) => {
      if (!exists) {
        fs.mkdir(this.appRealPath + '/data/backup/', (err) => {
          if (!err) {
            fs.writeFile(this.appRealPath + '/data/backup/' + date, json, (writeErr) => {
              if (writeErr) {
                console.log(writeErr);
              }
            });
          }
        });
      } else {
        fs.writeFile(this.appRealPath + '/data/backup/' + date, json, (writeErr) => {
          if (writeErr) {
            console.log(writeErr);
          }
        });
      }
    });
  }

  readBackupData(filename) {
    return new Promise((resolve, reject) => {
      fs.exists(this.appRealPath + '/data/backup/' + filename, (exists) => {
        if (exists) {
          fs.readFile(this.appRealPath + '/data/backup/' + filename, (err, data) => {
            if (!err) {
              const buffer = data.toString('utf8');
              const backup = JSON.parse(buffer);
              resolve(backup);
            } else {
              reject('Dosya Okunurken Hata Oluştu.');
            }
          });
        } else {
          reject('Dosya Bulunamadı');
        }
      });
    });
  }

  fullScreen(status: boolean) {
    this.appWindow.setResizable(true);
    this.appWindow.setFullScreen(status);
  }

  shellCommand(command: string) {
    childProcess.exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });
  }

  shellSpawn(command: string, args?: string[], opts?: childProcess.SpawnOptions) {
    const child = childProcess.spawn(command, args, opts);

    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    child.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }

  reloadProgram() {
    this.appWindow.reload();
  }

  relaunchProgram() {
    this.app.relaunch();
    this.app.quit();
  }

  exitProgram() {
    this.app.quit();
  }

  openDevTools() {
    this.appWebContents.openDevTools();
  }
}
