import { Injectable } from '@angular/core';
import { app, remote, screen, shell, Remote, App, BrowserWindow, WebContents, ipcRenderer } from 'electron';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as os from 'os';
import * as crypto from 'crypto';


@Injectable()
export class ElectronService {
  electronRemote: Remote;
  app: App;
  appWindow: BrowserWindow;
  appWebContents: WebContents;
  appPath: string;
  appRealPath: string;
  ipcRenderer: typeof ipcRenderer;
  ipAddress: Array<string>;

  constructor() {
    this.app = remote.app
    this.appWindow = remote.getCurrentWindow();
    this.appWebContents = this.appWindow.webContents;
    this.appPath = this.app.getAppPath();
    this.appRealPath = window.process.cwd();
    this.ipcRenderer = ipcRenderer;
  }

  isElectron() {
    return window && window.process && window.process.type;
  }

  encryptData(secret: string, data: Buffer) {
    return crypto.privateEncrypt(secret, data);
  }
  decryptData(secret: string, data: Buffer) {
    return crypto.privateDecrypt(secret, data);
  }

  getLocalIP() {
    const interfaces = os.networkInterfaces();
    this.ipAddress = [];
    for (var k in interfaces) {
      for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
          this.ipAddress.push(address.address);
        }
      }
    }
    return this.ipAddress[0];
  }

  saveLogo(url) {
    url = url.replace(/^http:\/\//i, 'https://');
    fs.exists(this.appRealPath + '/data/', (exists) => {
      if (!exists) {
        fs.mkdir(this.appRealPath + '/data/', (err) => {
          if (!err) {
            let file = fs.createWriteStream(this.appRealPath + '/data/customer.png');
            let request = https.get(url, (response) => {
              response.pipe(file);
            });
          }
        });
      } else {
        let file = fs.createWriteStream(this.appRealPath + '/data/customer.png');
        let request = https.get(url, (response) => {
          response.pipe(file);
        });
      }
    });
  }

  backupData(data, date) {
    let json = JSON.stringify(data);
    fs.exists(this.appRealPath + '/data/backup/', (exists) => {
      if (!exists) {
        fs.mkdir(this.appRealPath + '/data/backup/', (err) => {
          if (!err) {
            fs.writeFile(this.appRealPath + '/data/backup/' + date + '.qdat', json, (err) => {
              if (err) {
                console.log(err);
              }
            });
          }
        });
      } else {
        fs.writeFile(this.appRealPath + '/data/backup/' + date + '.qdat', json, (err) => {
          if (err) {
            console.log(err);
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
              let buffer = data.toString('utf8');
              let backup = JSON.parse(buffer);
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

  shellCommand(command: string) {
    childProcess.exec(command);
  }
  reloadProgram() {
    this.appWindow.reload();
  }
  fullScreen(status: boolean) {
    this.appWindow.setFullScreen(status);
  }
  exitProgram() {
    this.app.quit();
  }
  openDevTools() {
    this.appWebContents.openDevTools();
  }
}