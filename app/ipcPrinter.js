"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.ipcMain.on('printTest', (event, device) => {
    console.log('Mock printTest called for device:', device);
    event.sender.send('error', 'Yazıcıya Ulaşılamıyor (Mock Mode)');
});
electron_1.ipcMain.on('printOrder', (event, device, table, orders, owner) => {
    console.log('Mock printOrder called:', { device, table, orders, owner });
});
electron_1.ipcMain.on('printOrderInd', (event, device, table, orders, owner) => {
    console.log('Mock printOrderInd called:', { device, table, orders, owner });
});
electron_1.ipcMain.on('printQRcode', (event, device, data, table, owner) => {
    console.log('Mock printQRcode called:', { device, data, table, owner });
});
electron_1.ipcMain.on('printCheck', (event, device, check, table, logo, storeInfo) => {
    console.log('Mock printCheck called:', { device, check, table });
});
electron_1.ipcMain.on('printPayment', (event, device, payment, table, logo) => {
    console.log('Mock printPayment called:', { device, payment, table });
});
electron_1.ipcMain.on('printCancel', (event, device, product, reason, table, owner) => {
    console.log('Mock printCancel called:', { device, product, reason, table, owner });
});
electron_1.ipcMain.on('kickCashdraw', (event, device) => {
    console.log('Mock kickCashdraw called:', { device });
});
electron_1.ipcMain.on('printReport', (event, device, category, reports) => {
    console.log('Mock printReport called:', { device, category });
});
electron_1.ipcMain.on('printEndDay', (event, device, data, logo) => {
    console.log('Mock printEndDay called:', { device, data });
});
//# sourceMappingURL=ipcPrinter.js.map