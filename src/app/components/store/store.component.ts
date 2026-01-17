import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core';
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
import { EntityStoreService } from '../../services/entity-store.service';

export interface CountData { product: string; count: number; total: number; };

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss']
})

export class StoreComponent implements OnInit, OnDestroy {
  floors: Array<Floor> = [];
  tables: Array<Table> = [];
  tableViews: Array<Table> = [];
  loweredTables: Array<Table>;
  checks: Array<Check> = [];
  checksView: Array<Check> = [];
  fastChecks: Array<Check> = [];
  deliveryChecks: Array<Check> = [];

  // Lookup maps for resolved entity names
  tableNames: Map<string, string> = new Map();

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
  waitingOrders = 0;
  waitingReceipts = 0;

  constructor(
    private mainService: MainService,
    private router: Router,
    private settingsService: SettingsService,
    private entityStoreService: EntityStoreService
  ) {
    this.owner = this.settingsService.getUser('name');
    this.ownerId = this.settingsService.getUser('id');

    this.fillData();
    if (localStorage.getItem('selectedSection')) {
      const selectedSection = localStorage['selectedSection'];
      this.section = selectedSection;
    } else {
      this.section = 'Masalar';
    }
  }

  ngOnInit() {
    this.checkChanges = this.mainService.LocalDB['checks'].changes({ since: 'now', live: true }).on('change', () => {
      this.mainService.getAllBy('checks', {}).then((result) => {
        this.checks = result.docs;
        this.resolveTableNames();
        if (localStorage.getItem('selectedFloor')) {
          const selectedID = JSON.parse(localStorage['selectedFloor']);
          this.getTablesBy(selectedID);
        }
      });
    });
    this.orderChanges = this.mainService.LocalDB['orders'].changes({ since: 'now', live: true }).on('change', () => {
      this.mainService.getAllBy('orders', { type: { $ne: OrderType.EMPLOOYEE } }).then((result) => {
        this.orders = result.docs;
        this.ordersView = this.orders.sort((a, b) => b.timestamp - a.timestamp)
          .filter(order => order.status === OrderStatus.WAITING || order.status === OrderStatus.PREPARING);
        this.waitingOrders = this.ordersView.length;
      });
    });
    this.receiptChanges = this.mainService.LocalDB['receipts'].changes({ since: 'now', live: true }).on('change', () => {
      this.mainService.getAllBy('receipts', {}).then((result) => {
        this.receipts = result.docs;
        this.receiptsView = this.receipts.sort((a, b) => b.timestamp - a.timestamp)
          .filter(order => order.status === ReceiptStatus.WAITING || order.status === ReceiptStatus.READY);
        this.waitingReceipts = this.receiptsView.length;
      });
    });
    this.tableChanges = this.mainService.LocalDB['tables'].changes({ since: 'now', live: true }).on('change', () => {
      this.mainService.getAllBy('tables', {}).then((result) => {
        this.tables = result.docs;
        this.tables = this.tables.sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true, sensitivity: 'base' }));
        this.tableViews = this.tables;
        if (localStorage.getItem('selectedFloor')) {
          const selectedID = JSON.parse(localStorage['selectedFloor']);
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

  /**
   * Resolves table IDs to names for all checks
   * Uses batch resolution to prevent N+1 queries
   */
  resolveTableNames(): void {
    const tableIds = this.checks.map(check => check.table_id).filter(id => id);
    if (tableIds.length > 0) {
      this.entityStoreService.resolveEntities('tables', tableIds).then(resolved => {
        this.tableNames = resolved;
      });
    }
  }

  changeSection(section) {
    this.section = section;
    localStorage.setItem('selectedSection', section);
  }

  getTablesBy(id: string) {
    if (id !== 'All') {
      this.selected = id;
      localStorage.setItem('selectedFloor', JSON.stringify(id));
      this.tableViews = this.tables.filter(obj => obj.floor_id === id);
      this.checksView = this.checks.filter(({ table_id }) => this.tableViews.some(table => table._id === table_id));
      this.ordersView = this.orders.sort((a, b) => b.timestamp - a.timestamp)
        .filter(order => order.status === OrderStatus.WAITING || order.status === OrderStatus.PREPARING)
        .filter(({ check }) => this.checksView.some(obj => obj._id === check));
      this.receiptsView = this.receipts.sort((a, b) => b.timestamp - a.timestamp)
        .filter(receipt => receipt.status === ReceiptStatus.WAITING || receipt.status === ReceiptStatus.READY)
        .filter(({ check }) => this.checksView.some(obj => obj._id === check));
    } else {
      this.selected = '';
      this.tableViews = this.tables;
      this.checksView = this.checks;
      this.ordersView = this.orders.sort((a, b) => b.timestamp - a.timestamp)
        .filter(order => order.status === OrderStatus.WAITING || order.status === OrderStatus.PREPARING);
      this.receiptsView = this.receipts.sort((a, b) => b.timestamp - a.timestamp)
        .filter(receipt => receipt.status === ReceiptStatus.WAITING || receipt.status === ReceiptStatus.READY);
      localStorage.removeItem('selectedFloor');
    }
  }

  getTableTotal(table_id) {
    const checkDoc = this.checks.find(check => check.table_id === table_id);
    if (checkDoc) {
      return checkDoc.total_price;
    } else {
      return null;
    }
  }

  changePosition(value: any, table: any) {

    console.log('x', value);
    console.log('y', value.layerY, value.offsetY);

    table.position.x += value.layerX;
    table.position.y += value.layerY;
    const pos = {
      x: Math.round(table.position.x),
      y: Math.round(table.position.y),
      height: table.position.height,
      width: table.position.width
    };
    this.mainService.updateData('tables', table._id, { position: pos });

    // let tabletoGo = this.loweredTables.find(({ name }) => name == value);
    // this.router.navigate(['/selling-screen', 'Normal', tabletoGo._id])
  }

  dragStart(value: any, table: any) {
    console.log('x', value);
    console.log('y', value.layerY, value.offsetY);
  }

  filterTables(value: string) {
    const filterRegex = new RegExp(value, 'i');
    this.tableViews = this.tables.filter(({ name }) => name.match(filterRegex));
    this.checksView = this.checks.filter(({ table_id }) => this.tableViews.some(table => table._id === table_id));
    this.ordersView = this.orders.sort((a, b) => b.timestamp - a.timestamp)
      .filter(order => order.status === OrderStatus.WAITING || order.status === OrderStatus.PREPARING)
      .filter(({ check }) => this.checksView.some(obj => obj._id === check));
    this.receiptsView = this.receipts.sort((a, b) => b.timestamp - a.timestamp)
      .filter(receipt => receipt.status === ReceiptStatus.WAITING || receipt.status === ReceiptStatus.READY)
      .filter(({ check }) => this.checksView.some(obj => obj._id === check));
  }

  statusNote(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.WAITING:
        return 'Onay Bekliyor';
      case OrderStatus.PREPARING:
        return 'Hazırlanıyor';
      case OrderStatus.APPROVED:
        return 'Onaylandı';
      case OrderStatus.CANCELED:
        return 'İptal Edildi';
      case OrderStatus.PAYED:
        return 'Ödeme Yapıldı';
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
    const approveTimestamp = Date.now();
    const countDataArr: Array<CountData> = [];
    this.mainService.changeData('checks', order.check, (check: Check) => {
      order.items.forEach(orderItem => {
        const mappedProduct = this.products.find(product => product._id === orderItem.product_id || product.name === orderItem.name);
        const newProd = new CheckProduct(
          mappedProduct._id,
          mappedProduct.cat_id,
          mappedProduct.name + (orderItem.type ? ' ' + orderItem.type : ''),
          orderItem.price,
          orderItem.note,
          2,
          this.ownerId,
          approveTimestamp,
          mappedProduct.tax_value,
          mappedProduct.barcode
        );
        this.countProductsData(countDataArr, newProd.id, newProd.price);
        check.total_price = check.total_price + newProd.price;
        check.products.push(newProd);
      });
      return check;
    }).then(isOk => {
      this.updateProductReport(countDataArr);
      this.mainService.updateData('orders', order._id, { status: OrderStatus.APPROVED, timestamp: approveTimestamp })
        .catch(err => {
          console.log(err);
        });
    }).catch(err => {
      console.log(err);
    });
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
    const checkObj: Check = this.checks.find(check => check._id === receipt.check);
    const userObj: User = receipt.user;
    const userItems = receipt.orders.filter(order => order.status === OrderStatus.APPROVED);

    userItems.map(item => {
      item.status = OrderStatus.PAYED;
      return item;
    });

    const productsWillPay: Array<CheckProduct> = checkObj.products.filter(product =>
      userItems.map(item => item.timestamp).includes(product.timestamp)
    );

    let receiptMethod: 'Nakit' | 'Kart' | 'Kupon' | 'İkram';
    if (receipt.method === ReceiptMethod.CARD) {
      receiptMethod = 'Kart';
    } else if (receipt.method === ReceiptMethod.CASH) {
      receiptMethod = 'Nakit';
    } else if (receipt.method === ReceiptMethod.COUPON) {
      receiptMethod = 'Kupon';
    } else {
      receiptMethod = 'İkram';
    }

    const newPayment: PaymentStatus = {
      owner: userObj.name,
      method: receiptMethod,
      amount: receipt.total,
      discount: receipt.discount,
      timestamp: Date.now(),
      payed_products: productsWillPay
    };

    if (checkObj.payment_flow === undefined) {
      checkObj.payment_flow = [];
    }

    checkObj.payment_flow.push(newPayment);
    checkObj.discount += newPayment.amount;
    checkObj.products = checkObj.products.filter(product => !productsWillPay.includes(product));
    checkObj.total_price = checkObj.products.map(p => p.price).reduce((a, b) => a + b, 0);

    receipt.status = ReceiptStatus.APPROVED;
    receipt.timestamp = Date.now();

    this.mainService.LocalDB['allData'].bulkDocs(userItems).then(orderRes => {
      this.mainService.updateData('receipts', receipt._id, {
        status: ReceiptStatus.APPROVED,
        timestamp: Date.now()
      }).then(isReceiptUpdateRes => {
        this.mainService.updateData('checks', checkObj._id, checkObj).then(isCheckUpdateRes => {
          if (isCheckUpdateRes.ok) {
            // Success
          }
        }).catch(updateError => {
          console.log('Check Update Error on Payment Process', updateError);
        });
      }).catch(updateError => {
        console.log('Receipt Update Error on Payment Process', updateError);
      });
    }).catch(err => {
      console.log('Orders Update Error on Payment Process', err);
    });
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
        return 'Nakit';
      case ReceiptMethod.CARD:
        return 'Kredi Kartı';
      case ReceiptMethod.COUPON:
        return 'Yemek Kartı - Kupon';
      case ReceiptMethod.MOBILE:
        return 'Mobil Ödeme';
      case ReceiptMethod.CRYPTO:
        return 'Bitcoin';
      default:
        break;
    }
  }

  paymentStatus(status: ReceiptStatus): string {
    switch (status) {
      case ReceiptStatus.WAITING:
        return 'Onay Bekliyor';
      case ReceiptStatus.READY:
        return 'İşlemde';
      case ReceiptStatus.APPROVED:
        return 'Onaylandı';
      case ReceiptStatus.CANCELED:
        return 'İptal Edildi';
      default:
        break;
    }
  }

  isOwner(check_id: string) {
    const checkThatProcess = this.checks.find(obj => obj._id === check_id);
    return (checkThatProcess.owner === this.owner ? true : false);
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
      this.fastChecks = this.checks.filter(obj => obj.type === CheckType.FAST);
      this.deliveryChecks = this.checks.filter(obj => obj.type === CheckType.ORDER);
      this.resolveTableNames();
    });
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
    this.mainService.getAllBy('orders', { type: { $ne: OrderType.EMPLOOYEE } }).then(res => {
      this.orders = res.docs;
      this.ordersView = this.orders.sort((a, b) => b.timestamp - a.timestamp)
        .filter(order => order.status === OrderStatus.WAITING || order.status === OrderStatus.PREPARING);
      this.waitingOrders = this.ordersView.length;
    });
    this.mainService.getAllBy('receipts', {}).then(res => {
      this.receipts = res.docs;
      this.receiptsView = this.receipts.sort((a, b) => b.timestamp - a.timestamp)
        .filter(receipt => receipt.status === ReceiptStatus.WAITING || receipt.status === ReceiptStatus.READY);
      this.waitingReceipts = this.receiptsView.length;
    });
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
        const selectedID = JSON.parse(localStorage['selectedFloor']);
        this.getTablesBy(selectedID);
      }
    });
  }

  findTable(check_id: string) {
    const check = this.checks.find(obj => obj._id === check_id);
    const table = this.tables.find(obj => obj._id === check.table_id);
    return table.name;
  }

  countProductsData = (counDataArray: Array<CountData>, id: string, price: number, manuelCount?: number): Array<CountData> => {
    let countObj: CountData;
    if (manuelCount) {
      countObj = { product: id, count: manuelCount, total: price };
    } else {
      countObj = { product: id, count: 1, total: price };
    }
    const contains = counDataArray.some(obj => obj.product === id);
    if (contains) {
      const pIndex = counDataArray.findIndex(p_id => p_id.product === id);
      if (manuelCount) {
        counDataArray[pIndex].count += manuelCount;
      } else {
        counDataArray[pIndex].count++;
      }
      counDataArray[pIndex].total += price;
    } else {
      counDataArray.push(countObj);
    }
    return counDataArray;
  }

  updateProductReport = async (count_data: Array<CountData>): Promise<boolean> => {
    try {
      const resp = await this.mainService.LocalDB['allData'].find({ selector: { key: 'DateSettings' } });
      const StoreDayInfo: DayInfo = await resp.docs[0].value;
      const Month = new Date(StoreDayInfo.time).getMonth();

      count_data.forEach(async (obj: CountData) => {
        const reportResp = await this.mainService.LocalDB['allData'].find({ selector: { db_name: 'reports', connection_id: obj.product } });
        const ProductReport: Report = await reportResp.docs[0];
        const recipeResp = await this.mainService.LocalDB['allData'].find({ selector: { db_name: 'recipes', product_id: obj.product } });
        const ProductRecipe: Array<Ingredient> = await recipeResp.docs[0];
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
            const downStock = ingredient.amount * obj.count;
            this.mainService.LocalDB['allData'].upsert(ingredient.stock_id, (doc: Stock) => {
              doc.left_total -= downStock;
              doc.quantity = doc.left_total / doc.total;
              if (doc.left_total < doc.warning_limit) {
                if (doc.left_total <= 0) {
                  doc.left_total = 0;
                  // this.logService.createLog(logType.STOCK_CHECKPOINT, doc._id, `${doc.name} adlı stok tükendi!`);
                } else {
                  // Some logic here
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
