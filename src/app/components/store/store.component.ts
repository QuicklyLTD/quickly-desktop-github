import { Component, OnInit, ElementRef } from '@angular/core';
import { MainService } from '../../services/main.service';
import { Router } from '@angular/router';
import { Floor, Table } from '../../mocks/table';
import { Check, CheckProduct, CheckType, PaymentStatus } from '../../mocks/check';
import { Order, OrderItem, OrderStatus, OrderType, User } from '../../mocks/order';
import { Ingredient, Product } from '../../mocks/product';
import { SettingsService } from '../../services/settings.service';
import { Stock } from '../../mocks/stocks';
import { Report } from '../../mocks/report';
import { DayInfo } from '../../mocks/settings';
import { logType } from '../../services/log.service';
import { Receipt, ReceiptMethod, ReceiptStatus, ReceiptType } from '../../mocks/receipt';

export interface CountData { product: string; count: number; total: number; };

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss']
})

export class StoreComponent implements OnInit {
  floors: Array<Floor> = [];
  tables: Array<Table> = [];
  tableViews: Array<Table> = [];
  loweredTables: Array<Table>;
  checks: Array<Check> = [];
  checksView: Array<Check> = [];
  fastChecks: Array<Check> = [];
  deliveryChecks: Array<Check> = [];

  products: Array<Product> = [];

  orders: Array<Order> = [];
  ordersView: Array<Order> = [];

  receipts: Array<Receipt> = [];
  receiptsView: Array<Receipt> = [];

  tableChanges: any;
  checkChanges: any;
  orderChanges: any;
  receiptChanges: any;

  selected: string;
  section: any;

  closedDelivery: Array<any>;

  owner: any;
  ownerId: any;
  waitingOrders: number = 0;
  waitingReceipts: number = 0;

  constructor(private mainService: MainService, private router: Router, private settingsService: SettingsService) {

    this.owner = this.settingsService.getUser('name');
    this.ownerId = this.settingsService.getUser('id');

    this.fillData();
    if (localStorage.getItem('selectedSection')) {
      let selectedSection = localStorage['selectedSection'];
      this.section = selectedSection;
    } else {
      this.section = 'Masalar';
    }
  }

  ngOnInit() {
    this.checkChanges = this.mainService.LocalDB['checks'].changes({ since: 'now', live: true }).on('change', (change) => {
      this.mainService.getAllBy('checks', {}).then((result) => {
        this.checks = result.docs;
        if (localStorage.getItem('selectedFloor')) {
          let selectedID = JSON.parse(localStorage['selectedFloor']);
          this.getTablesBy(selectedID);
        }
      });
    });
    this.orderChanges = this.mainService.LocalDB['orders'].changes({ since: 'now', live: true }).on('change', (change) => {
      this.mainService.getAllBy('orders', { type: { $ne: OrderType.EMPLOOYEE } }).then((result) => {
        this.orders = result.docs;
        this.ordersView = this.orders.sort((a, b) => b.timestamp - a.timestamp).filter(order => order.status == OrderStatus.WAITING || order.status == OrderStatus.PREPARING)
        this.waitingOrders = this.ordersView.length;
      });
    });
    this.receiptChanges = this.mainService.LocalDB['receipts'].changes({ since: 'now', live: true }).on('change', (change) => {
      this.mainService.getAllBy('receipts', {}).then((result) => {
        this.receipts = result.docs;
        this.receiptsView = this.receipts.sort((a, b) => b.timestamp - a.timestamp).filter(order => order.status == ReceiptStatus.WAITING || order.status == ReceiptStatus.READY)
        this.waitingReceipts = this.receiptsView.length;
      });
    });
    this.tableChanges = this.mainService.LocalDB['tables'].changes({ since: 'now', live: true }).on('change', (change) => {
      this.mainService.getAllBy('tables', {}).then((result) => {
        this.tables = result.docs;
        this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true, sensitivity: 'base' }));
        this.tableViews = this.tables;
        if (localStorage.getItem('selectedFloor')) {
          let selectedID = JSON.parse(localStorage['selectedFloor']);
          this.getTablesBy(selectedID);
        }
      });
    });
  }

  ngOnDestroy() {
    this.tableChanges.cancel();
    this.checkChanges.cancel();
    this.orderChanges.cancel();
    this.receiptChanges.cancel();
  }

  changeSection(section) {
    this.section = section;
    localStorage.setItem('selectedSection', section);
  }

  getTablesBy(id: string) {
    if (id !== 'All') {
      this.selected = id;
      localStorage.setItem('selectedFloor', JSON.stringify(id));
      this.tableViews = this.tables.filter(obj => obj.floor_id == id);
      this.checksView = this.checks.filter(({ table_id }) => this.tableViews.some(table => table._id == table_id));
      this.ordersView = this.orders.sort((a, b) => b.timestamp - a.timestamp).filter(order => order.status == OrderStatus.WAITING || order.status == OrderStatus.PREPARING).filter(({ check }) => this.checksView.some(obj => obj._id == check));
      this.receiptsView = this.receipts.sort((a, b) => b.timestamp - a.timestamp).filter(receipt => receipt.status == ReceiptStatus.WAITING || receipt.status == ReceiptStatus.READY).filter(({ check }) => this.checksView.some(obj => obj._id == check));
    } else {
      this.selected = '';
      this.tableViews = this.tables;
      this.checksView = this.checks;
      this.ordersView = this.orders.sort((a, b) => b.timestamp - a.timestamp).filter(order => order.status == OrderStatus.WAITING || order.status == OrderStatus.PREPARING);
      this.receiptsView = this.receipts.sort((a, b) => b.timestamp - a.timestamp).filter(receipt => receipt.status == ReceiptStatus.WAITING || receipt.status == ReceiptStatus.READY);
      localStorage.removeItem('selectedFloor');
    }
  }

  getTableTotal(table_id){
    let thatCheck = this.checks.find(check => check.table_id == table_id);
    if(thatCheck){
      return thatCheck.total_price;
    }else{
      return null;
    }
  }

  changePosition(value: any, table: any) {

    console.log('x', value);
    console.log('y', value.layerY, value.offsetY);

    table.position.x += value.layerX;
    table.position.y += value.layerY;
    this.mainService.updateData('tables', table._id, { position: { x: Math.round(table.position.x), y: Math.round(table.position.y), height: table.position.height, width: table.position.width } })

    // let tabletoGo = this.loweredTables.find(({ name }) => name == value);
    // this.router.navigate(['/selling-screen', 'Normal', tabletoGo._id])
  }

  dragStart(value: any, table: any) {
    console.log('x', value);
    console.log('y', value.layerY, value.offsetY);
  }

  filterTables(value: string) {
    let regexp = new RegExp(value, 'i');
    this.tableViews = this.tables.filter(({ name }) => name.match(regexp));
    this.checksView = this.checks.filter(({ table_id }) => this.tableViews.some(table => table._id == table_id));
    this.ordersView = this.orders.sort((a, b) => b.timestamp - a.timestamp).filter(order => order.status == OrderStatus.WAITING || order.status == OrderStatus.PREPARING).filter(({ check }) => this.checksView.some(obj => obj._id == check));
    this.receiptsView = this.receipts.sort((a, b) => b.timestamp - a.timestamp).filter(receipt => receipt.status == ReceiptStatus.WAITING || receipt.status == ReceiptStatus.READY).filter(({ check }) => this.checksView.some(obj => obj._id == check));
  }

  statusNote(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.WAITING:
        return "Onay Bekliyor";
      case OrderStatus.PREPARING:
        return "Hazırlanıyor";
      case OrderStatus.APPROVED:
        return "Onaylandı";
      case OrderStatus.CANCELED:
        return "İptal Edildi";
      case OrderStatus.PAYED:
        return "Ödeme Yapıldı";
      default:
        break;
    }
  }

  acceptOrder(order: Order) {
    order.status = OrderStatus.PREPARING;
    this.mainService.updateData('orders', order._id, { status: OrderStatus.PREPARING }).then(res => {
      console.log(res);
    }).catch(err => {
      console.log(err);
    })
  }

  approoveOrder(order: Order) {
    order.status = OrderStatus.APPROVED;
    let approveTime = Date.now();
    let CountData: Array<CountData> = [];
    this.mainService.changeData('checks', order.check, (check: Check) => {
      order.items.forEach(orderItem => {
        let mappedProduct = this.products.find(product => product._id == orderItem.product_id || product.name == orderItem.name);
        let newProduct = new CheckProduct(mappedProduct._id, mappedProduct.cat_id, mappedProduct.name + (orderItem.type ? ' ' + orderItem.type : ''), orderItem.price, orderItem.note, 2, this.ownerId, approveTime, mappedProduct.tax_value, mappedProduct.barcode);
        this.countProductsData(CountData, newProduct.id, newProduct.price)
        check.total_price = check.total_price + newProduct.price;
        check.products.push(newProduct);
      })
      return check;
    }).then(isOk => {
      this.updateProductReport(CountData);
      this.mainService.updateData('orders', order._id, { status: OrderStatus.APPROVED, timestamp: approveTime }).then(res => {
        // console.log(res);
      }).catch(err => {
        console.log(err);
      })
    }).catch(err => {
      console.log(err);
    })
  }

  cancelOrder(order: Order) {
    order.status = OrderStatus.CANCELED;
    this.mainService.updateData('orders', order._id, { status: OrderStatus.CANCELED }).then(res => {
      console.log(res);
    }).catch(err => {
      console.log(err);
    })
  }

  acceptReceipt(receipt: Receipt) {
    receipt.status = ReceiptStatus.READY;
    receipt.timestamp = Date.now();
    this.mainService.updateData('receipts', receipt._id, { status: ReceiptStatus.READY }).then(res => {
      console.log(res);
    }).catch(err => {
      console.log(err);
    })
  }

  approoveReceipt(receipt: Receipt) {
    // const orderRequestType: any = this.checks.find(check => check._id == receipt.check);
    // switch (receipt.type == ReceiptType.) {
    // case 'checks':
    let Check: Check = this.checks.find(check => check._id == receipt.check);
    let User: User = receipt.user;
    let userItems = receipt.orders.filter(order => order.status == OrderStatus.APPROVED);

    userItems.map(obj => {
      obj.status = OrderStatus.PAYED;
      return obj;
    })

    let productsWillPay: Array<CheckProduct> = Check.products.filter(product => userItems.map(obj => obj.timestamp).includes(product.timestamp));

    let receiptMethod: 'Nakit' | 'Kart' | 'Kupon' | 'İkram' = (receipt.method == ReceiptMethod.CARD ? 'Kart' : receipt.method == ReceiptMethod.CASH ? 'Nakit' : receipt.method == ReceiptMethod.COUPON ? 'Kupon' : 'İkram')

    const newPayment: PaymentStatus = { owner: User.name, method: receiptMethod, amount: receipt.total, discount: receipt.discount, timestamp: Date.now(), payed_products: productsWillPay };

    if (Check.payment_flow == undefined) {
      Check.payment_flow = [];
    }

    Check.payment_flow.push(newPayment);
    Check.discount += newPayment.amount;
    Check.products = Check.products.filter(product => !productsWillPay.includes(product));
    Check.total_price = Check.products.map(product => product.price).reduce((a, b) => a + b, 0);


    receipt.status = ReceiptStatus.APPROVED;
    receipt.timestamp = Date.now();

    this.mainService.LocalDB['allData'].bulkDocs(userItems).then(order_res => {

      this.mainService.updateData('receipts', receipt._id, { status: ReceiptStatus.APPROVED, timestamp: Date.now() }).then(isOK => {

        this.mainService.updateData('checks', Check._id, Check).then(isCheckUpdated => {
          if (isCheckUpdated.ok) {

          }

        }).catch(err => {
          console.log('Check Update Error on Payment Process', err);
        })
      }).catch(err => {
        console.log('Receipt Update Error on Payment Process', err);
      })
    }).catch(err => {
      console.log('Orders Update Error on Payment Process', err);
    })
    //   break;
    // case 'customers':
    //   let Customer = orderRequestType;
    //   receipt.status = ReceiptStatus.APPROVED;
    //   delete receipt.orders[0]._rev;
    //   this.mainService.LocalDB['allData'].put(receipt.orders[0]).then(order_res => {
    //     receipt.orders[0].status = OrderStatus.PREPARING;
    //     delete receipt._rev;
    //     this.mainService.LocalDB['allData'].put(receipt).then(isOk => {
    //     }).catch(err => {
    //       console.log(err);
    //     })
    //   }).catch(err => {
    //     console.log(err);
    //   })
    //   break;
    // default:
    //   break;
    // }
  }

  cancelReceipt(receipt: Receipt) {
    receipt.status = ReceiptStatus.CANCELED;
    receipt.timestamp = Date.now();
    this.mainService.updateData('receipts', receipt._id, { status: ReceiptStatus.CANCELED }).then(res => {
      console.log(res);
    }).catch(err => {
      console.log(err);
    })
  }

  paymentNote(method: ReceiptMethod): string {
    switch (method) {
      case ReceiptMethod.CASH:
        return "Nakit";
      case ReceiptMethod.CARD:
        return "Kredi Kartı";
      case ReceiptMethod.COUPON:
        return "Yemek Kartı - Kupon";
      case ReceiptMethod.MOBILE:
        return "Mobil Ödeme";
      case ReceiptMethod.CRYPTO:
        return "Bitcoin";
      default:
        break;
    }
  }

  paymentStatus(status: ReceiptStatus): string {
    switch (status) {
      case ReceiptStatus.WAITING:
        return "Onay Bekliyor";
      case ReceiptStatus.READY:
        return "İşlemde";
      case ReceiptStatus.APPROVED:
        return "Onaylandı";
      case ReceiptStatus.CANCELED:
        return "İptal Edildi";
      default:
        break;
    }
  }

  isOwner(check_id: string) {
    const checkThatProcess = this.checks.find(obj => obj._id == check_id);
    return (checkThatProcess.owner == this.owner ? true : false);
  }

  fillData() {
    this.selected = '';
    this.mainService.getAllBy('products', {}).then((result) => {
      this.products = result.docs;
    });
    this.mainService.getAllBy('floors', {}).then((result) => {
      this.floors = result.docs;
      this.floors = this.floors.sort((a, b) => a.timestamp - b.timestamp);
    });
    this.mainService.getAllBy('checks', {}).then(res => {
      this.checks = res.docs;
      this.checksView = this.checks;
      this.fastChecks = this.checks.filter(obj => obj.type == CheckType.FAST);
      this.deliveryChecks = this.checks.filter(obj => obj.type == CheckType.ORDER);
    })
    this.mainService.getAllBy('closed_checks', { type: CheckType.ORDER }).then(res => {
      this.closedDelivery = res.docs.sort((a, b) => b.timestamp - a.timestamp);
      try {
        this.deliveryChecks.forEach(check => {
          this.closedDelivery.unshift(check);
        })
      } catch (error) {
        console.log(error);
      }
    })
    this.mainService.getAllBy('orders', { type: { $ne: OrderType.EMPLOOYEE }}).then(res => {
      this.orders = res.docs;
      this.ordersView = this.orders.sort((a, b) => b.timestamp - a.timestamp).filter(order => order.status == OrderStatus.WAITING || order.status == OrderStatus.PREPARING)
      this.waitingOrders = this.ordersView.length;
    })
    this.mainService.getAllBy('receipts', {}).then(res => {
      this.receipts = res.docs;
      this.receiptsView = this.receipts.sort((a, b) => b.timestamp - a.timestamp).filter(receipt => receipt.status == ReceiptStatus.WAITING || receipt.status == ReceiptStatus.READY)
      this.waitingReceipts = this.receiptsView.length;
    })
    this.mainService.getAllBy('tables', {}).then((result) => {
      this.tables = result.docs;
      this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true, sensitivity: 'base' }));
      this.loweredTables = JSON.parse(JSON.stringify(result.docs));
      this.loweredTables.map(obj => {
        obj.name = obj.name.replace(/-/g, '').toLowerCase();
        return obj;
      });
      this.tableViews = this.tables;
      if (localStorage.getItem('selectedFloor')) {
        let selectedID = JSON.parse(localStorage['selectedFloor']);
        this.getTablesBy(selectedID);
      }
    });
  }

  findTable(check_id: string) {
    const check = this.checks.find(obj => obj._id == check_id);
    const table = this.tables.find(obj => obj._id == check.table_id);
    return table.name;
  }

  countProductsData = (counDataArray: Array<CountData>, id: string, price: number, manuelCount?: number): Array<CountData> => {
    let countObj: CountData;
    if (manuelCount) {
      countObj = { product: id, count: manuelCount, total: price };
    } else {
      countObj = { product: id, count: 1, total: price };
    }
    let contains = counDataArray.some(obj => obj.product === id);
    if (contains) {
      let index = counDataArray.findIndex(p_id => p_id.product == id);
      if (manuelCount) {
        counDataArray[index].count += manuelCount;
      } else {
        counDataArray[index].count++;
      }
      counDataArray[index].total += price;
    } else {
      counDataArray.push(countObj);
    }
    return counDataArray;
  }

  updateProductReport = async (count_data: Array<CountData>): Promise<boolean> => {
    try {
      const StoreDayInfo: DayInfo = await (await this.mainService.LocalDB['allData'].find({ selector: { key: 'DateSettings' } })).docs[0].value;
      const Month = new Date(StoreDayInfo.time).getMonth();

      count_data.forEach(async (obj: CountData) => {
        const ProductReport: Report = await (await this.mainService.LocalDB['allData'].find({ selector: { db_name: 'reports', connection_id: obj.product } })).docs[0];
        const ProductRecipe: Array<Ingredient> = await (await this.mainService.LocalDB['allData'].find({ selector: { db_name: 'recipes', product_id: obj.product } })).docs[0];
        if (ProductReport) {
          this.mainService.LocalDB['allData'].upsert(ProductReport._id, (doc: Report) => {
            doc.count += obj.count;
            doc.amount += obj.total;
            doc.timestamp = Date.now();
            doc.weekly[StoreDayInfo.day] += obj.total;
            doc.weekly_count[StoreDayInfo.day] += obj.count;
            doc.monthly[Month] += obj.total;
            doc.weekly_count[Month] += obj.count;
            return doc;
          })
        }
        if (ProductRecipe) {
          ProductRecipe.forEach(ingredient => {
            let downStock = ingredient.amount * obj.count;
            this.mainService.LocalDB['allData'].upsert(ingredient.stock_id, (doc: Stock) => {
              doc.left_total -= downStock;
              doc.quantity = doc.left_total / doc.total;
              if (doc.left_total < doc.warning_limit) {
                if (doc.left_total <= 0) {
                  doc.left_total = 0;
                  // this.logService.createLog(logType.STOCK_CHECKPOINT, doc._id, `${doc.name} adlı stok tükendi!`);
                } else {
                  // this.logService.createLog(logType.STOCK_CHECKPOINT, doc._id, `${doc.name} adlı stok bitmek üzere! - Kalan: '${doc.left_total + ' ' + doc.unit}'`);
                }
              }
              return doc;
            });
          });
        }
      });
      return true;
    } catch (error) {
      console.log(error);
    }
  }
}
