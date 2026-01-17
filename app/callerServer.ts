import { ipcMain, IpcMainEvent } from 'electron';
import * as child_process from 'child_process';
import * as path from 'path';

let i = 0;

ipcMain.on('startCaller', (event: IpcMainEvent) => {
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

  shell.stdout.on('data', (data: Buffer) => {
    const output = data.toString();
    console.log('Caller Output:', output);
    event.sender.send('callerError', output);
    
    // Logic from old project:
    i++;
    if (i > 2) {
      event.sender.send('phoneRequest', output);
    }
  });

  shell.stderr.on('data', (data: Buffer) => {
    console.error('Caller Error:', data.toString());
    event.sender.send('callerError', data.toString());
  });

  shell.on('error', (err: Error) => {
    console.error('Caller Spawn Error:', err.message);
    event.sender.send('callerError', err.message);
  });

  shell.on('close', (code: number) => {
    console.log('Caller exited with code', code);
    event.sender.send('callerError', `Exited with code ${code}`);
  });
});
