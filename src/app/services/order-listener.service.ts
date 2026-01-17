import { Injectable } from '@angular/core';
import { MainService } from './main.service';
import { PrinterService } from '../providers/printer.service';
import { Order, OrderStatus, OrderType } from '../mocks/order';
import { Check, CheckProduct } from '../mocks/check';
import { Table } from '../mocks/table';
import { Category } from '../mocks/product';

/**
 * OrderListenerService
 * Handles order change detection and printer routing
 */
@Injectable()
export class OrderListenerService {
  private onSync = false;

  constructor(
    private mainService: MainService,
    private printerService: PrinterService
  ) {}

  /**
   * Sets sync status
   */
  setOnSync(status: boolean) {
    this.onSync = status;
  }

  /**
   * Starts listening to order changes and routes to appropriate printers
   */
  startOrderListener() {
    console.log('Order Listener Process Started');
    this.mainService.getAllBy('settings', { key: 'Printers' }).then(prints => {
      const printers = prints.docs[0].value;
      this.mainService.LocalDB['orders'].changes({
        since: 'now',
        live: true,
        include_docs: true
      }).on('change', (res) => {
        if (!this.onSync) {
          const orderDoc: Order = res.doc;
          console.log(orderDoc);
          if (orderDoc.status === OrderStatus.APPROVED && orderDoc.type !== OrderType.EMPLOOYEE) {
            this.mainService.getAllBy('categories', {}).then(cats => {
              const categories = cats.docs;
              this.mainService.getData('checks', orderDoc.check).then(check => {
                if (check) {
                  return check;
                } else {
                  return this.mainService.getData('closed_checks', orderDoc.check);
                }
              }).then((check: Check) => {
                if (check) {
                  const safeTableName = check.table_id || check.note || 'Masa Bulunamadı';
                  this.mainService.getData('tables', check.table_id).then((table: Table) => {
                    const tableName = table ? table.name : safeTableName;

                    const orders: Array<CheckProduct> = check.products.filter(product =>
                      orderDoc.timestamp === product.timestamp
                    );
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
                      });
                      splitPrintArray.forEach(order => {
                        this.printerService.printOrder(
                          order.printer,
                          tableName,
                          order.products,
                          orderDoc.user.name + (orderDoc.type === OrderType.INSIDE ? ' (Müşteri)' : '(El Terminali)')
                        );
                      });
                    };
                  });
                } else {
                  console.log('Order Check Not Found');
                }
              }).catch(err => {
                console.log(err);
              });
            })
          }
        }
      });
    })
  }
}
