import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { MainService } from '../../../services/main.service';
import { SettingsService } from '../../../services/settings.service';
import { MessageService } from '../../../providers/message.service';
import { Check, CheckProduct, PaymentStatus, ClosedCheck } from '../../../mocks/check.mock';
import { PrinterService } from '../../../providers/printer.service';
import { Printer } from '../../../mocks/settings.mock';

@Component({
  selector: 'app-payment-screen',
  templateUrl: './payment-screen.component.html',
  styleUrls: ['./payment-screen.component.scss'],
  providers: [SettingsService]
})
export class PaymentScreenComponent implements OnInit {
  id: string;
  check: Check;
  table: string;
  userId: string;
  userName: string;
  payedShow: boolean;
  payedTitle: string;
  numboard: Array<any>;
  numpad: string;
  isFirstTime: boolean;
  productsWillPay: Array<CheckProduct>;
  priceWillPay: number;
  payedPrice: number;
  changePrice: number;
  changeMessage: string;
  printers: Array<Printer>;
  discounts: Array<number>;
  discount: number;
  discountAmount: number;
  currentAmount: number;

  constructor(private route: ActivatedRoute, private router: Router, private settings: SettingsService, private mainService: MainService, private printerService: PrinterService, private messageService: MessageService) {
    this.route.params.subscribe(params => {
      this.id = params['id'];
      this.fillData();
    });
    this.settings.getPrinters().subscribe(res => this.printers = res.value);
  }

  ngOnInit() {
    this.discounts = [5, 10, 15, 20, 25];
    this.numboard = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [".", 0, "✔"]];
    this.setDefault();
    this.payedShow = false;
    this.payedTitle = 'Alınan Ödemeleri Göster';
    this.userId = this.settings.getUser('id');
    this.userName = this.settings.getUser('name');
  }

  payProducts(method: string) {
    if (this.check.total_price == 0) {
      this.closeCheck(method);
    } else {
      let newPayment = new PaymentStatus(this.userName, method, this.currentAmount, this.discountAmount, Date.now(), this.productsWillPay);
      if (this.check.payment_flow == undefined) {
        this.check.payment_flow = [];
        this.check.type = 3;
      }
      this.check.payment_flow.push(newPayment);
      this.check.discount += this.priceWillPay;
      this.mainService.updateData('checks', this.id, this.check).then(res => {
        this.printerService.printPayment(this.printers[0], this.table, newPayment);
        this.messageService.sendMessage(`Ürünler ${method} olarak ödendi`);
        this.fillData();
        this.setDefault();
        this.togglePayed();
      });
    }
  }

  closeCheck(method: string) {
    let total_discounts = 0;
    let checkWillClose;
    if (this.check.type == 3) {
      let realMethod = method;
      method = 'Parçalı';
      let lastPayment = new PaymentStatus(this.userName, realMethod, this.currentAmount, this.discountAmount, Date.now(), this.productsWillPay);
      this.check.payment_flow.push(lastPayment);
      this.check.discount += this.priceWillPay;
      total_discounts = this.check.payment_flow.map(obj => obj.discount).reduce((a, b) => a + b);
      checkWillClose = new ClosedCheck(this.check.table_id, this.check.discount, total_discounts, this.userName, this.check.note, this.check.status, this.check.products, Date.now(), 1, method, this.check.payment_flow);
    } else {
      total_discounts = this.discountAmount;
      checkWillClose = new ClosedCheck(this.check.table_id, this.currentAmount, total_discounts, this.userName, this.check.note, this.check.status, this.productsWillPay, Date.now(), 1, method);
    }
    this.mainService.addData('closed_checks', checkWillClose).then(res => {
      if (res.ok) {
        this.updateSellingReport(method);
        this.updateTableReport(this.check)
        this.printerService.printCheck(this.printers[0],this.table,this.check);
        this.mainService.updateData('tables', this.check.table_id, { status: 1 }).then(res => {
          if (res.ok) {
            this.mainService.removeData('checks', this.check._id).then(res => {
              this.router.navigate(['/store']);
              this.messageService.sendMessage(`Hesap '${method}' olarak kapatıldı`);
            });
          }
        });
      }
    });
  }

  setDiscount(discount: number) {
    this.discount = discount;
    if (this.payedPrice == 0) {
      this.payedPrice = this.priceWillPay;
    }
    this.setChange();
    $('#discount').modal('hide');
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

  addProductToList(product: CheckProduct) {
    this.check.products = this.check.products.filter(obj => obj !== product);
    this.productsWillPay.push(product);
    this.check.total_price -= product.price;
    this.priceWillPay += product.price;
    this.numpad = this.priceWillPay.toString();
    this.setChange();
  }

  addProductToCheck(product: CheckProduct) {
    this.productsWillPay = this.productsWillPay.filter(obj => obj !== product);
    this.check.products.push(product);
    this.check.total_price += product.price;
    this.priceWillPay -= product.price;
    this.setChange();
  }

  sendAllProducts() {
    this.check.products.forEach(element => {
      this.productsWillPay.push(element);
      this.check.products = this.check.products.filter(obj => obj !== element);
    })
    this.priceWillPay = this.productsWillPay.map(obj => obj.price).reduce((a, b) => a + b);
    this.check.products = [];
    this.numpad = this.priceWillPay.toString();
    this.check.total_price = 0;
    this.setChange();
  }

  getPayment(number: number) {
    this.payedPrice += number;
    this.setChange();
  }

  setChange() {
    if (this.discount) {
      this.discountAmount = ((this.priceWillPay * this.discount) / 100);
      this.discountAmount = Math.round(this.discountAmount);
    }
    this.currentAmount = this.priceWillPay - this.discountAmount;
    this.changePrice = this.payedPrice - this.priceWillPay;
    this.changePrice += this.discountAmount;
    if (this.changePrice > 0) {
      this.changeMessage = 'Para Üstü';
    } else {
      this.changeMessage = 'Kalan Ödeme';
    }
  }

  pushKey(key: any) {
    if (key === "✔") {
      this.payedPrice = parseFloat(this.numpad);
      this.setChange();
      this.numpad = '';
    } else {
      if (this.isFirstTime) {
        this.numpad = '';
        this.isFirstTime = false;
      }
      this.numpad += key;
    }
  }

  cleanPad() {
    this.numpad = '';
    this.payedPrice = 0;
    this.discount = undefined;
    this.discountAmount = 0;
    this.currentAmount = 0;
    this.setChange();
  }

  printCheck() {
    this.printerService.printCheck(this.printers[0], this.table, this.check);
  }

  setDefault() {
    this.numpad = '';
    this.isFirstTime = true;
    this.productsWillPay = [];
    this.currentAmount = 0;
    this.priceWillPay = 0;
    this.changePrice = 0;
    this.payedPrice = 0;
    this.discountAmount = 0;
    this.discount = undefined;
  }

  updateSellingReport(method: string) {
    if (method !== 'Parçalı') {
      this.mainService.getAllBy('reports', { connection_id: method }).then(res => {
        if (res.docs.length > 0) {
          let doc = res.docs[0];
          doc.count++;
          doc.weekly_count[this.settings.getDay().day]++;
          doc.amount += this.check.discount + this.currentAmount;
          doc.weekly[this.settings.getDay().day] += this.check.discount + this.currentAmount;
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

  updateTableReport(check: Check) {
    this.mainService.getAllBy('reports', { connection_id: check.table_id }).then(res => {
      let report = res.docs[0];
      report.count++;
      report.amount += this.currentAmount;
      report.update_time = Date.now();
      report.weekly[this.settings.getDay().day] += this.currentAmount;
      report.weekly_count[this.settings.getDay().day]++;
      this.mainService.updateData('reports', report._id, report);
    });
  }


  fillData() {
    this.mainService.getData('checks', this.id).then(res => {
      this.check = res;
      this.check.products = this.check.products.filter(obj => obj.status == 2);
      this.mainService.getData('tables', this.check.table_id).then(res => {
        this.table = res.name;
      })
    });
  }
}
