import { ipcMain } from 'electron';
const proc = require('child_process');

var i = 0;

ipcMain.on('startScaler', (event) => {
    const shell = proc.spawn('sudo', ['od', '/dev/ttyS0', '-a']);
    shell.stdin.write("asdtd155+1" + '\n');

    shell.stdout.on('data', (data) => {
        event.sender.send('scalerData', data);
    });

    shell.stderr.on('data', (data) => {
        event.sender.send('scalerError', data);
    });

    shell.on('error', (data) => {
        event.sender.send('scalerError', data);
    });

    shell.on('message', (msg) => {
        event.sender.send('scalerError', msg);
    });

    shell.on('close', (code) => {
        event.sender.send('scalerError', code);
    });
});
