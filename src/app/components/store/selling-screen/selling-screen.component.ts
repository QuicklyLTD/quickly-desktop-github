import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-selling-screen',
  templateUrl: './selling-screen.component.html',
  styleUrls: ['./selling-screen.component.scss'],
  providers: [SettingsService]
})

export class SellingScreenComponent implements OnInit {
  id: string;
  categories: Array<Category>;
  sub_categories: Array<SubCategory>;
  products: Array<Product>;
  deProducts: Array<CheckProduct>;
  productsWillPay: Array<CheckProduct>;
  productsWillBack: Array<CheckProduct>;
  paymentProducts: Array<CheckProduct>;
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
  paymentForm: NgForm;
  toRight: boolean;
  owner: string;
  ownerRole: string;
  ownerId: string;
  rightPrice: number;
  leftPrice: number;
  newOrders: Array<CheckProduct> = [];
  countData: Array<any> = [];
  pDiscount: number;
  payedShow: boolean = false;
  payedTitle: string = 'Alınan Ödemeleri Görüntüle';
  printers: Array<Printer>;


  constructor(private mainService: MainService, private printerService: PrinterService, private route: ActivatedRoute, private router: Router, private electron: ElectronService, private message: MessageService, private settings: SettingsService) {
    this.owner = this.settings.getUser('name');
    this.ownerRole = this.settings.getUser('type');
    this.ownerId = this.settings.getUser('id');
    this.deProducts = [];
    this.toRight = false;
    this.productsWillPay = [];
    this.productsWillBack = [];
    this.route.params.subscribe(params => {
      this.id = params['id'];
      this.check = new Check(this.id, 0, 0, this.owner, '', 0, [], Date.now(), 1);
      this.mainService.getAllBy('checks', { table_id: this.id }).then((result) => {
        if (result.docs.length > 0) {
          this.check = result.docs[0];
          this.check_id = result.docs[0]._id;
          this.paymentProducts = this.check.products.slice();
          this.leftPrice = this.check.total_price;
          this.rightPrice = 0;
        }
      });
    });
    this.settings.getPrinters().subscribe(res => this.printers = res.value);
  }

  ngOnInit() {
    this.fillData();
  }

  addToCheck(product) {
    this.countProductsData(product._id, product.price);
    let newProduct = new CheckProduct(product._id, product.cat_id, product.name, product.price, '', 1, this.owner, Date.now());
    this.check.total_price = this.check.total_price + product.price;
    this.check.products.push(newProduct);
    this.newOrders.push(newProduct);
  }

  sendCheck() {
    this.printOrder();
    this.updateUserReport();
    this.check.products.forEach(element => {
      if (element.status === 1) {
        element.status = 2;
      }
    });
    this.updateProductReport(this.countData);
    if (this.check.status == 1) {
      this.mainService.updateData('checks', this.check_id, this.check);
    } else {
      this.check.status = 1;
      this.mainService.addData('checks', this.check);
    }
    this.mainService.updateData('tables', this.id, { status: 2 });
    this.router.navigate(['/store']);
  }

  changePayStatus(status) {
    if (status == 1) {
      if (this.productsWillPay.length == 0) {
        this.productsWillPay = this.deProducts.slice();
      } else {
        this.productsWillPay = this.productsWillPay.concat(this.deProducts.slice());
      }
      for (let index in this.productsWillPay) {
        this.paymentProducts = this.paymentProducts.filter(obj => obj !== this.productsWillPay[index]);
      }
      for (let index in this.deProducts) {
        this.rightPrice += this.deProducts[index].price;
        this.leftPrice -= this.deProducts[index].price;
      }
      this.deProducts = [];
    } else {
      if (this.paymentProducts.length == 0) {
        this.paymentProducts = this.productsWillBack.slice();
      } else {
        this.paymentProducts = this.paymentProducts.concat(this.productsWillBack.slice());
      }
      for (let index in this.productsWillBack) {
        this.productsWillPay = this.productsWillPay.filter(obj => obj !== this.productsWillBack[index]);
      }
      for (let index in this.productsWillBack) {
        this.rightPrice -= this.productsWillBack[index].price;
        this.leftPrice += this.productsWillBack[index].price;
      }
      this.productsWillBack = [];
    }
  }

  payProduct(item, index, status) {
    if (status == 1) {
      let have = $('#payment_' + index + '').hasClass('selected');
      if (have) {
        $('#payment_' + index + '').removeClass('bg-warning selected');
        this.deProducts = this.deProducts.filter(product => product !== item);
      } else {
        $('#payment_' + index + '').addClass('bg-warning selected');
        this.deProducts.push(item);
      }
    } else {
      let have = $('#productWP_' + index + '').hasClass('selected2');
      if (have) {
        $('#productWP_' + index + '').removeClass('bg-warning selected2');
        this.productsWillBack = this.productsWillBack.filter(product => product !== item);
      } else {
        $('#productWP_' + index + '').addClass('bg-warning selected2');
        this.productsWillBack.push(item);
      }
    }
  }

  closeCheck(method) {
    let realMethod = method;
    if (this.check.type == 3) {
      method = 'Parçalı';
      let leftToFlow = new PaymentStatus(this.owner, realMethod, this.check.total_price, 0, Date.now(), this.check.products);
      this.check.total_price += this.check.discount;
      this.check.payment_flow.push(leftToFlow);
      this.check.products = [];
    }
    let closed_check = new ClosedCheck(this.check.table_id, this.check.total_price, this.check.discount, this.check.owner, '', this.check.status, this.check.products, Date.now(), 1, method, this.check.payment_flow);
    this.mainService.addData('closed_checks', closed_check).then(() => {
      this.updateProductReport(this.countData);
      this.updateTableReport(this.check);
    });
    this.mainService.updateData('tables', this.check.table_id, { status: 1 });
    if (this.check.status > 0) {
      this.mainService.removeData('checks', this.check_id);
    }
    this.updateSellingReport(method);
    $('#paymentMethod').modal('hide');
    this.router.navigate(['/store']);
  }

  payCheck(method) {
    if (this.pDiscount == undefined) {
      this.pDiscount = 0;
    }
    if (this.pDiscount + this.rightPrice >= this.check.total_price) {
      alert('Toplam Adisyon Hesabı ' + this.check.total_price + ' TL dir.');
      return false;
    }
    let pFlow = new PaymentStatus(this.owner, method, this.rightPrice, this.pDiscount, Date.now(), []);
    if (this.productsWillPay.length > 0) {
      this.check.total_price -= this.rightPrice;
      for (let index in this.productsWillPay) {
        this.check.products = this.check.products.filter(obj => obj !== this.productsWillPay[index]);
        pFlow.payed_products.push(this.productsWillPay[index]);
      }
    }
    if (this.check.discount == 0) {
      this.check.discount = this.pDiscount + this.rightPrice;
      this.check.total_price -= this.pDiscount;
    } else {
      this.check.discount += this.pDiscount + this.rightPrice;
      this.check.total_price -= this.pDiscount;
    }
    if (this.check.payment_flow == undefined) {
      this.check.payment_flow = [];
    }
    this.check.payment_flow.push(pFlow);
    this.check.type = 3;
    this.mainService.updateData('checks', this.check_id, this.check).then((res) => {
      if (res.ok) {
        this.check._rev = res.rev;
        this.deProducts = [];
        this.productsWillPay = [];
        this.productsWillBack = [];
        this.rightPrice = 0;
        this.pDiscount = undefined;
        this.message.sendMessage('Ürünler ' + method + ' olarak ödendi.');
        $('#paymentModal').modal('hide');
      }
    });
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
    this.mainService.updateData('checks', this.check_id, { note: note });
    form.reset();
    $('#checkNote').modal('hide');
  }

  cancelProduct(form: NgForm) {
    if (this.selectedProduct !== undefined) {
      this.decountProductsData(this.selectedProduct);
      this.check.products[this.selectedIndex].status = 3
      this.check.products[this.selectedIndex].note = 'Iptal: ' + form.value.description;
      this.check.products[this.selectedIndex].owner = this.owner;
      this.check.products[this.selectedIndex].timestamp = Date.now();
      this.check.total_price -= this.selectedProduct.price;
      this.mainService.updateData('checks', this.check_id, this.check).then((res) => {
        if (res.ok) {
          this.check._rev = res.rev;
          this.message.sendMessage('Ürün İptal Edildi');
          this.selectedProduct = undefined;
          this.selectedIndex = undefined;
          form.reset();
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

  updateSellingReport(method: string) {
    if (method !== 'Parçalı') {
      this.mainService.getAllBy('reports', { connection_id: method }).then(res => {
        if (res.docs.length > 0) {
          let doc = res.docs[0];
          doc.count++;
          doc.weekly_count[this.settings.getDay().day]++;
          doc.amount += this.check.discount + this.check.total_price;
          doc.weekly[this.settings.getDay().day] += this.check.discount + this.check.total_price;
          doc.update_time = Date.now();
          this.mainService.updateData('reports', doc._id, doc);
        }
      });
    } else {
      this.check.payment_flow.forEach((obj, index) => {
        this.mainService.getAllBy('reports', { connection_id: obj.method }).then(res => {
          this.mainService.changeData('reports', res.docs[0]._id, (doc) => {
            doc.count++;
            doc.weekly_count[this.settings.getDay().day]++;
            doc.amount += obj.amount + obj.discount;
            doc.weekly[this.settings.getDay().day] += obj.amount + obj.discount;
            doc.update_time = Date.now();
            return doc;
          });
        });
      });
    }
    this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
      let sellingAct = res.docs[0];
      let date = new Date();
      sellingAct.activity.push(this.check.total_price + this.check.discount);
      sellingAct.activity_time.push(date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes());
      this.mainService.updateData('reports', sellingAct._id, sellingAct);
    })
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
      this.mainService.updateData('reports', doc._id, doc);
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

  updateTableReport(check: Check) {
    this.mainService.getAllBy('reports', { connection_id: check.table_id }).then(res => {
      let report = res.docs[0];
      report.count++;
      report.amount += check.total_price;
      report.update_time = Date.now();
      report.weekly[this.settings.getDay().day] += check.total_price;
      report.weekly_count[this.settings.getDay().day]++;
      this.mainService.updateData('reports', report._id, report);
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
          splitPrintArray.forEach(order => {
            this.printerService.printOrder(order.printer, this.table.name, order.products);
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
    this.mainService.getAllBy('sub_categories', { cat_id: id }).then(res => {
      this.sub_categories = res.docs;
    });
    this.mainService.getAllBy('products', { cat_id: id }).then(result => {
      this.products = result.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);
    });
  }

  getProductsBySubCat(id) {
    this.mainService.getAllBy('products', { subcat_id: id }).then(result => {
      this.products = result.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);
    });
  }

  selectTable(id) {
    this.selectedTable = id;
  }

  splitTable() {
    if (this.check.status > 0) {
      this.mainService.updateData('tables', this.check.table_id, { status: 1 });
      this.mainService.updateData('tables', this.selectedTable, { status: 2 });
      this.mainService.updateData('checks', this.check_id, { table_id: this.selectedTable });
    }
    $('#splitTable').modal('hide');
    this.router.navigate(['/store']);
  }

  filterProducts(value: string) {
    this.sub_categories = undefined;
    let regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('products', { name: { $regex: regexp } }).then(res => {
      this.products = res.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);
    });
  }

  filterTables(id) {
    this.selectedTable = undefined;
    if (id !== '') {
      this.mainService.getAllBy('tables', { floor_id: id }).then(res => {
        this.allTables = res.docs;
        this.allTables = this.allTables.filter(obj => obj._id !== this.id && obj.status !== 2);
        this.allTables = this.allTables.sort((a, b) => a.name.localeCompare(b.name));
      });
    } else {
      this.mainService.getAllBy('tables', {}).then(res => {
        this.allTables = res.docs;
        this.allTables = this.allTables.filter(obj => obj._id !== this.id && obj.status !== 2);
        this.allTables = this.allTables.sort((a, b) => a.name.localeCompare(b.name));
      });
    }
  }

  fillData() {
    this.selectedCat = undefined;
    this.mainService.getAllBy('categories', {}).then(result => {
      this.sub_categories = undefined;
      this.categories = result.docs;
    });
    this.mainService.getAllBy('products', {}).then(result => {
      this.products = result.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);
    });
    this.mainService.getAllBy('tables', {}).then(res => {
      this.allTables = res.docs;
      this.table = this.allTables.filter(obj => obj._id == this.id)[0];
      this.allTables = this.allTables.filter(obj => obj._id !== this.id && obj.status !== 2);
      this.allTables = this.allTables.sort((a, b) => a.name.localeCompare(b.name));
    });
    this.mainService.getAllBy('floors', {}).then(res => {
      this.floors = res.docs;
    });
  }
}