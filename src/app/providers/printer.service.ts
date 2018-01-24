import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { MessageService } from './message.service';
import { SettingsService } from '../services/settings.service';
import { Printer } from '../mocks/settings.mock';
import { Check } from '../mocks/check.mock';
import * as escpos from 'escpos';

@Injectable()
export class PrinterService {
  storeLogo: string;
  quicklyLogo: string;
  storeInfo: any;

  constructor(private electron: ElectronService, private messageService: MessageService, private settings: SettingsService) {
    this.storeLogo = this.electron.appRealPath + '/data/customer.png';
    this.quicklyLogo = this.electron.appPath + '/assets/quickly.png';
    this.electron.ipcRenderer.on('error', (event, message) => {
      this.messageService.sendMessage(message);
    });
    this.storeInfo = JSON.parse(localStorage['RestaurantInfo']);
  }

  printTest(device) {
    this.electron.ipcRenderer.send('printTest', device);
  }

  printOrder(device, table, orders) {
    let ordersArray = [];
    orders.forEach(element => {
      let contains = ordersArray.some(obj => obj.name == element.name && obj.note == element.note);
      if (contains) {
        let index = ordersArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        ordersArray[index].price += element.price;
        ordersArray[index].count++;
      } else {
        let schema = { name: element.name, note: element.note, price: element.price, count: 1 };
        ordersArray.push(schema);
      }
    });
    this.electron.ipcRenderer.send('printOrder', device, table, ordersArray, orders[0].owner);
  }

  printCheck(device, table, check) {
    let ordersArray = [];
    check.products.forEach(element => {
      let contains = ordersArray.some(obj => obj.name == element.name && obj.note == element.note);
      if (contains) {
        let index = ordersArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        ordersArray[index].total_price += element.price;
        ordersArray[index].count++;
      } else {
        let schema = { name: element.name, note: element.note, price: element.price, total_price: element.price, count: 1, status: element.status};
        ordersArray.push(schema);
      }
    });
    let newCheck = Object.assign({}, check);
    newCheck.products = ordersArray;
    this.electron.ipcRenderer.send('printCheck', device, newCheck, table, this.storeLogo, this.storeInfo);
  }

  printPayment(device, table, payment){
    let ordersArray = [];
    payment.payed_products.forEach(element => {
      let contains = ordersArray.some(obj => obj.name == element.name && obj.note == element.note);
      if (contains) {
        let index = ordersArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        ordersArray[index].total_price += element.price;
        ordersArray[index].count++;
      } else {
        let schema = { name: element.name, note: element.note, price: element.price, total_price: element.price, count: 1, status: element.status};
        ordersArray.push(schema);
      }
    });
    payment.payed_products = ordersArray;
    this.electron.ipcRenderer.send('printPayment', device, payment, table, this.storeLogo);
  }

  printReport(device, EndDayData) {
    this.electron.ipcRenderer.send('printReport', device, EndDayData, this.quicklyLogo);
  }

  getUSBPrinters() {
    return escpos.USB.findPrinter();
  }
}