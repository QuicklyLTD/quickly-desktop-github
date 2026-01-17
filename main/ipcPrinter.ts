import { EndDay } from '../src/app/mocks/endoftheday';
import { ipcMain } from 'electron';
// import * as escpos from 'escpos';
// import { ClosedCheck } from 'app/mocks/check';

const line = '------------------------------------------------';

// const line = '------------------------------------------';
// const line = '------------------------------------------';
// const line = '------------------------------------------';


ipcMain.on('printTest', (event, device) => {
  console.log('Mock printTest called for device:', device);
  event.sender.send('error', 'Yazıcıya Ulaşılamıyor (Mock Mode)');
});

ipcMain.on('printOrder', (event, device, table, orders, owner) => {
  console.log('Mock printOrder called:', { device, table, orders, owner });
  // Simulate success or error as needed, for now just log
});


ipcMain.on('printOrderInd', (event, device, table, orders, owner) => {
  console.log('Mock printOrderInd called:', { device, table, orders, owner });
});



ipcMain.on('printQRcode', (event, device, data, table, owner) => {
  console.log('Mock printQRcode called:', { device, data, table, owner });
});



ipcMain.on('printCheck', (event, device, check, table, logo, storeInfo) => {
  console.log('Mock printCheck called:', { device, check, table });
});

ipcMain.on('printPayment', (event, device, payment, table, logo) => {
  console.log('Mock printPayment called:', { device, payment, table });
});

ipcMain.on('printCancel', (event, device, product, reason, table, owner) => {
  console.log('Mock printCancel called:', { device, product, reason, table, owner });
});

ipcMain.on('kickCashdraw', (event, device) => {
  console.log('Mock kickCashdraw called:', { device });
});

ipcMain.on('printReport', (event, device, category, reports) => {
  console.log('Mock printReport called:', { device, category });
});

ipcMain.on('printEndDay', (event, device, data: EndDay, logo) => {
  console.log('Mock printEndDay called:', { device, data });
  // Simulate an async operation/error if needed, or just return
});

function repeat(pattern, count) {
  if (count < 1) return '';
  var result = '';
  while (count > 1) {
    if (count & 1) result += pattern;
    count >>= 1, pattern += pattern;
  }
  return result + pattern;
}

function textPad(first, second, lineWidth, diffWidth) {
  let textToReturn = first + repeat(' ', (lineWidth - first.length - second.length) - ((lineWidth - first.length - second.length) - diffWidth)) + repeat(' ', ((lineWidth - first.length - second.length) - diffWidth)) + second;
  return textToReturn;
}

function fitText(header, text, size) {
  header = header.replace('ş', 's').replace('ğ', 'g').replace('İ', 'I').replace('ç','c');
  let space = line.length / size;
  let middleSpace = repeat(' ', space - text.toString().length - header.toString().length);
  let fixed = header + middleSpace + text;
  return fixed;
}

// Mock findDevice
function findDevice(printer) {
  return {}; // Return mock object
}