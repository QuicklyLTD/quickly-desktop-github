import { ipcMain } from 'electron';

ipcMain.on('printTest', (event, device) => {
  console.log('Mock printTest called for device:', device);
  event.sender.send('error', 'Yazıcıya Ulaşılamıyor (Mock Mode)');
});

ipcMain.on('printOrder', (event, device, table, orders, owner) => {
  console.log('Mock printOrder called:', { device, table, orders, owner });
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

ipcMain.on('printEndDay', (event, device, data, logo) => {
  console.log('Mock printEndDay called:', { device, data });
});
