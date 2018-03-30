import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MainService } from '../../../services/main.service';
import { MessageService } from '../../../providers/message.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Table, Floor } from '../../../mocks/table.mock';
import { Check, ClosedCheck, PaymentStatus, CheckProduct } from '../../../mocks/check.mock';
import { Product, Recipe, SubCategory, Category, Ingredient, ProductSpecs } from '../../../mocks/product.mock';
import { Report, Activity } from '../../../mocks/report.mock';
import { Printer } from '../../../mocks/settings.mock';
import { ElectronService } from '../../../providers/electron.service';
import { PrinterService } from '../../../providers/printer.service';
import { SettingsService } from '../../../services/settings.service';
import { LogService, logType } from '../../../services/log.service';

@Component({
  selector: 'app-selling-screen',
  templateUrl: './selling-screen.component.html',
  styleUrls: ['./selling-screen.component.scss'],
  providers: [SettingsService]
})

export class SellingScreenComponent implements OnInit {
  id: string;
  type: string;
  categories: Array<Category>;
  sub_categories: Array<SubCategory>;
  subCatsView: Array<SubCategory>;
  products: Array<Product>;
  productsView: Array<Product>;
  checks: Array<any>;
  floors: Array<Floor>;
  table: Table;
  tables: Array<Table>;
  selectedTable: any;
  tablesView: Array<any>;
  check: Check;
  check_id: string;
  selectedCat: string;
  selectedProduct: CheckProduct;
  selectedIndex: number;
  noteForm: NgForm;
  owner: string;
  ownerRole: string;
  ownerId: string;
  newOrders: Array<CheckProduct> = [];
  countData: Array<any> = [];
  payedShow: boolean = false;
  payedTitle: string = 'Alınan Ödemeleri Görüntüle';
  printers: Array<Printer>;
  cancelReasons: Array<string>;
  onProductChange: boolean = false;
  productWithSpecs: Product;
  productStock: any;
  numpad: any;
  numboard: Array<any>;
  isFirstTime: boolean;
  askForPrint: boolean;
  productSpecs: Array<ProductSpecs>;
  @ViewChild('productName') productFilterInput: ElementRef
  @ViewChild('specsUnit') productUnit: ElementRef

  constructor(private mainService: MainService, private printerService: PrinterService, private route: ActivatedRoute, private router: Router, private electron: ElectronService, private message: MessageService, private settings: SettingsService, private logService: LogService) {
    this.owner = this.settings.getUser('name');
    this.ownerRole = this.settings.getUser('type');
    this.ownerId = this.settings.getUser('id');
    this.numboard = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [".", 0, "◂"]];
    this.route.params.subscribe(params => {
      this.id = params['id'];
      this.type = params['type'];
      if (this.type == 'Normal') {
        this.check = new Check(this.id, 0, 0, this.owner, '', 0, [], Date.now(), 1);
        this.getCheck({ table_id: this.id });
      } else {
        if (this.id == 'New') {
          this.check = new Check('Hızlı Satış', 0, 0, this.owner, '', 0, [], Date.now(), 2);
        } else {
          this.check = new Check('Hızlı Satış', 0, 0, this.owner, '', 0, [], Date.now(), 2);
          this.getCheck({ _id: this.id });
        }
      }
    });
    this.settings.getPrinters().subscribe(res => this.printers = res.value);
  }

  ngOnInit() {
    this.fillData();
    this.cancelReasons = [
      'Zayi',
      'Stokta Yok',
      'Yanlış Sipariş',
      'Müşteri İstemedi',
    ]
  }

  goPayment() {
    if (this.check.type == 2) {
      if (this.check.status == 0) {
        this.updateUserReport();
        this.updateProductReport(this.countData);
        this.check.products.map(obj => obj.status = 2);
        this.check.status = 1;
        this.mainService.addData('checks', this.check).then(res => {
          if (res.ok) {
            this.router.navigate(['/payment', res.id]);
          }
        });
      } else {
        this.router.navigate(['/payment', this.check_id]);
      }
    } else {
      this.router.navigate(['/payment', this.check_id]);
    }
  }

  getCheck(filter: object) {
    this.mainService.getAllBy('checks', filter).then((result) => {
      if (result.docs.length > 0) {
        this.check = result.docs[0];
        this.check_id = result.docs[0]._id;
      }
    });
  }

  addToCheck(product: Product) {
    if (product.type == 2) {
      this.isFirstTime = true;
      this.productWithSpecs = product;
      this.mainService.getAllBy('recipes', { product_id: product._id }).then(res => {
        this.productStock = res.docs[0].recipe[0];
        this.numpad = this.productStock.amount;
      });
      $('#productSpecs').modal('show');
    } else {
      this.productFilterInput.nativeElement.value = '';
      this.countProductsData(product._id, product.price);
      let newProduct = new CheckProduct(product._id, product.cat_id, product.name, product.price, '', 1, this.owner, Date.now());
      this.check.total_price = this.check.total_price + product.price;
      this.check.products.push(newProduct);
      this.newOrders.push(newProduct);
    }
  }

  numpadToCheck() {
    let newAmount = (this.numpad * this.productWithSpecs.price) / this.productStock.amount;
    let newNote = `${this.numpad} ${this.productUnit.nativeElement.innerHTML}`;
    const newProduct = new CheckProduct(this.productWithSpecs._id, this.productWithSpecs.cat_id, this.productWithSpecs.name, newAmount, newNote, 1, this.owner, Date.now());
    this.check.total_price = this.check.total_price + newProduct.price;
    let countFor = newAmount / this.productWithSpecs.price;
    if (this.productUnit.nativeElement.innerHTML == 'Adet') {
      for (let index = 0; index < countFor; index++) {
        let repeatingProducts = new CheckProduct(this.productWithSpecs._id, this.productWithSpecs.cat_id, this.productWithSpecs.name, this.productWithSpecs.price, '', 1, this.owner, Date.now());
        this.check.products.push(repeatingProducts);
        this.newOrders.push(repeatingProducts);
      }
    } else {
      this.check.products.push(newProduct);
      this.newOrders.push(newProduct);
    }
    this.countProductsData(this.productWithSpecs._id, newAmount, countFor);
    $('#productSpecs').modal('hide');
  }

  pushKey(key: any) {
    if (key === "◂") {
      this.numpad = '';
    } else {
      if (this.isFirstTime) {
        this.numpad = '';
        this.isFirstTime = false;
      }
      this.numpad += key;
    }
  }

  sendCheck() {
    if (this.check.type == 2) {
      if (this.check.note == '' || this.check.note == undefined) {
        let isOk = confirm('Hızlı Hesap oluşturmanız için hesaba not eklemek zorundasınız.');
        if (isOk) {
          $('#checkNote').modal('show');
          return false;
        } else {
          return false;
        }
      }
    }
    if (this.askForPrint) {
      let isOK = confirm('Fiş Yazdırılsın mı ?');
      if (isOK) {
        this.printOrder();
      }
    } else {
      this.printOrder();
    }
    this.check.products.forEach(element => {
      if (element.status === 1) {
        element.status = 2;
      }
    });
    if (this.check.status == 1) {
      this.mainService.updateData('checks', this.check_id, this.check).then(res => {
        if (res.ok) {
          this.router.navigate(['/store']);
          let pricesTotal = this.newOrders.map(obj => obj.price).reduce((a, b) => a + b);
          if (this.check.type == 1) {
            this.logService.createLog(logType.CHECK_UPDATED, this.check._id, `${this.table.name} hesabına ${pricesTotal} tutarında sipariş eklendi.`);
          } else {
            this.logService.createLog(logType.CHECK_UPDATED, this.check._id, `${this.check.note} hesabına ${pricesTotal} tutarında sipariş eklendi.`);
          }
        }
      });
    } else {
      if (this.check.type == 1) {
        this.mainService.updateData('tables', this.id, { status: 2, timestamp: Date.now() });
      }
      this.check.status = 1;
      this.mainService.addData('checks', this.check).then(res => {
        if (res.ok) {
          this.router.navigate(['/store']);
          if (this.check.type == 1) {
            this.logService.createLog(logType.CHECK_CREATED, res.id, `${this.table.name} Masasına '${this.owner}' tarafından hesap açıldı`);
          } else {
            this.logService.createLog(logType.CHECK_CREATED, res.id, `${this.check.note} Notlu Hızlı Hesap '${this.owner}' tarafından açıldı`);
          }
        }
      });
    }
    this.updateUserReport();
    this.updateProductReport(this.countData);
  }

  togglePayed() {
    if (this.payedShow) {
      this.payedShow = false;
      this.payedTitle = 'Alınan Ödemeleri Görüntüle';
    } else {
      this.payedShow = true;
      this.payedTitle = 'Alınan Ödemeleri Gizle';
    }
  }

  selectProduct(index) {
    if (this.selectedIndex == index) {
      this.selectedIndex = undefined;
      this.selectedProduct = undefined;
    } else {
      this.selectedProduct = this.check.products[index];
      this.selectedIndex = index;
    }
  }

  getSpecies(product) {
    this.productSpecs = this.products.find(obj => obj._id == product.id).specifies;
  }

  changeSpecs(spec) {
    const oldPrice = this.selectedProduct.price;
    this.selectedProduct.note = spec.spec_name;
    this.selectedProduct.price = spec.spec_price;
    this.check.total_price = (this.check.total_price - oldPrice) + spec.spec_price;
    $('#noteModal').modal('hide');
  }

  addNote(form: NgForm) {
    if (this.selectedProduct != undefined) {
      let note = form.value.description;
      if (note == '' || note == null || note == ' ') {
        this.message.sendMessage('Not Alanı Boş Bırakılamaz');
      } else {
        let shit = this.check.products[this.selectedIndex];
        this.check.products[this.selectedIndex].note = note;
        form.reset();
        $('#noteModal').modal('hide');
      }
    }
  }

  addCheckNote(form: NgForm) {
    let note = form.value.description;
    this.check.note = note;
    if (this.check.status !== 0) {
      this.mainService.updateData('checks', this.check_id, { note: note });
    }
    form.reset();
    $('#checkNote').modal('hide');
  }

  cancelProduct(reason: string) {
    if (this.selectedProduct !== undefined) {
      this.decountProductsData(this.selectedProduct);
      this.check.products[this.selectedIndex].status = 3
      this.check.products[this.selectedIndex].note = reason;
      this.check.products[this.selectedIndex].owner = this.owner;
      this.check.products[this.selectedIndex].timestamp = Date.now();
      this.check.total_price -= this.selectedProduct.price;
      const productAfterCancel = this.check.products.filter(obj => obj.status == 1);
      this.check.products = this.check.products.filter(obj => obj.status !== 1);
      let analizeCheck = this.check.products.some(obj => obj.status !== 3);
      if (analizeCheck) {
        this.mainService.updateData('checks', this.check_id, this.check).then((res) => {
          if (res.ok) {
            if (this.check.type == 1) {
              this.logService.createLog(logType.ORDER_CANCELED, this.check._id, `${this.table.name} Masasından ${this.selectedProduct.name} adlı ürün iptal edildi Açıklama:'${reason}'`);
            } else {
              this.logService.createLog(logType.ORDER_CANCELED, this.check._id, `${this.check.note} Hesabından ${this.selectedProduct.name} adlı ürün iptal edildi Açıklama:'${reason}'`);
            }
            this.check._rev = res.rev;
            this.message.sendMessage('Ürün İptal Edildi');
            this.selectedProduct = undefined;
            this.selectedIndex = undefined;
            $('#cancelProduct').modal('hide');
            productAfterCancel.forEach(element => {
              this.check.products.push(element);
            })
          }
        });
      } else {
        $('#cancelProduct').modal('hide');
        let checkToCancel = new ClosedCheck(this.check.table_id, this.check.total_price, 0, this.owner, this.check.note, 3, this.check.products, Date.now(), 3, 'İkram', this.check.payment_flow);
        checkToCancel.description = 'Bütün Ürünler İptal Edildi';
        this.mainService.addData('closed_checks', checkToCancel).then(res => {
          this.message.sendMessage('Hesap İptal Edildi');
          this.logService.createLog(logType.CHECK_CANCELED, this.check._id, `${this.table.name}'de kalan bütün ürünler iptal edildi. Hesap Kapatıldı.`)
        });
        if (this.check.payment_flow) {
          let payedDiscounts = 0;
          this.check.payment_flow.forEach((obj, index) => {
            payedDiscounts += obj.discount;
            this.mainService.getAllBy('reports', { connection_id: obj.method }).then(res => {
              this.mainService.changeData('reports', res.docs[0]._id, (doc) => {
                doc.count++;
                doc.weekly_count[this.settings.getDay().day]++;
                doc.amount += obj.amount;
                doc.weekly[this.settings.getDay().day] += obj.amount;
                doc.update_time = Date.now();
                return doc;
              });
            });
          });
          let checksForPayed = new ClosedCheck(this.check.table_id, this.check.discount, payedDiscounts, this.owner, this.check.note, this.check.status, [], Date.now(), this.check.type, 'Parçalı', this.check.payment_flow);
          this.mainService.addData('closed_checks', checksForPayed);
        }
        this.mainService.removeData('checks', this.check._id);
        if (this.check.type == 1) {
          this.mainService.updateData('tables', this.check.table_id, { status: 1 });
        }
        this.router.navigate(['/store']);
      }
    }
  }

  undoChanges() {
    if (this.selectedProduct) {
      if (this.selectedProduct.status == 1) {
        let newIndex = this.newOrders.indexOf(this.check.products[this.selectedIndex]);
        this.decountProductsData(this.check.products[this.selectedIndex]);
        this.check.total_price = this.check.total_price - this.check.products[this.selectedIndex].price;
        this.check.products.splice(this.selectedIndex, 1);
        this.newOrders.splice(newIndex, 1);
        this.selectedIndex = undefined;
        this.selectedProduct = undefined;
      } else {
        alert('Eski Ürünler Geri Alınamaz!');
        return false;
      }
    } else {
      this.newOrders.pop();
      let count = this.check.products.length;
      if (count > 0) {
        if (this.check.products[count - 1].status !== 2) {
          this.selectedIndex = undefined;
          this.selectedProduct = undefined;
          let lastItem = this.check.products.pop();
          this.decountProductsData(lastItem);
          this.check.total_price = this.check.total_price - lastItem.price;
        } else {
          alert('Eski Ürünler Geri Alınamaz!');
          return false;
        }
      }
    }
  }

  decountProductsData(deProduct: CheckProduct) {
    let contains = this.countData.some(obj => obj.product === deProduct.id);
    if (contains) {
      let index = this.countData.findIndex(p_id => p_id.product == deProduct.id);
      this.countData[index].count--;
      this.countData[index].total -= deProduct.price;
      if (this.countData[index].count == 0) {
        this.countData = this.countData.filter(obj => obj.product !== deProduct.id);
      }
    }
  }

  countProductsData(id, price, manuelCount?) {
    let countObj;
    if (manuelCount) {
      countObj = { product: id, count: manuelCount, total: price };
    } else {
      countObj = { product: id, count: 1, total: price };
    }
    let contains = this.countData.some(obj => obj.product === id);
    if (contains) {
      let index = this.countData.findIndex(p_id => p_id.product == id);
      if (manuelCount) {
        this.countData[index].count += manuelCount;
      } else {
        this.countData[index].count++;
      }
      this.countData[index].total += price;
    } else {
      this.countData.push(countObj);
    }
  }

  updateUserReport() {
    let pricesTotal = this.newOrders.map(obj => obj.price).reduce((a, b) => a + b);
    if (this.check.type == 1) {
      this.logService.createLog(logType.ORDER_CREATED, this.check._id, `'${this.owner}' ${this.table.name} masasına ${pricesTotal} TL tutarında sipariş girdi.`);
    } else {
      this.logService.createLog(logType.ORDER_CREATED, this.check._id, `'${this.owner}' Hızlı Satış - ${this.check.note} hesabına ${pricesTotal} TL tutarında sipariş girdi.`);
    }
    this.mainService.getAllBy('reports', { connection_id: this.ownerId }).then(res => {
      let doc = res.docs[0]
      doc.amount += pricesTotal;
      doc.count++;
      doc.weekly[this.settings.getDay().day] += pricesTotal;
      doc.weekly_count[this.settings.getDay().day]++;
      if (doc.weekly_count[this.settings.getDay().day] == 100) {
        this.logService.createLog(logType.USER_CHECKPOINT, this.ownerId, `'${this.owner}' günün 100. siparişini girdi.`);
      }
      doc.update_time = Date.now();
      this.mainService.updateData('reports', doc._id, doc).then();
    });
  }

  updateProductReport(data) {
    data.forEach(obj => {
      this.mainService.getAllBy('reports', { connection_id: obj.product }).then(res => {
        let report = res.docs[0];
        this.mainService.changeData('reports', report._id, (doc) => {
          doc.count += obj.count;
          doc.amount += obj.total;
          doc.update_time = Date.now();
          doc.weekly[this.settings.getDay().day] += obj.total;
          doc.weekly_count[this.settings.getDay().day] += obj.count;
          return doc;
        });
      });
      this.mainService.getAllBy('recipes', { product_id: obj.product }).then(result => {
        if (result.docs.length > 0) {
          const pRecipe: Array<Ingredient> = result.docs[0].recipe;
          pRecipe.forEach(stock => {
            let downStock = stock.amount * obj.count;
            this.mainService.changeData('stocks', stock.stock_id, (doc) => {
              doc.left_total -= downStock;
              doc.quantity = doc.left_total / doc.total;
              if (doc.left_total < doc.warning_limit) {
                if (doc.db_name) {
                  if (doc.left_total <= 0) {
                    this.logService.createLog(logType.STOCK_CHECKPOINT, doc._id, `${doc.name} adlı stok tükendi!`);
                  } else {
                    this.logService.createLog(logType.STOCK_CHECKPOINT, doc._id, `${doc.name} adlı stok bitmek üzere! - Kalan: '${doc.left_total + ' ' + doc.unit}'`);
                  }
                }
              }
              return doc;
            });
          });
        }
      });
    });
  }

  printOrder() {
    if (this.printers.length > 0) {
      let orders = this.check.products.filter(obj => obj.status == 1);
      if (orders.length > 0) {
        let splitPrintArray = [];
        orders.forEach((obj, index) => {
          let catPrinter = this.categories.filter(cat => cat._id == obj.cat_id)[0].printer || this.printers[0].name;
          let contains = splitPrintArray.some(element => element.printer.name == catPrinter);
          if (contains) {
            let index = splitPrintArray.findIndex(p_name => p_name.printer.name == catPrinter);
            splitPrintArray[index].products.push(obj);
          } else {
            let thePrinter = this.printers.filter(obj => obj.name == catPrinter)[0];
            let splitPrintOrder = { printer: thePrinter, products: [obj] };
            splitPrintArray.push(splitPrintOrder);
          }
          if (index == orders.length - 1) {
            let table_name;
            if (this.check.type == 2) {
              table_name = 'Hızlı Satış';
            } else {
              table_name = this.table.name;
            }
            splitPrintArray.forEach(order => {
              this.printerService.printOrder(order.printer, table_name, order.products);
            });
          }
        });
      }
    }
  }

  printCheck() {
    if (this.check.status !== 2) {
      this.printerService.printCheck(this.printers[0], this.table.name, this.check);
      if (this.check.status > 0) {
        this.mainService.updateData('checks', this.check_id, { status: 2 });
        this.check.status = 2;
      }
    } else {
      let isOk = confirm('Adisyon Tekrar Yazdırılsın mı?');
      if (isOk) {
        this.printerService.printCheck(this.printers[0], this.table.name, this.check);
      }
    }
  }

  getProductsBy(id) {
    this.selectedCat = id;
    this.subCatsView = this.sub_categories.filter(obj => obj.cat_id == id);
    this.productsView = this.products.filter(obj => obj.cat_id == id);
  }

  getProductsBySubCat(id) {
    this.productsView = this.products.filter(obj => obj.subcat_id == id);
  }

  selectTable(id) {
    this.selectedTable = id;
  }

  splitProduct() {
    if (this.selectedTable.status == 1) {
      let isOk = confirm(`${this.selectedProduct.name}, ${this.selectedTable.name} Masasına Aktarılacak ve Yeni Hesap Açılacak.`);
      if (isOk) {
        let newCheck = new Check(this.selectedTable._id, this.selectedProduct.price, 0, this.owner, '', 1, [this.selectedProduct], Date.now(), 1);
        this.mainService.addData('checks', newCheck).then(res => {
          if (res.ok) {
            this.check.products.splice(this.selectedIndex, 1);
            this.check.total_price -= this.selectedProduct.price;
            this.mainService.updateData('tables', this.selectedTable._id, { status: 2, timestamp: Date.now() }).then(res => {
              if (res.ok) {
                this.message.sendMessage(`Ürün ${this.selectedTable.name} Masasına Aktarıldı`);
                this.setDefault();
                $('#splitTable').modal('hide');
              }
            })
          }
        })
      }
    } else {
      this.mainService.getAllBy('checks', { table_id: this.selectedTable._id }).then(res => {
        let otherCheck: Check = res.docs[0];
        otherCheck.products.push(this.selectedProduct);
        otherCheck.total_price += this.selectedProduct.price;
        this.check.total_price -= this.selectedProduct.price;
        this.check.products.splice(this.selectedIndex, 1);
        this.mainService.updateData('checks', otherCheck._id, otherCheck).then(res => {
          if (res.ok) {
            this.mainService.updateData('checks', this.check._id, this.check).then(res => {
              if (res.ok) {
                this.message.sendMessage(`Ürün ${this.selectedTable.name} Masasına Aktarıldı`);
                delete this.check._rev;
                this.setDefault();
                $('#splitTable').modal('hide');
              }
            });
          }
        });
      });
    }
    this.logService.createLog(logType.ORDER_MOVED, this.selectedProduct.id, `${this.selectedProduct.name} siparişi ${this.table.name} masasından ${this.selectedTable.name} masasına aktarıldı`)
  }

  splitTable() {
    if (this.selectedTable.status == 1) {
      if (this.check.status > 0) {
        if (this.check.type == 1) {
          this.mainService.updateData('tables', this.check.table_id, { status: 1, timestamp: Date.now() });
        }
        this.mainService.updateData('tables', this.selectedTable._id, { status: 2, timestamp: Date.now() });
        this.mainService.updateData('checks', this.check_id, { table_id: this.selectedTable._id, type: 1 }).then(res => {
          if (res.ok) {
            this.message.sendMessage(`Hesap ${this.selectedTable.name} Masasına Aktarıldı.`)
            if (this.check.type == 1) {
              this.logService.createLog(logType.CHECK_MOVED, this.check._id, `${this.table.name} Hesabı ${this.selectedTable.name} masasına taşındı.`);
            } else {
              this.logService.createLog(logType.CHECK_MOVED, this.check._id, `${this.check.note} Hesabı ${this.selectedTable.name} masasına taşındı.`);
            }
            $('#splitTable').modal('hide');
            this.router.navigate(['/store']);
          }
        });
      }
    } else {
      let isOk = confirm(`Bütün Ürünler ${this.selectedTable.name} Masasına Aktarılacak.`);
      if (isOk) {
        this.mainService.getAllBy('checks', { table_id: this.selectedTable._id }).then(res => {
          let otherCheck: Check = res.docs[0];
          otherCheck.products = otherCheck.products.concat(this.check.products);
          otherCheck.total_price += this.check.total_price;
          if (this.check.type == 1) {
            otherCheck.note = `${this.table.name} Masası İle Birleştirildi`;
            this.logService.createLog(logType.CHECK_MOVED, this.check._id, `${this.table.name} Masası ${this.selectedTable.name} ile Birleştirildi.`);
          } else {
            otherCheck.note = `${this.check.note} Hesabı İle Birleştirildi`;
            this.logService.createLog(logType.CHECK_MOVED, this.check._id, `${this.check.note} Hesabı ${this.selectedTable.name} Masasına Aktarıldı.`);
          }
          if (this.check.payment_flow) {
            if (otherCheck.payment_flow) {
              otherCheck.payment_flow = otherCheck.payment_flow.concat(this.check.payment_flow);
            } else {
              otherCheck.payment_flow = this.check.payment_flow;
            }
            otherCheck.discount += this.check.discount;
            otherCheck.timestamp = Date.now();
          }
          this.mainService.updateData('checks', otherCheck._id, otherCheck).then(res => {
            if (res.ok) {
              if (this.check.type == 1) {
                this.mainService.updateData('tables', this.check.table_id, { status: 1 });
              }
              this.mainService.removeData('checks', this.check._id).then(res => {
                if (res.ok) {
                  this.message.sendMessage(`Hesap ${this.selectedTable.name} Masası ile Birleştirildi.`)
                  $('#splitTable').modal('hide');
                  this.router.navigate(['/store']);
                }
              });
            }
          })
        });
      }
    }
  }

  filterProducts(value: string) {
    let regexp = new RegExp(value, 'i');
    this.productsView = this.products.filter(({ name }) => name.match(regexp));
  }

  filterTables(id) {
    this.selectedTable = undefined;
    this.tablesView = this.tables.filter(obj => obj.floor_id == id);
  }

  setDefault() {
    this.selectedIndex = undefined;
    this.selectedTable = undefined;
    this.selectedProduct = undefined;
    this.onProductChange = false;
    this.fillData()
  }

  fillData() {
    this.selectedCat = undefined;
    this.mainService.getAllBy('categories', {}).then(result => {
      this.categories = result.docs;
    });
    this.mainService.getAllBy('sub_categories', {}).then(result => {
      this.sub_categories = result.docs;
    });
    this.mainService.getAllBy('products', {}).then(result => {
      this.products = result.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);
      this.productsView = this.products;
    });
    this.mainService.getAllBy('tables', {}).then(res => {
      this.tables = res.docs;
      this.table = this.tables.filter(obj => obj._id == this.id)[0];
      this.tables = this.tables.filter(obj => obj._id !== this.id).sort((a, b) => a.name.localeCompare(b.name));
      this.tablesView = this.tables;
    });
    this.mainService.getAllBy('floors', {}).then(res => {
      this.floors = res.docs;
    });
    this.settings.getAppSettings().subscribe((res: any) => {
      if (res.value.ask_print_order == 'Sor') {
        this.askForPrint = true;
      } else {
        this.askForPrint = false;
      }
    });
  }
}