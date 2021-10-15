import { ipcMain } from 'electron';
const proc = require('child_process');


// import { SerialPort } from '@serialport';

// const SerialPort = require('serialport');
// const Readline = SerialPort.parsers.Readline;
// const port = new SerialPort('/dev/ttyS0');
// const scalerReader = new Readline();
// ROBOT ONLINE

// Creating the parser and piping can be shortened to
// const parser = port.pipe(new Readline())


// function listSerialPorts() {
//   return SerialPort.list().then((ports, err) => {
//     if (err) {
//       console.log(err);
//       return
//     } else {
//       if (ports.length === 0) {
//         console.log('No ports discovered')
//       } else {
//         return ports;
//       }
//     }
//   })
// }

// port.pipe(scalerReader)
// scalerReader.on('data', (data) => {
//   event.sender.send('scalerData', data);
// });

// setInterval(() => port.write('test'),1000)
// // Set a timeout that will check for new serialPorts every 2 seconds.
// // This timeout reschedules itself.

// setInterval(() => listSerialPorts().then(ports => event.sender.send('scalerData', ports)), 2000)


// port.on('data', function (data) {
//   console.log('Data:', data)
//   event.sender.send('scalerData', data);
// })

ipcMain.on('startScaler', (event) => {
  const shell = proc.spawn('cat', ['/dev/ttyS0']);
  // shell.stdin.write("asdtd155+1" + '\n');


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
