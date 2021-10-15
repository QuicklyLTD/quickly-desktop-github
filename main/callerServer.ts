import { ipcMain } from 'electron';
const proc = require('child_process');

var i = 0;

ipcMain.on('startCaller', (event) => {
    const shell = proc.spawn('unbuffer', ['/home/quickly/App' + '/cidshow']);

    event.sender.send('callerPath', '/home/quickly/App' + '/cidshow');

    shell.stdout.on('data', (data) => {
        event.sender.send('callerError', data);
        i++
        if (i > 2)
            event.sender.send('phoneRequest', data);
    });

    shell.stderr.on('data', (data) => {
        event.sender.send('callerError', data);
    });

    shell.on('error', (data) => {
        event.sender.send('callerError', data);
    });

    shell.on('message', (msg) => {
        event.sender.send('callerError', msg);
    });

    shell.on('close', (code) => {
        event.sender.send('callerError', code);
    });
});



