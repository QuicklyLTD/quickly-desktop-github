import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MainService } from '../../../services/main.service';
import { MessageService } from '../../../providers/message.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Table, Floor } from '../../../mocks/table.mock';
import { Check, ClosedCheck, PaymentStatus, CheckProduct } from '../../../mocks/check.mock';
import { Product, Recipe, SubCategory, Category } from '../../../mocks/product.mock';
import { Report, Activity } from '../../../mocks/report.mock';
import { Printer } from '../../../mocks/settings.mock';
import { ElectronService } from '../../../providers/electron.service';
import { PrinterService } from '../../../providers/printer.service';
import { SettingsService } from '../../../services/settings.service';
import { LogService } from '../../../services/log.service';

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
  subCatsView:Array<SubCategory>;
  products: Array<Product>;
  productsView:Array<Product>;
  checks: Array<any>;
  floors: Array<Floor>;
  table: Table;
  selectedTable: any;
  allTables: Array<any>;
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
  @ViewChild('productName') productFilterInput : ElementRef

  constructor(private mainService: MainService, private printerService: PrinterService, private route: ActivatedRoute, private router: Router, private electron: ElectronService, private message: MessageService, private settings: SettingsService, private logService:LogService) {
    this.owner = this.settings.getUser('name');
    this.ownerRole = this.settings.getUser('type');
    this.ownerId = this.settings.getUser('id');
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
        this.check.products.map(obj => obj.status = 2);
        this.check.status = 1;
        this.mainService.addData('checks', this.check).then(res => {
          this.router.navigate(['/payment', res.id]);
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

  addToCheck(product) {
    this.productFilterInput.nativeElement.value = '';
    this.countProductsData(product._id, product.price);
    let newProduct = new CheckProduct(product._id, product.cat_id, product.name, product.price, '', 1, this.owner, Date.now());
    this.check.total_price = this.check.total_price + product.price;
    this.check.products.push(newProduct);
    this.newOrders.push(newProduct);
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
    this.printOrder();
    this.updateUserReport();
    this.check.products.forEach(element => {
      if (element.status === 1) {
        element.status = 2;
      }
    });
    this.updateProductReport(this.countData);
    if (this.check.status == 1) {
      delete this.check._rev;
      this.mainService.updateData('checks', this.check_id, this.check).then(res => {
        if (res.ok) {
          this.router.navigate(['/store']);
        }
      });
    } else {
      if (this.check.type == 1) {
        this.mainService.updateData('tables', this.id, { status: 2 });
      }
      this.check.status = 1;
      this.mainService.addData('checks', this.check);
      this.router.navigate(['/store']);
    }
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

  addNote(form: NgForm) {
    if (this.selectedProduct != undefined) {
      let note = form.value.description;
      let shit = this.check.products[this.selectedIndex];
      this.check.products[this.selectedIndex].note = note;
      form.reset();
      $('#noteModal').modal('hide');
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
      this.mainService.updateData('checks', this.check_id, this.check).then((res) => {
        if (res.ok) {
          this.check._rev = res.rev;
          this.message.sendMessage('Ürün İptal Edildi');
          this.selectedProduct = undefined;
          this.selectedIndex = undefined;
          $('#cancelProduct').modal('hide');
        }
      });
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

  countProductsData(id, price) {
    let countObj = { product: id, count: 1, total: price };
    let contains = this.countData.some(obj => obj.product === id);
    if (contains) {
      let index = this.countData.findIndex(p_id => p_id.product == id);
      this.countData[index].count++;
      this.countData[index].total += price;
    } else {
      this.countData.push(countObj);
    }
  }

  updateUserReport() {
    let pricesTotal = this.newOrders.map(obj => obj.price).reduce((a, b) => a + b);
    this.mainService.getAllBy('reports', { connection_id: this.ownerId }).then(res => {
      let doc = res.docs[0]
      doc.amount += pricesTotal;
      doc.count++;
      doc.weekly[this.settings.getDay().day] += pricesTotal;
      doc.weekly_count[this.settings.getDay().day]++;
      doc.update_time = Date.now();
      this.mainService.updateData('reports', doc._id, doc).then();
    });
  }

  updateProductReport(data) {
    data.forEach(obj => {
      this.mainService.getAllBy('reports', { connection_id: obj.product }).then(res => {
        let report = res.docs[0];
        report.count += obj.count;
        report.amount += obj.total;
        report.update_time = Date.now();
        report.weekly[this.settings.getDay().day] += obj.total;
        report.weekly_count[this.settings.getDay().day] += obj.count;
        this.mainService.updateData('reports', report._id, report);
      });
      this.mainService.getAllBy('recipes', { product_id: obj.product }).then(result => {
        if (result.docs.length > 0) {
          let pRecipe: Recipe = result.docs[0];
          pRecipe.recipe.forEach(stock => {
            let downStock = stock.amount * obj.count;
            this.mainService.changeData('stocks', stock.stock_id, (doc) => {
              doc.left_total -= downStock;
              return doc;
            });
          });
        }
      });
    });
  }

  printOrder() {
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
            this.mainService.updateData('tables', this.selectedTable._id, { status: 2 }).then(res => {
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
  }

  splitTable() {
    if (this.selectedTable.status == 1) {
      if (this.check.status > 0) {
        if (this.check.type == 1) {
          this.mainService.updateData('tables', this.check.table_id, { status: 1 });
        }
        this.mainService.updateData('tables', this.selectedTable._id, { status: 2 });
        this.mainService.updateData('checks', this.check_id, { table_id: this.selectedTable._id, type: 1 }).then(res => {
          if (res.ok) {
            this.message.sendMessage(`Hesap ${this.selectedTable.name} Masasına Aktarıldı.`)
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
          } else {
            otherCheck.note = `${this.check.note} Hesabı İle Birleştirildi`;
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
    this.productsView = this.products.filter(({name}) => name.match(regexp));
  }

  filterTables(id) {
    this.selectedTable = undefined;
    if (id !== '') {
      this.mainService.getAllBy('tables', { floor_id: id }).then(res => {
        this.allTables = res.docs;
        this.allTables = this.allTables.filter(obj => obj._id !== this.id);
        this.allTables = this.allTables.sort((a, b) => a.name.localeCompare(b.name));
      });
    } else {
      this.mainService.getAllBy('tables', {}).then(res => {
        this.allTables = res.docs;
        this.allTables = this.allTables.filter(obj => obj._id !== this.id);
        this.allTables = this.allTables.sort((a, b) => a.name.localeCompare(b.name));
      });
    }
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
      this.allTables = res.docs;
      this.table = this.allTables.filter(obj => obj._id == this.id)[0];
      this.allTables = this.allTables.filter(obj => obj._id !== this.id);
      this.allTables = this.allTables.sort((a, b) => a.name.localeCompare(b.name));
    });
    this.mainService.getAllBy('floors', {}).then(res => {
      this.floors = res.docs;
    });
  }
}