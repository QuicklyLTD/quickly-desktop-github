import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';

@Injectable()
export class TerminalService {

  constructor(private electron: ElectronService) { }

  printOrders(printers, categories, check, tables) {
    if (printers.length > 0) {
      let orders = check.products.filter(obj => obj.status == 1);
      if (orders.length > 0) {
        let splitPrintArray = [];
        orders.forEach((obj, index) => {
          let catPrinter = categories.filter(cat => cat._id == obj.cat_id)[0].printer || printers[0].name;
          let contains = splitPrintArray.some(element => element.printer.name == catPrinter);
          if (contains) {
            let index = splitPrintArray.findIndex(p_name => p_name.printer.name == catPrinter);
            splitPrintArray[index].products.push(obj);
          } else {
            let thePrinter = printers.filter(obj => obj.name == catPrinter)[0];
            let splitPrintOrder = { printer: thePrinter, products: [obj] };
            splitPrintArray.push(splitPrintOrder);
          }
          if (index == orders.length - 1) {
            let table_name = tables.filter(obj => obj._id == check.table_id)[0].name;
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
    let ordersArray = [];
    orders.forEach(element => {
      let contains = ordersArray.some(obj => obj.name == element.name);
      if (contains) {
        let index = ordersArray.findIndex(obj => obj.name == element.name);
        ordersArray[index].price += element.price;
        ordersArray[index].count++;
      } else {
        let schema = { name: element.name, note: "", price: element.price, count: 1 };
        ordersArray.push(schema);
      }
    });
    this.electron.ipcRenderer.send('printOrder', device, table, ordersArray, orders[0].owner);
  }

}