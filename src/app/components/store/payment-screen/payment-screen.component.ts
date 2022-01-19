import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Check, CheckProduct, ClosedCheck, PaymentStatus, CheckStatus, CheckType, CheckNo } from '../../../mocks/check';
import { Printer, PaymentMethod } from '../../../mocks/settings';
import { MessageService } from '../../../providers/message.service';
import { PrinterService } from '../../../providers/printer.service';
import { LogService, logType } from '../../../services/log.service';
import { MainService } from '../../../services/main.service';
import { SettingsService } from '../../../services/settings.service';
import { Customer } from 'app/mocks/customer';

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
  canceledProducts: Array<CheckProduct>;
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
  permissions: Object;
  day: number;
  changes: any;
  paymentMethods: Array<PaymentMethod>
  customers: Array<Customer>;
  @ViewChild('discountInput') discountInput: ElementRef;
  @ViewChild('customerInput') customerInput: ElementRef;
  @ViewChild('creditNote') creditNote: ElementRef;

  constructor(private route: ActivatedRoute, private router: Router, private settingsService: SettingsService, private mainService: MainService, private printerService: PrinterService, private messageService: MessageService, private logService: LogService) {
    this.route.params.subscribe(params => {
      this.id = params['id'];
      this.fillData();
    });
    this.paymentMethods = [
      new PaymentMethod('Nakit', 'Nakit Ödeme', '#5cb85c', 'fa-money', 1, 1),
      new PaymentMethod('Kart', 'Kredi veya Banka Kartı', '#f0ad4e', 'fa-credit-card', 2, 1),
      new PaymentMethod('Kupon', 'İndirim Kuponu veya Yemek Çeki', '#5bc0de', 'fa-bookmark', 3, 1),
      new PaymentMethod('İkram', 'İkram Hesap', '#c9302c', 'fa-handshake-o', 4, 1)
    ];
    this.permissions = JSON.parse(localStorage['userPermissions']);
    this.settingsService.DateSettings.subscribe(res => {
      this.day = res.value.day;
    })
    this.settingsService.getPrinters().subscribe(res => this.printers = res.value);
  }

  ngOnInit() {
    this.discounts = [5, 10, 15, 20, 25, 40];
    this.numboard = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [".", 0, "✔"]];
    this.setDefault();
    this.payedShow = false;
    this.payedTitle = 'Ödemeleri Göster';
    this.userId = this.settingsService.getUser('id');
    this.userName = this.settingsService.getUser('name');
    this.onClosing = false;
    this.changes = this.mainService.LocalDB['checks'].changes({ since: 'now', live: true }).on('change', (change) => {
      if (change.id == this.id) {
        if (!change.deleted) {
          this.mainService.getData('checks', change.id).then(res => {
            this.fillData();
          })
        } else {
          this.router.navigate(['/store']);
        }
      }
    });
  }

  ngOnDestroy() {
    this.changes.cancel();
    if (this.onClosing) {
      this.productsWillPay.forEach(element => {
        this.check.products.push(element);
        this.check.total_price += element.price;
      });
      this.mainService.updateData('checks', this.check._id, this.check);
    }
  }

  payProducts(method: string) {
    // if(method == 'Nakit'){
    //   this.printerService.kickCashdraw(this.printers[0])
    // }
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
        this.numpad = this.priceWillPay.toFixed(2).toString();
      } else {
        newPayment = new PaymentStatus(this.userName, method, this.currentAmount, this.discountAmount, Date.now(), this.productsWillPay);
      }
      if (this.check.payment_flow == undefined) {
        this.check.payment_flow = [];
      }
      this.check.payment_flow.push(newPayment);
      this.check.discount += newPayment.amount;
      this.payedPrice = 0;
      if (this.changePrice >= 0) {
        this.setPayment();
        this.messageService.sendMessage(`Ürünler ${method} olarak ödendi`);
      } else {
        delete this.check._rev;
        this.messageService.sendMessage(`Ürünlerin ${newPayment.amount} TL'si ${method} olarak ödendi`);
        this.discount = undefined;
        this.discountAmount = 0;
      }
      this.logService.createLog(logType.CHECK_PAYED, this.check._id, `${this.table} Hesabından ${newPayment.amount} TL tutarında ${method} ödeme alındı.`)
      this.togglePayed();
      this.isFirstTime = true;
    }
  }

  closeCheck(method: string) {
    let total_discounts = 0;
    let checkWillClose;
    this.onClosing = false;
    if (this.check.payment_flow !== undefined && this.check.payment_flow.length > 0) {
      let realMethod = method;
      method = 'Parçalı';
      let lastPayment = new PaymentStatus(this.userName, realMethod, this.currentAmount, this.discountAmount, Date.now(), this.productsWillPay);
      this.check.payment_flow.push(lastPayment);
      this.check.discount += this.priceWillPay;
      total_discounts = this.check.payment_flow.map(obj => obj.discount).reduce((a, b) => a + b);
      let total_price = this.check.payment_flow.map(obj => obj.amount).reduce((a, b) => a + b);
      checkWillClose = new ClosedCheck(this.check.table_id, total_price, total_discounts, this.userName, this.check.note, this.check.status, this.check.products, Date.now(), this.check.type, method, this.check.payment_flow, null, this.check.occupation);
    } else {
      total_discounts = this.discountAmount;
      checkWillClose = new ClosedCheck(this.check.table_id, this.currentAmount, total_discounts, this.userName, this.check.note, this.check.status, this.productsWillPay, Date.now(), this.check.type, method, null, null, this.check.occupation);
    }
    if (this.askForPrint) {
      this.messageService.sendConfirm('Fiş Yazdırılsın mı ?').then(isOK => {
        if (isOK) {
          this.printerService.printCheck(this.printers[0], this.table, checkWillClose);
        }
      });
    } else {
      this.printerService.printCheck(this.printers[0], this.table, checkWillClose);
    }
    this.mainService.addData('closed_checks', checkWillClose).then(res => {
      if (res.ok) {
        this.mainService.removeData('checks', this.check._id).then(res => {
          if (this.check.type == 1) {
            this.mainService.updateData('tables', this.check.table_id, { status: 1 });
          }
          this.logService.createLog(logType.CHECK_CLOSED, res.id, `${this.table} Hesabı ${this.currentAmount} TL tutarında ödeme alınarak kapatıldı.`);
          this.messageService.sendMessage(`Hesap '${method}' olarak kapatıldı`);
        });
        this.updateSellingReport(method);
        if (this.check.type == 1) {
          this.updateTableReport(this.check, method);
        }
        this.router.navigate(['/store']);
      }
    });
  }

  createCredit(customer: string, creditNote: string) {
    if (this.check.payment_flow !== undefined) {
      let paymentMethod;
      (this.check.payment_flow.length > 0) ? paymentMethod = 'Parçalı' : paymentMethod = this.check.payment_flow[0].method;
      let checkWillClose = new ClosedCheck(this.check.table_id, this.check.discount, 0, this.userName, '', this.check.status, this.check.products, Date.now(), this.check.type, paymentMethod, this.check.payment_flow, null, this.check.occupation);
      this.updateSellingReport(paymentMethod);
      this.updateTableReport(this.check, paymentMethod);
      this.mainService.addData('closed_checks', checkWillClose);
    }
    let newCredit = new Check(customer, this.priceWillPay, CheckStatus.PASSIVE, this.userName, creditNote, 0, this.productsWillPay, Date.now(), CheckType.PASSIVE, CheckNo());
    this.mainService.addData('credits', newCredit).then(res => {
      if (res.ok) {
        if (this.check.type == 1) {
          this.mainService.updateData('tables', this.check.table_id, { status: 1 });
        }
        this.mainService.removeData('checks', this.check._id).then(res => {
          if (res.ok) {
            $('#otherOptions').modal('hide');
            this.router.navigate(['/store']);
          }
        })
      }
    });
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


  divideWillPay(division: number) {
      this.payedPrice = this.priceWillPay / division;
      this.setChange();
      this.numpad = this.payedPrice.toFixed(2).toString();
      $('#calculator').modal('hide');
  }

  togglePayed() {
    if (this.payedShow) {
      this.payedShow = false;
      this.payedTitle = 'Ödemeleri Göster';
    } else {
      this.payedShow = true;
      this.payedTitle = 'Ödemeleri Gizle';
    }
  }

  addProductToList(product: CheckProduct) {
    this.check.products = this.check.products.filter(obj => obj !== product);
    this.productsWillPay.push(product);
    this.check.total_price -= product.price;
    this.priceWillPay += product.price;
    this.numpad = this.priceWillPay.toFixed(2).toString();
    this.payedShow = false;
    this.payedTitle = 'Ödemeleri Göster';
    this.setChange();
  }

  addProductToCheck(product: CheckProduct) {
    this.productsWillPay = this.productsWillPay.filter(obj => obj !== product);
    this.check.products.push(product);
    this.check.total_price += product.price;
    this.priceWillPay -= product.price;
    this.numpad = this.priceWillPay.toFixed(2).toString();
    this.setChange();
  }

  sendAllProducts() {
    this.check.products.forEach(element => {
      this.productsWillPay.push(element);
      this.check.products = this.check.products.filter(obj => obj !== element);
    })
    this.priceWillPay = this.productsWillPay.map(obj => obj.price).reduce((a, b) => a + b);
    this.check.products = [];
    this.numpad = this.priceWillPay.toFixed(2).toString();
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

  setPayment() {
    this.productsWillPay = [];
    this.discountAmount = 0;
    this.changePrice = 0;
    this.currentAmount = 0;
    this.priceWillPay = 0;
    this.numpad = '';
    this.isFirstTime = true;
    this.discount = undefined;
  }

  updateSellingReport(method: string) {
    if (method !== 'Parçalı') {
      this.mainService.getAllBy('reports', { connection_id: method }).then(res => {
        if (res.docs.length > 0) {
          let doc = res.docs[0];
          doc.count++;
          doc.weekly_count[this.day]++;
          doc.monthly_count[new Date().getMonth()]++;
          doc.amount += this.currentAmount;
          doc.weekly[this.day] += this.currentAmount;
          doc.monthly[new Date().getMonth()] += this.currentAmount;
          doc.timestamp = Date.now();
          this.mainService.updateData('reports', doc._id, doc);
        }
      });
    } else {
      this.mainService.getAllBy('reports', { type: "Store" }).then(res => {
        let sellingReports = res.docs;
        this.check.payment_flow.forEach((obj, index) => {
          let reportWillChange = sellingReports.find(report => report.connection_id == obj.method);
          reportWillChange.count++;
          reportWillChange.weekly_count[this.day]++;
          reportWillChange.monthly_count[new Date().getMonth()] += obj.amount;
          reportWillChange.amount += obj.amount;
          reportWillChange.weekly[this.day] += obj.amount;
          reportWillChange.monthly[new Date().getMonth()] += obj.amount;
          reportWillChange.timestamp = Date.now();
          if (this.check.payment_flow.length == index + 1) {
            sellingReports.forEach((report) => {
              if (this.check.payment_flow.some(obj => obj.method == report.connection_id)) {
                this.mainService.updateData('reports', report._id, report);
              }
            });
          }
        });
      });
    }
  }

  updateTableReport(check: Check, method: string) {
    this.mainService.getAllBy('reports', { connection_id: check.table_id }).then(res => {
      let report = res.docs[0];
      if (method !== 'Parçalı') {
        report.count++;
        report.amount += this.currentAmount;
        report.timestamp = Date.now();
        report.weekly[this.day] += this.currentAmount;
        report.weekly_count[this.day]++;
        report.monthly[new Date().getMonth()] += this.currentAmount;
        report.monthly_count[new Date().getMonth()]++;
      } else {
        report.count++;
        report.weekly_count[this.day]++;
        report.monthly_count[new Date().getMonth()]++;
        report.timestamp = Date.now();
        this.check.payment_flow.forEach((obj, index) => {
          report.amount += obj.amount;
          report.weekly[this.day] += obj.amount;
          report.monthly[new Date().getMonth()] +=obj.amount;
        });
      }
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
      if (this.check.discountPercent) {
        this.setDiscount(this.check.discountPercent);
      }
      this.canceledProducts = this.check.products.filter(obj => obj.status == 3);
      this.check.products = this.check.products.filter(obj => obj.status == 2);
    });
    this.settingsService.getAppSettings().subscribe((res: any) => {
      if (res.value.ask_print_check == 'Sor') {
        this.askForPrint = true;
      } else {
        this.askForPrint = false;
      }
    });
    this.mainService.getAllBy('customers', {}).then(res => {
      this.customers = res.docs;
    })
  }
}