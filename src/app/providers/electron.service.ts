import { Injectable } from '@angular/core';
import { app, remote, screen, shell, Remote, App, BrowserWindow, WebContents, ipcRenderer } from 'electron';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as childProcess from 'child_process';

@Injectable()
export class ElectronService {
  electronRemote: Remote;
  app: App;
  appWindow: BrowserWindow;
  appWebContents: WebContents;
  appPath: string;
  appRealPath: string;
  ipcRenderer: typeof ipcRenderer;

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

  shellCommand(command: string) {
    childProcess.exec(command);
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