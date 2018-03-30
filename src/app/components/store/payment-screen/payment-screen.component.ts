import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { MainService } from '../../../services/main.service';
import { SettingsService } from '../../../services/settings.service';
import { MessageService } from '../../../providers/message.service';
import { Check, CheckProduct, PaymentStatus, ClosedCheck } from '../../../mocks/check.mock';
import { PrinterService } from '../../../providers/printer.service';
import { Printer } from '../../../mocks/settings.mock';
import { LogService, logType } from '../../../services/log.service';

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
  tables_count: number;
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
  check_id: string;
  check_type: string;
  askForPrint: boolean;
  onClosing: boolean;
  @ViewChild('discountInput') discountInput: ElementRef;

  constructor(private route: ActivatedRoute, private router: Router, private settings: SettingsService, private mainService: MainService, private printerService: PrinterService, private messageService: MessageService, private logService: LogService) {
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
    this.onClosing = false;
  }

  ngOnDestroy() {
    if (this.onClosing) {
      this.productsWillPay.forEach(element => {
        this.check.products.push(element);
      })
      this.mainService.updateData('checks', this.check._id, this.check);
    }
  }

  payProducts(method: string) {
    if (this.discountAmount > 0) {
      this.logService.createLog(logType.DISCOUNT, this.userId, `${this.table} Hesabına ${this.discountAmount} TL tutarında indirim yapıldı.`);
    }
    if (this.check.total_price == 0 && this.changePrice >= 0) {
      this.closeCheck(method);
    } else {
      this.onClosing = true;
      let newPayment: PaymentStatus;
      let isAnyEqual = this.productsWillPay.some(obj => obj.price == (this.payedPrice + (this.discount ? this.discountAmount : 0)));
      let isAnyGreat = this.productsWillPay.some(obj => obj.price > (this.payedPrice + (this.discount ? this.discountAmount : 0)));
      let isAnyLittle = this.productsWillPay.some(obj => obj.price < (this.payedPrice + (this.discount ? this.discountAmount : 0)));
      if (this.changePrice < 0) {
        if (this.discount) {
          this.payedPrice = this.payedPrice + this.discountAmount;
        }
        if (isAnyEqual) {
          let equalProduct = this.productsWillPay.filter(obj => obj.price == this.payedPrice)[0];
          let indexOfEqual = this.productsWillPay.findIndex(obj => obj == equalProduct);
          newPayment = new PaymentStatus(this.userName, method, (this.payedPrice - this.discountAmount), this.discountAmount, Date.now(), [equalProduct]);
          this.productsWillPay.splice(indexOfEqual, 1);
        } else if (isAnyGreat) {
          let greatOne = this.productsWillPay.sort((a, b) => b.price - a.price)[0];
          let greatOneCopy = Object.assign({}, greatOne);
          greatOneCopy.price = this.payedPrice;
          newPayment = new PaymentStatus(this.userName, method, (this.payedPrice - this.discountAmount), this.discountAmount, Date.now(), [greatOneCopy]);
          greatOne.price -= this.payedPrice;
        } else if (isAnyLittle) {
          newPayment = new PaymentStatus(this.userName, method, (this.payedPrice - this.discountAmount), this.discountAmount, Date.now(), []);
          let priceCount = this.payedPrice;
          let willRemove = 0;
          this.productsWillPay = this.productsWillPay.filter(obj => obj).sort((a, b) => b.price - a.price);
          this.productsWillPay.forEach((product, index) => {
            if (priceCount > 0) {
              if (priceCount >= product.price) {
                newPayment.payed_products.push(Object.assign({}, product));
                willRemove++;
                priceCount -= product.price;
              } else {
                const productWillPush = Object.assign({}, product);
                productWillPush.price = priceCount;
                newPayment.payed_products.push(productWillPush);
                if (product.price - priceCount == 0) {
                  willRemove++;
                } else {
                  let pro = this.productsWillPay[index];
                  pro.price -= priceCount;
                }
                priceCount = 0;
              }
            }
          });
          this.productsWillPay.splice(0, willRemove);
        }
        this.priceWillPay -= this.payedPrice;
        this.currentAmount -= (this.payedPrice - this.discountAmount);
        this.numpad = this.priceWillPay.toString();
      } else {
        newPayment = new PaymentStatus(this.userName, method, this.currentAmount, this.discountAmount, Date.now(), this.productsWillPay);
      }
      if (this.check.payment_flow == undefined) {
        this.check.payment_flow = [];
      }
      this.check.payment_flow.push(newPayment);
      this.check.discount += this.payedPrice;
      this.payedPrice = 0;
      this.mainService.updateData('checks', this.id, this.check).then(res => {
        if (res.ok) {
          if (this.changePrice >= 0) {
            this.fillData();
            this.setDefault();
            this.messageService.sendMessage(`Ürünler ${method} olarak ödendi`);
          } else {
            delete this.check._rev;
            this.messageService.sendMessage(`Ürünlerin ${newPayment.amount} TL'si ${method} olarak ödendi`);
            this.discount = undefined;
            this.discountAmount = 0;
          }
          this.logService.createLog(logType.CHECK_CREATED, this.check._id, `${this.table} Hesabından ${newPayment.amount} TL tutarında ${method} ödeme alındı.`)
          this.togglePayed();
        }
      });
      this.isFirstTime = true;
    }
    this.updateActivityReport();
  }

  closeCheck(method: string) {
    let total_discounts = 0;
    let checkWillClose;
    if (this.check.payment_flow !== undefined && this.check.payment_flow.length > 0) {
      let realMethod = method;
      method = 'Parçalı';
      let lastPayment = new PaymentStatus(this.userName, realMethod, this.currentAmount, this.discountAmount, Date.now(), this.productsWillPay);
      this.check.payment_flow.push(lastPayment);
      this.check.discount += this.priceWillPay;
      total_discounts = this.check.payment_flow.map(obj => obj.discount).reduce((a, b) => a + b);
      let total_price = this.check.payment_flow.map(obj => obj.amount).reduce((a, b) => a + b);
      checkWillClose = new ClosedCheck(this.check.table_id, total_price, total_discounts, this.userName, this.check.note, this.check.status, this.check.products, Date.now(), this.check.type, method, this.check.payment_flow);
    } else {
      total_discounts = this.discountAmount;
      checkWillClose = new ClosedCheck(this.check.table_id, this.currentAmount, total_discounts, this.userName, this.check.note, this.check.status, this.productsWillPay, Date.now(), this.check.type, method);
    }
    if (this.check.type == 1) {
      this.router.navigate(['/store']);
    } else {
      this.router.navigate(['/home']);
    }
    this.mainService.addData('closed_checks', checkWillClose).then(res => {
      if (res.ok) {
        this.mainService.removeData('checks', this.check._id).then(res => {
          this.onClosing = false;
          this.mainService.updateData('tables', this.check.table_id, { status: 1 });
          this.logService.createLog(logType.CHECK_CLOSED, res.id, `${this.table} Hesabı ${this.currentAmount} TL tutarında ödeme alınarak kapatıldı.`);
          this.messageService.sendMessage(`Hesap '${method}' olarak kapatıldı`);
        });
        this.updateSellingReport(method);
        if (this.check.type == 1) {
          this.updateTableReport(this.check);
        }
      }
    });
    if (this.check.payment_flow == undefined) {
      if (this.askForPrint) {
        let isOK = confirm('Fiş Yazdırılsın mı ?');
        if (isOK) {
          this.printerService.printCheck(this.printers[0], this.table, checkWillClose);
        }
      } else {
        this.printerService.printCheck(this.printers[0], this.table, checkWillClose);
      }
    }
  }

  setDiscount(discount: number) {
    this.discount = discount;
    if (this.payedPrice == 0) {
      this.payedPrice = this.priceWillPay;
    }
    this.setChange();
    this.discountInput.nativeElement.value = 0;
    $('#discount').modal('hide');
  }

  togglePayed() {
    if (this.payedShow) {
      this.payedShow = false;
      this.payedTitle = 'Alınan Ödemeleri Göster';
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
    this.numpad = this.priceWillPay.toString();
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
          doc.amount += this.currentAmount;
          doc.weekly[this.settings.getDay().day] += this.currentAmount;
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
            doc.amount += obj.amount;
            doc.weekly[this.settings.getDay().day] += obj.amount;
            doc.update_time = Date.now();
            return doc;
          });
        });
      });
    }
  }

  updateActivityReport() {
    this.mainService.getAllBy('checks', {}).then(res => {
      let checks_total_amount = res.docs.map(obj => obj.total_price + obj.discount).reduce((a, b) => a + b);
      let checks_total_count = res.docs.length;
      let activity_value = checks_total_amount / checks_total_count;
      let activity_count = (checks_total_count * 100) / this.tables_count;
      this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
        let sellingAct = res.docs[0];
        let date = new Date();
        sellingAct.activity.push(Math.round(activity_value));
        sellingAct.activity_count.push(Math.round(activity_count));
        sellingAct.activity_time.push(date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes());
        this.mainService.updateData('reports', sellingAct._id, sellingAct);
      });
    });
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
      if (this.check.type == 1) {
        this.check_id = this.check.table_id;
        this.check_type = 'Normal';
        this.mainService.getData('tables', this.check.table_id).then(res => {
          this.table = res.name;
        });
      } else {
        this.check_id = this.id;
        this.check_type = 'Fast';
        this.table = (this.check.note == '' ? 'Hızlı Satış' : this.check.note);
      }
      this.check.products = this.check.products.filter(obj => obj.status == 2);
    });
    this.mainService.getAllBy('tables', {}).then(res => { this.tables_count = res.docs.length; });
    this.settings.getAppSettings().subscribe((res: any) => {
      if (res.value.ask_print_check == 'Sor') {
        this.askForPrint = true;
      } else {
        this.askForPrint = false;
      }
    });
  }
}