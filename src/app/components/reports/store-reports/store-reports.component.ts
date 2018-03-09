import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MainService } from '../../../services/main.service';
import { PrinterService } from '../../../providers/printer.service';
import { ClosedCheck, Check } from '../../../mocks/check.mock';
import { SettingsService } from '../../../services/settings.service';
import { MessageService } from '../../../providers/message.service';

@Component({
  selector: 'app-store-reports',
  templateUrl: './store-reports.component.html',
  styleUrls: ['./store-reports.component.scss'],
  providers: [SettingsService]
})

export class StoreReportsComponent implements OnInit {
  AllChecks: Array<ClosedCheck>;
  FastChecks: Array<ClosedCheck>;
  NormalChecks: Array<ClosedCheck>;
  NotPayedChecks: Array<ClosedCheck>;
  checkDetail: any;
  selectedCat: any;
  NormalTotal: number = 0;
  FastTotal: number = 0;
  printers: Array<any>;
  @ViewChild('checkEdit') editForm: NgForm;

  constructor(private mainService: MainService, private printerService: PrinterService, private settingsService: SettingsService, private messageService: MessageService) {
    this.fillData();
    this.settingsService.getPrinters().subscribe(res => {
      this.printers = res.value;
    });
  }

  ngOnInit() {
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

  editCheck(form: NgForm) {
    let Form = form.value;
    if (this.checkDetail.payment_method !== Form.payment_method) {
      this.mainService.getAllBy('reports', { connection_id: this.checkDetail.payment_method }).then(res => {
        let docReport = res.docs[0];
        this.mainService.changeData('reports', docReport._id, (doc) => {
          doc.weekly[this.settingsService.getDay().day] -= this.checkDetail.total_price;
          doc.weekly_count[this.settingsService.getDay().day]--
          return doc;
        });
      });
      this.mainService.getAllBy('reports', { connection_id: Form.payment_method }).then(res => {
        let docReport = res.docs[0];
        this.mainService.changeData('reports', docReport._id, (doc) => {
          doc.weekly[this.settingsService.getDay().day] += Form.total_price;
          doc.weekly_count[this.settingsService.getDay().day]++
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
            doc.weekly[this.settingsService.getDay().day] -= this.checkDetail.total_price;
            doc.weekly[this.settingsService.getDay().day] += Form.total_price;
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
  }

  cancelCheck(id, note) {
    let isOK = confirm('Kapanmış Hesap İptal Edilecek. Bu İşlem Geri Alınamaz!');
    if (isOK) {
      this.mainService.updateData('closed_checks', id, { description: note, type: 3 }).then(() => {
        this.fillData();
        $('#cancelDetail').modal('hide');
      });
    }
  }

  fillData() {
    this.mainService.getAllBy('closed_checks', {}).then(res => {
      if (res.docs.length > 0) {
        this.AllChecks = res.docs;
        this.AllChecks.sort((a, b) => b.timestamp - a.timestamp);
        this.NotPayedChecks = this.AllChecks.filter((obj) => obj.type == 3);
        this.FastChecks = this.AllChecks.filter(obj => obj.type == 2);
        this.NormalChecks = this.AllChecks.filter(obj => obj.type == 1);
        try {
          this.NormalTotal = this.NormalChecks.filter(obj => obj.payment_method !== 'İkram').map(obj => obj.total_price).reduce((a, b) => a + b);
          this.FastTotal = this.FastChecks.filter(obj => obj.payment_method !== 'İkram').map(obj => obj.total_price).reduce((a, b) => a + b);
        } catch (error) { }
      }
    });
  }
}
