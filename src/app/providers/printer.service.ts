import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { MessageService } from './message.service';
import { SettingsService } from '../services/settings.service';
import { Order } from '../mocks/order';
import { PrintOut, PrintOutStatus } from '../mocks/print';
import { MainService } from '../services/main.service';

@Injectable()
export class PrinterService {
  storeLogo: string;
  quicklyLogo: string;
  storeInfo: any;

  constructor(
    private electron: ElectronService,
    private mainService: MainService,
    private messageService: MessageService,
    private settings: SettingsService
  ) {
    this.storeLogo = this.electron.appRealPath + '/data/customer.png';
    this.quicklyLogo = this.electron.appPath + '/assets/quickly.png';

    this.electron.ipcRenderer.on('error', (event, message, check, device) => {
      this.messageService.sendMessage(message);
      const newPrint = new PrintOut('Check', PrintOutStatus.WAITING, check._id, device);
      this.mainService.addData('prints', newPrint).then(isSended => {
        console.log('Print Sended!');
      }).catch(err => {
        console.log('Hata Yazıcıya Ulaşılamadı');
      });
    });
  }

  printTest(device) {
    this.electron.ipcRenderer.send('printTest', device);
  }

  printOrder(device, table, orders, owner) {
    const ordersArray = [];
    orders.forEach(element => {
      const contains = ordersArray.some(obj => obj.name === element.name && obj.note === element.note);
      if (contains) {
        const index = ordersArray.findIndex(obj => obj.name === element.name && obj.note === element.note);
        ordersArray[index].price += element.price;
        ordersArray[index].count++;
      } else {
        const schema = { name: element.name, note: element.note, price: element.price, count: 1 };
        ordersArray.push(schema);
      }
    });
    this.electron.ipcRenderer.send('printOrder', device, table, ordersArray, owner);
  }

  printTableOrder(device, table, order: Order) {
    const ordersArray = [];
    order.items.forEach(element => {
      const contains = ordersArray.some(obj => obj.name === element.name && obj.note === element.note);
      if (contains) {
        const index = ordersArray.findIndex(obj => obj.name === element.name && obj.note === element.note);
        ordersArray[index].price += element.price;
        ordersArray[index].count++;
      } else {
        const schema = { name: element.name, note: element.note, price: element.price, count: 1 };
        ordersArray.push(schema);
      }
    });
    this.electron.ipcRenderer.send('printOrder', device, table, ordersArray, order.user.name);
  }

  printCheck(device, table, check) {
    const productsArray = [];
    const payedArray = [];
    check.products.forEach(element => {
      const contains = productsArray.some(obj => obj.name === element.name && obj.note === element.note && obj.price === element.price);
      if (contains) {
        const index = productsArray.findIndex(obj => obj.name === element.name && obj.note === element.note && obj.price === element.price);
        productsArray[index].total_price += element.price;
        productsArray[index].count++;
      } else {
        const schema = {
          name: element.name, note: element.note, price: element.price,
          total_price: element.price, count: 1, status: element.status
        };
        productsArray.push(schema);
      }
    });
    if (check.payment_flow) {
      let payed = [];
      if (check.payment_flow.length > 1) {
        const things = check.payment_flow.map(obj => obj.payed_products);
        things.forEach(element => {
          payed = payed.concat(element);
        });
      } else {
        payed = check.payment_flow[0].payed_products;
      }
      payed.forEach(element => {
        const contains = payedArray.some(obj => obj.name === element.name && obj.note === element.note && obj.price === element.price);
        if (contains) {
          const index = payedArray.findIndex(obj => obj.name === element.name && obj.note === element.note && obj.price === element.price);
          payedArray[index].total_price += element.price;
          payedArray[index].count++;
        } else {
          const schema = {
            name: element.name, note: element.note, price: element.price,
            total_price: element.price, count: 1, status: element.status
          };
          payedArray.push(schema);
        }
      });
    }
    const newCheck = Object.assign({}, check);
    newCheck.products = productsArray;
    newCheck.payed_products = payedArray;
    this.electron.ipcRenderer.send('printCheck', device, newCheck, table, this.storeLogo, '');
  }

  printPayment(device, table, payment) {
    const productsArray = [];
    payment.payed_products.forEach(element => {
      const contains = productsArray.some(obj => obj.name === element.name && obj.note === element.note);
      if (contains) {
        const index = productsArray.findIndex(obj => obj.name === element.name && obj.note === element.note);
        productsArray[index].total_price += element.price;
        productsArray[index].count++;
      } else {
        const schema = {
          name: element.name, note: element.note, price: element.price,
          total_price: element.price, count: 1, status: element.status
        };
        productsArray.push(schema);
      }
    });
    payment.payed_products = productsArray;
    this.electron.ipcRenderer.send('printPayment', device, payment, table, this.storeLogo);
  }

  printEndDay(device, EndDayData) {
    this.electron.ipcRenderer.send('printEndDay', device, EndDayData, this.quicklyLogo);
  }

  printReport(device, category, reports) {
    this.electron.ipcRenderer.send('printReport', device, category, reports);
  }

  printCancel(device, product, reason, table, owner) {
    this.electron.ipcRenderer.send('printCancel', device, product, reason, table, owner);
  }

  printQRCode(device, data, table, owner) {
    this.electron.ipcRenderer.send('printQRcode', device, data, table, owner);
  }

  kickCashdraw(device) {
    console.log('kickMustWork', device);
    this.electron.ipcRenderer.send('kickCashdraw', device);
  }

  getUSBPrinters() {
    console.log('Mock getUSBPrinters called');
    return [];
  }

  getSerialPrinters(path: string) {
    console.log('Mock getSerialPrinters called');
    return null;
  }
}
