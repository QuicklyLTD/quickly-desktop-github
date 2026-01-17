import { Injectable } from '@angular/core';
import type { IpcRenderer, WebFrame } from 'electron';
import type * as childProcess from 'child_process';
import type * as fs from 'fs';
import type * as os from 'os';
import { Buffer } from 'buffer';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: IpcRenderer;
  webFrame: WebFrame;
  childProcess: typeof childProcess;
  fs: typeof fs;
  os: typeof os;

  get fileSystem() {
    return this.fs;
  }

  // Quickly Legacy Properties
  appPath: string = '';
  appRealPath: string = '';
  ipAddress: Array<string> = [];

  constructor() {
    if (this.isElectron) {
      const electronApi = (window as any).electron;
      this.ipcRenderer = electronApi?.ipcRenderer;
      this.webFrame = electronApi?.webFrame;
      this.childProcess = electronApi?.childProcess;
      this.fs = electronApi?.fs;
      this.os = electronApi?.os;

      // Try to get app paths - requires remote or IPC
      try {
          this.appRealPath = electronApi?.process?.cwd?.() || '';
      } catch(e) {
          console.warn('Could not get app path');
      }
    }
  }

  get isElectron(): boolean {
    return !!(window && (window as any).electron && (window as any).electron.ipcRenderer);
  }

  // --- Legacy Methods from Quickly ---

  getLocalIP() {
    if(!this.os) return '127.0.0.1';
    try {
        const interfaces = this.os.networkInterfaces();
        this.ipAddress = [];
        Object.keys(interfaces).forEach(k => {
        interfaces[k].forEach(address => {
            if (address.family === 'IPv4' && !address.internal) {
            this.ipAddress.push(address.address);
            }
        });
        });
        return this.ipAddress[0] || '127.0.0.1';
    } catch (e) {
        console.error('Error getting local IP', e);
        return '127.0.0.1';
    }
  }

  saveLogo(data: string) {
    if(!this.fs) return;
    try {
        const base64Data = data.replace(/^data:image\/png;base64,/, '');
        const binaryData = Buffer.from(base64Data, 'base64');
        const path = (this.appRealPath || '.') + '/data/';

        if (!this.fs.existsSync(path)) {
            this.fs.mkdirSync(path, {recursive: true});
        }
        this.fs.writeFileSync(path + 'customer.png', binaryData);
    } catch(e) { console.error('Error saving logo', e); }
  }

  backupData(data: any, date: string | number) {
      if(!this.fs) return;
      try {
        const json = JSON.stringify(data);
        const filename = String(date);
        const path = (this.appRealPath || '.') + '/data/backup/';
         if (!this.fs.existsSync(path)) {
            this.fs.mkdirSync(path, {recursive: true});
        }
        this.fs.writeFileSync(path + filename, json);
      } catch(e) { console.error('Error backing up data', e); }
  }

  readBackupData(filename: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if(!this.fs) return reject('Electron not available');
      const path = (this.appRealPath || '.') + '/data/backup/' + filename;
      
      this.fs.exists(path, (exists) => {
        if (exists) {
          this.fs.readFile(path, (err, data) => {
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
     // Electron: IPC to main. Browser: best-effort fullscreen API.
     if (this.ipcRenderer) {
       this.ipcRenderer.send('app-fullscreen', status);
       return;
     }
     if (status && document.documentElement.requestFullscreen) {
       document.documentElement.requestFullscreen().catch(() => undefined);
     } else if (!status && document.exitFullscreen) {
       document.exitFullscreen().catch(() => undefined);
     }
  }

  shellCommand(command: string) {
      if(this.childProcess) {
          this.childProcess.exec(command, (error, stdout, stderr) => {
              if (error) console.error(`exec error: ${error}`);
              else console.log(`stdout: ${stdout}`);
          });
      }
  }
  
  shellSpawn(command: string, args?: string[], opts?: any) {
    if (!this.childProcess) return;
    const child = this.childProcess.spawn(command, args, opts);
    child.stdout.on('data', (data) => console.log(`stdout: ${data}`));
    child.stderr.on('data', (data) => console.error(`stderr: ${data}`));
  }

  reloadProgram() {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('app-reload');
      return;
    }
    window.location.reload();
  }

  relaunchProgram() {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('app-relaunch');
      return;
    }
    window.location.reload();
  }

  exitProgram() {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('app-quit');
      return;
    }
    // Browser cannot close arbitrary tabs; best-effort only.
    window.close();
  }

  openDevTools() {
    if (this.ipcRenderer) {
      this.ipcRenderer.send('app-devtools');
    }
  }
}
