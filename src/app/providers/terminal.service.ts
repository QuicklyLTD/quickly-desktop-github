import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';

@Injectable()
export class TerminalService {

  constructor(private electron: ElectronService) { }

  printOrders(printers, categories, check, tables) {
    if (printers.length > 0) {
      const orders = check.products.filter(obj => obj.status === 1);
      if (orders.length > 0) {
        const splitPrintArray = [];
        orders.forEach((obj, index) => {
          const catPrinter = categories.filter(cat => cat._id === obj.cat_id)[0].printer || printers[0].name;
          const contains = splitPrintArray.some(element => element.printer.name === catPrinter);
          if (contains) {
            const sIndex = splitPrintArray.findIndex(p_name => p_name.printer.name === catPrinter);
            splitPrintArray[sIndex].products.push(obj);
          } else {
            const thePrinter = printers.filter(p => p.name === catPrinter)[0];
            const splitPrintOrder = { printer: thePrinter, products: [obj] };
            splitPrintArray.push(splitPrintOrder);
          }
          if (index === orders.length - 1) {
            const table_name = tables.filter(t => t._id === check.table_id)[0].name;
            // if (check.type == 2) {
            //   table_name = 'Hızlı Satış';
            // } else {
            //   table_name = table.name;
            // }
            splitPrintArray.forEach(order => {
              this.printOrder(order.printer, table_name, order.products);
            });
          }
        });
      }
    }
  }

  printOrder(device, table, orders) {
    const ordersArray = [];
    orders.forEach(element => {
      const contains = ordersArray.some(obj => obj.name === element.name);
      if (contains) {
        const index = ordersArray.findIndex(obj => obj.name === element.name);
        ordersArray[index].price += element.price;
        ordersArray[index].count++;
      } else {
        const schema = { name: element.name, note: '', price: element.price, count: 1 };
        ordersArray.push(schema);
      }
    });
    this.electron.ipcRenderer.send('printOrder', device, table, ordersArray, orders[0].owner);
  }

}
