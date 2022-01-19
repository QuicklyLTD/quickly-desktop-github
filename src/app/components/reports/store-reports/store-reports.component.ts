import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Check, ClosedCheck, PaymentStatus, CheckType, CheckStatus, CheckNo } from '../../../mocks/check';
import { Log } from '../../../mocks/log';
import { MessageService } from '../../../providers/message.service';
import { PrinterService } from '../../../providers/printer.service';
import { LogService, logType } from '../../../services/log.service';
import { MainService } from '../../../services/main.service';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-store-reports',
  templateUrl: './store-reports.component.html',
  styleUrls: ['./store-reports.component.scss'],
  providers: [SettingsService]
})

export class StoreReportsComponent implements OnInit {
  AllChecks: Array<ClosedCheck>;
  FastChecks: Array<ClosedCheck>;
  DeliveryChecks: Array<ClosedCheck>;
  NormalChecks: Array<ClosedCheck>;
  NotPayedChecks: Array<ClosedCheck>;
  checkDetail: any;
  selectedCat: any;
  selectedPayment: PaymentStatus;
  selectedPaymentIndex: number;
  NormalTotal: number = 0;
  FastTotal: number = 0;
  DeliveryTotal: number = 0;
  printers: Array<any>;
  sellingLogs: Array<Log>;
  day: number;
  permissions: Object;
  @ViewChild('checkEdit') editForm: NgForm;

  constructor(private mainService: MainService, private printerService: PrinterService, private settingsService: SettingsService, private messageService: MessageService, private logService: LogService) {
    this.settingsService.DateSettings.subscribe(res => {
      this.day = res.value.day;
    });
    this.settingsService.getPrinters().subscribe(res => {
      this.printers = res.value;
    });
    this.fillData();

  }

  ngOnInit() {
    this.permissions = JSON.parse(localStorage['userPermissions']);
  }

  getDetail(check) {
    this.checkDetail = check;
    $('#reportDetail').modal('show');
  }

  filterTables(value: string) {
    if (value == '' || null) {
      this.fillData();
    } else {
      let regexp = new RegExp(value, 'i');
      this.mainService.getAllBy('tables', { name: { $regex: regexp } }).then(data => {
        if (data.docs.length > 0) {
          let results = this.AllChecks.filter(obj => obj.table_id == data.docs[0]._id);
          if (results.length > 0) {
            this.NormalChecks = results;
          }
        }
      });
    }
  }

  filterChecks(value: string) {
    if (this.AllChecks) {
      this.FastChecks = this.AllChecks.filter(obj => obj.owner.toLocaleLowerCase().includes(value.toLocaleLowerCase()) && obj.type == 2);
    }
  }

  getFastChecksBy(method) {
    if (this.AllChecks) {
      this.FastChecks = this.AllChecks.filter(obj => obj.payment_method == method && obj.type == 2);
    }
  }

  getNormalChecksBy(method) {
    if (this.AllChecks) {
      this.NormalChecks = this.AllChecks.filter(obj => obj.payment_method == method && obj.type == 1);
    }
  }

  rePrintCheck(check) {
    this.mainService.getData('tables', check.table_id).then(res => {
      if (check.products.length > 0) {
        this.printerService.printCheck(this.printers[0], res.name, check);
      } else {
        check.products = check.payment_flow.reduce((a, b) => a.payed_products.concat(b.payed_products));
        this.printerService.printCheck(this.printers[0], res.name, check);
      }
    }).catch(err => {
      this.printerService.printCheck(this.printers[0], check.table_id, check);
    });
  }

  reOpenCheck(check: ClosedCheck) {
    let checkWillReOpen;
    let discount = 0;
    if (check.payment_flow) {
      check.payment_flow.forEach(element => {
        discount += element.amount;
      });
      checkWillReOpen = new Check('Hızlı Satış', 0, discount, check.owner, 'Geri Açılan', check.status, check.products, Date.now(), CheckType.FAST, CheckNo(), check.payment_flow);
    } else {
      checkWillReOpen = new Check('Hızlı Satış', check.total_price, check.discount, check.owner, 'Geri Açılan', check.status, check.products, Date.now(), CheckType.FAST, CheckNo(), check.payment_flow);
    }
    this.mainService.addData('checks', checkWillReOpen).then(res => {
      this.mainService.removeData('closed_checks', check._id).then(res => {
        this.fillData();
        $('#checkDetail').modal('hide');
        this.messageService.sendAlert('Başarılı !', 'Hesap Geri Açıldı', 'success');
      });
    });
    if (check.payment_method !== 'Parçalı') {
      this.mainService.getAllBy('reports', { connection_id: check.payment_method }).then(res => {
        this.mainService.changeData('reports', res.docs[0]._id, (doc) => {
          doc.weekly[this.day] -= check.total_price;
          doc.weekly_count[this.day]--;
          return doc;
        });
      });
    } else {
      check.payment_flow.forEach(element => {
        this.mainService.getAllBy('reports', { connection_id: element.method }).then(res => {
          this.mainService.changeData('reports', res.docs[0]._id, (doc) => {
            doc.weekly[this.day] -= element.amount;
            return doc;
          });
        });
      });
    }
  }

  editCheck(form: NgForm) {
    let Form = form.value;
    if (this.checkDetail.payment_method !== Form.payment_method) {
      this.mainService.getAllBy('reports', { connection_id: this.checkDetail.payment_method }).then(res => {
        let docReport = res.docs[0];
        this.mainService.changeData('reports', docReport._id, (doc) => {
          doc.weekly[this.day] -= this.checkDetail.total_price;
          doc.weekly_count[this.day]--
          return doc;
        });
      });
      this.mainService.getAllBy('reports', { connection_id: Form.payment_method }).then(res => {
        let docReport = res.docs[0];
        this.mainService.changeData('reports', docReport._id, (doc) => {
          doc.weekly[this.day] += Form.total_price;
          doc.weekly_count[this.day]++
          return doc;
        });
      });
      this.mainService.updateData('closed_checks', this.checkDetail._id, { total_price: Form.total_price, payment_method: Form.payment_method }).then(res => {
        this.messageService.sendMessage('Hesap Düzenlendi!');
        this.fillData();
        $('#editCheck').modal('hide');
      });
    } else {
      if (this.checkDetail.total_price !== Form.total_price) {
        this.mainService.getAllBy('reports', { connection_id: this.checkDetail.payment_method }).then(res => {
          let docReport = res.docs[0];
          this.mainService.changeData('reports', docReport._id, (doc) => {
            doc.weekly[this.day] -= this.checkDetail.total_price;
            doc.weekly[this.day] += Form.total_price;
            return doc;
          });
        });
        this.mainService.updateData('closed_checks', this.checkDetail._id, { total_price: Form.total_price }).then(res => {
          this.messageService.sendMessage('Hesap Düzenlendi!');
          this.fillData();
          $('#editCheck').modal('hide');
        });
      } else {
        return false;
      }
    }
    this.logService.createLog(logType.CHECK_UPDATED, Form._id, `${this.checkDetail.total_price} TL tutarındaki kapatılan ${this.checkDetail.payment_method} hesap ${Form.total_price} TL ${Form.payment_method} olarak güncellendi.`);
  }

  cancelCheck(id, note) {
    this.messageService.sendConfirm('Kapanmış Hesap İptal Edilecek! Bu işlem geri alınamaz!').then(isOK => {
      if (isOK) {
        this.mainService.updateData('closed_checks', id, { description: note, type: 3 }).then(res => {
          this.logService.createLog(logType.CHECK_CANCELED, id, `${this.checkDetail.total_price} TL tutarındaki kapatılan hesap iptal edildi. Açıklama:'${note}'`)
          this.fillData();
          $('#cancelDetail').modal('hide');
        });
      }
    });
  }

  editPayment(i: number) {
    $('#editCheck').modal('hide');
    this.selectedPayment = this.checkDetail.payment_flow[i];
    this.selectedPaymentIndex = i;
    $('#paymentDetail').modal('show');
  }

  changePayment(paymentDetail: NgForm) {
    let Form = paymentDetail.value;
    if (Form.method !== this.selectedPayment.method) {
      this.mainService.getAllBy('reports', { connection_id: this.selectedPayment.method }).then(res => {
        let docReport = res.docs[0];
        this.mainService.changeData('reports', docReport._id, (doc) => {
          doc.weekly[this.day] -= this.selectedPayment.amount;
          doc.weekly_count[this.day]--
          return doc;
        });
        this.mainService.getAllBy('reports', { connection_id: Form.method }).then(res => {
          let docReport = res.docs[0];
          this.mainService.changeData('reports', docReport._id, (doc) => {
            doc.weekly[this.day] += Form.amount;
            doc.weekly_count[this.day]++
            return doc;
          });
        }).then(res => {
          this.checkDetail.total_price -= this.selectedPayment.amount;
          this.checkDetail.total_price += Form.amount;
          this.selectedPayment.amount = Form.amount;
          this.selectedPayment.method = Form.method;
          this.mainService.updateData('closed_checks', this.checkDetail._id, { total_price: this.checkDetail.total_price, payment_flow: this.checkDetail.payment_flow }).then(res => {
            this.messageService.sendMessage('Hesap Düzenlendi!');
            this.fillData();
            $('#editCheck').modal('show');
            $('#paymentDetail').modal('hide');
          });
        });
      });
    } else {
      if (this.selectedPayment.amount !== Form.amount) {
        this.mainService.getAllBy('reports', { connection_id: this.selectedPayment.method }).then(res => {
          let docReport = res.docs[0];
          this.mainService.changeData('reports', docReport._id, (doc) => {
            doc.weekly[this.day] -= this.selectedPayment.amount;
            doc.weekly[this.day] += Form.amount;
            return doc;
          }).then(res => {
            this.checkDetail.total_price -= this.selectedPayment.amount;
            this.checkDetail.total_price += Form.amount;
            this.selectedPayment.amount = Form.amount;
            this.mainService.updateData('closed_checks', this.checkDetail._id, { total_price: this.checkDetail.total_price, payment_flow: this.checkDetail.payment_flow }).then(res => {
              this.messageService.sendMessage('Hesap Düzenlendi!');
              this.fillData();
              $('#editCheck').modal('show');
              $('#paymentDetail').modal('hide');
            });
          });
        });
      } else {
        return false;
      }
    }
  }

  getLogs() {
    this.mainService.getAllBy('logs', {}).then(res => {
      this.sellingLogs = res.docs.filter(obj => obj.type >= logType.CHECK_CREATED && obj.type <= logType.ORDER_MOVED || obj.type == logType.DISCOUNT).sort((a, b) => b.timestamp - a.timestamp, 0);
    });
  }

  fillData() {
    this.mainService.getAllBy('closed_checks', {}).then(res => {
      if (res.docs.length > 0) {
        this.AllChecks = res.docs;
        this.AllChecks.sort((a, b) => b.timestamp - a.timestamp);
        this.NotPayedChecks = this.AllChecks.filter((obj) => obj.type == CheckType.CANCELED);
        this.FastChecks = this.AllChecks.filter(obj => obj.type == CheckType.FAST);
        this.NormalChecks = this.AllChecks.filter(obj => obj.type == CheckType.NORMAL);
        this.DeliveryChecks = this.AllChecks.filter(obj => obj.type == CheckType.ORDER)
        this.NormalTotal = this.NormalChecks.filter(obj => obj.payment_method !== 'İkram').map(obj => obj.total_price).reduce((a, b) => a + b, 0);
        this.FastTotal = this.FastChecks.filter(obj => obj.payment_method !== 'İkram').map(obj => obj.total_price).reduce((a, b) => a + b, 0);
        this.DeliveryTotal = this.DeliveryChecks.filter(obj => obj.payment_method !== 'İkram').map(obj => obj.total_price).reduce((a, b) => a + b, 0);
      }
    });
  }
}
