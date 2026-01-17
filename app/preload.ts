import { contextBridge, ipcRenderer } from 'electron';
import * as fs from 'fs';
import * as os from 'os';
import * as childProcess from 'child_process';

const ipcSendChannels = [
  'appServer',
  'app-fullscreen',
  'app-reload',
  'app-relaunch',
  'app-quit',
  'app-devtools',
  'startCaller',
  'startScaler',
  'closeScaler',
  'printOrder',
  'printTest',
  'printCheck',
  'printPayment',
  'printEndDay',
  'printReport',
  'printCancel',
  'printQRcode',
  'kickCashdraw',
  'closeServer'
];

const ipcOnChannels = [
  'callerError',
  'phoneRequest',
  'callerPath',
  'scalerError',
  'scalerData',
  'error'
];

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, ...args: unknown[]) => {
      if (ipcSendChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args);
      }
    },
    on: (channel: string, listener: (...args: unknown[]) => void) => {
      if (ipcOnChannels.includes(channel)) {
        ipcRenderer.on(channel, (_event, ...args) => listener(...args));
      }
    },
    removeListener: (channel: string, listener: (...args: unknown[]) => void) => {
      if (ipcOnChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, listener as any);
      }
    }
  },
  fs: {
    existsSync: (path: string) => fs.existsSync(path),
    mkdirSync: (path: string, options?: fs.MakeDirectoryOptions) => fs.mkdirSync(path, options),
    writeFileSync: (path: string, data: string | NodeJS.ArrayBufferView) => fs.writeFileSync(path, data),
    exists: (path: string, cb: (exists: boolean) => void) => fs.exists(path, cb),
    readFile: (path: string, cb: (err: NodeJS.ErrnoException | null, data: Buffer) => void) =>
      fs.readFile(path, cb),
    appendFile: (path: string, data: string, cb: (err: NodeJS.ErrnoException | null) => void) =>
      fs.appendFile(path, data, cb),
    mkdir: (path: string, cb: (err: NodeJS.ErrnoException | null) => void) => fs.mkdir(path, cb)
  },
  os: {
    networkInterfaces: () => os.networkInterfaces()
  },
  childProcess: {
    exec: (command: string, cb: (error: childProcess.ExecException | null, stdout: string, stderr: string) => void) =>
      childProcess.exec(command, cb),
    spawn: (command: string, args?: readonly string[], options?: childProcess.SpawnOptions) =>
      childProcess.spawn(command, args, options)
  },
  process: {
    cwd: () => process.cwd()
  }
});
