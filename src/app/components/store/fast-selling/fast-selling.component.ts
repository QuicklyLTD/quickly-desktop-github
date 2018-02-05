import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MainService } from '../../../services/main.service';
import { MessageService } from '../../../providers/message.service';
import { ElectronService } from '../../../providers/electron.service';
import { PrinterService } from '../../../providers/printer.service';
import { Router } from '@angular/router';
import { Check, ClosedCheck, CheckProduct } from '../../../mocks/check.mock';
import { Product, Recipe, SubCategory } from '../../../mocks/product.mock';
import { Report } from '../../../mocks/report.mock';
import { Stock } from '../../../mocks/stocks.mock';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-fast-selling',
  templateUrl: './fast-selling.component.html',
  styleUrls: ['./fast-selling.component.scss'],
  providers: [SettingsService]
})

export class FastSellingComponent implements OnInit {
  categories: Array<any>;
  products: Array<Product>;
  sub_categories: Array<SubCategory>;
  check: Check;
  newOrders: Array<CheckProduct> = [];
  selectedProduct: CheckProduct;
  selectedIndex: number;
  noteForm: NgForm;
  owner: string;
  ownerRole: string;
  ownerId: string;
  method: string;
  countData: Array<any> = [];
  printers: Array<any>;
  selectedCat: string;

  constructor(private mainService: MainService, private printerService: PrinterService, private router: Router, private electron: ElectronService, private messageService: MessageService, private settings: SettingsService) {
    this.owner = this.settings.getUser('name');
    this.ownerRole = this.settings.getUser('type');
    this.ownerId = this.settings.getUser('id');
    this.check = new Check('TakeAway', 0, 0, this.owner, '', 0, [], Date.now(), 2);
    this.selectedCat = undefined;
  }

  ngOnInit() {
    this.fillData();
  }

  addToCheck(product) {
    this.countProductsData(product._id, product.price);
    let newProduct = new CheckProduct(product._id, product.cat_id, product.name, product.price, '', product.status, this.owner, Date.now());
    this.check.total_price = this.check.total_price + product.price;
    this.check.products.push(newProduct);
    this.newOrders.push(newProduct);
  }

  payCheck(method) {
    $('#paymentModal').modal('hide');
    if (this.check.products.length == 0) {
      this.messageService.sendMessage('Hesaba Ürün Girmelisiniz.');
      return false;
    }
    this.check.table_id = method;
    this.printerService.printCheck(this.printers[0], 'Hizli Satis', this.check);
    let closedCheck = new ClosedCheck(this.check.table_id, this.check.total_price, this.check.discount, this.check.owner, '', this.check.status, this.check.products, Date.now(), 2, method);
    this.mainService.addData('closed_checks', closedCheck).then(() => {
      this.updateProductReport(this.countData);
      this.updateSellingReport(method);
      this.updateUserReport();
      this.messageService.sendMessage('Hesap Kapatıldı!');
      this.router.navigate(['home']);
    });
  }

  getPayment() {
    this.check.products.forEach((product: CheckProduct) => {
      product.status = 2;
    });
    this.mainService.addData('checks', this.check).then(res => {
      this.router.navigate(['payment', res.id]);
    })
  }

  selectProduct(index) {
    $('.bg-warning').removeClass('bg-warning');
    this.selectedProduct = this.check.products[index];
    this.selectedIndex = index;
    $('#product_' + index + '').addClass('bg-warning');
  }

  addNote(noteForm) {
    if (this.selectedProduct !== undefined) {
      let note = noteForm.value.description;
      let shit = this.check.products[this.selectedIndex];
      this.check.products[this.selectedIndex].note = note;
      noteForm.reset();
      $('#noteModal').modal('hide');
    } else {
      this.messageService.sendMessage('Not Eklemek için Ürün Seçimi Yapmalısınız');
    }
  }

  cancelProduct() {
    if (this.selectedProduct !== undefined) {
      this.decountProductsData(this.selectedProduct);
      if (this.selectedProduct.status == 2) {
        if (this.ownerRole == 'Yönetici') {
          this.check.total_price -= this.selectedProduct.price;
          this.check.products.splice(this.selectedIndex, 1);
          this.selectedProduct = undefined;
        } else {
          this.messageService.sendMessage('Sadece Yönetici Ürün İptali Gerçekleştirebilir.');
        }
      } else {
        this.check.total_price -= this.selectedProduct.price;
        this.check.products.splice(this.selectedIndex, 1);
        this.selectedProduct = undefined;
      }
    }
  }

  undoChanges() {
    let count = this.check.products.length;
    if (count > 0) {
      this.selectedProduct = undefined;
      $('.bg-warning').removeClass('bg-warning');
      if (this.check.products[count - 1].status !== 2) {
        let lastItem = this.check.products.pop();
        this.decountProductsData(lastItem);
        this.check.total_price = this.check.total_price - lastItem.price;
      } else {
        this.messageService.sendMessage('Eski Ürünler Geri Alınamaz!');
        return false;
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

  decountProductsData(deProduct) {
    let contains = this.countData.some(obj => obj.product === deProduct.description);
    if (contains) {
      let index = this.countData.findIndex(p_id => p_id.product == deProduct.description);
      this.countData[index].count--;
      this.countData[index].total -= deProduct.price;
      if (this.countData[index].count == 0) {
        this.countData = this.countData.filter(obj => obj.product !== deProduct.description);
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
      this.mainService.updateData('reports', doc._id, doc);
    });
  }

  updateSellingReport(method: string) {
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
    this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
      let sellingAct = res.docs[0];
      let date = new Date();
      sellingAct.activity.push(this.check.total_price + this.check.discount);
      sellingAct.activity_time.push(date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes());
      this.mainService.updateData('reports', sellingAct._id, sellingAct);
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

  filterProducts(value: string) {
    this.sub_categories = undefined;
    let regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('products', { name: { $regex: regexp } }).then(res => {
      this.products = res.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);
    });
  }

  fillData() {
    this.mainService.getAllBy('categories', {}).then(result => {
      this.sub_categories = undefined;
      this.categories = result.docs
    });
    this.mainService.getAllBy('products', {}).then(result => {
      this.products = result.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);
    });
    this.settings.getPrinters().subscribe(res => this.printers = res.value);
  }
}
