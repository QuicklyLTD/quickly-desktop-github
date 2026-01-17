"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const child_process = require("child_process");
const path = require("path");
let i = 0;
electron_1.ipcMain.on('startCaller', (event) => {
    // Path to the 'cidshow' binary. 
    // In development, it's in './drivers/cidshow'.
    // We use process.cwd() which usually points to project root in dev.
    const driverPath = path.join(process.cwd(), 'drivers', 'cidshow');
    console.log('Starting caller service at:', driverPath);
    event.sender.send('callerPath', driverPath);
    // Spawn the process directly. 'unbuffer' is removed as it's not standard on Mac/Windows.
    // If buffering is an issue, we might need a different approach (e.g. pty.js), 
    // but let's try direct spawn first.
    const shell = child_process.spawn(driverPath, [], {
        stdio: ['ignore', 'pipe', 'pipe'] // Pipe stdout/stderr
    });
    shell.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Caller Output:', output);
        event.sender.send('callerError', output);
        // Logic from old project:
        i++;
        if (i > 2) {
            event.sender.send('phoneRequest', output);
        }
    });
    shell.stderr.on('data', (data) => {
        console.error('Caller Error:', data.toString());
        event.sender.send('callerError', data.toString());
    });
    shell.on('error', (err) => {
        console.error('Caller Spawn Error:', err.message);
        event.sender.send('callerError', err.message);
    });
    shell.on('close', (code) => {
        console.log('Caller exited with code', code);
        event.sender.send('callerError', `Exited with code ${code}`);
    });
});
//# sourceMappingURL=callerServer.js.map