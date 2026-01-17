"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const fs = require("fs");
const os = require("os");
const childProcess = require("child_process");
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
electron_1.contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, ...args) => {
            if (ipcSendChannels.includes(channel)) {
                electron_1.ipcRenderer.send(channel, ...args);
            }
        },
        on: (channel, listener) => {
            if (ipcOnChannels.includes(channel)) {
                electron_1.ipcRenderer.on(channel, (_event, ...args) => listener(...args));
            }
        },
        removeListener: (channel, listener) => {
            if (ipcOnChannels.includes(channel)) {
                electron_1.ipcRenderer.removeListener(channel, listener);
            }
        }
    },
    fs: {
        existsSync: (path) => fs.existsSync(path),
        mkdirSync: (path, options) => fs.mkdirSync(path, options),
        writeFileSync: (path, data) => fs.writeFileSync(path, data),
        exists: (path, cb) => fs.exists(path, cb),
        readFile: (path, cb) => fs.readFile(path, cb),
        appendFile: (path, data, cb) => fs.appendFile(path, data, cb),
        mkdir: (path, cb) => fs.mkdir(path, cb)
    },
    os: {
        networkInterfaces: () => os.networkInterfaces()
    },
    childProcess: {
        exec: (command, cb) => childProcess.exec(command, cb),
        spawn: (command, args, options) => childProcess.spawn(command, args, options)
    },
    process: {
        cwd: () => process.cwd()
    }
});
//# sourceMappingURL=preload.js.map