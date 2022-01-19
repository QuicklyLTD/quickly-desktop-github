import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Cashbox } from '../../mocks/cashbox';
import { MessageService } from '../../providers/message.service';
import { LogService, logType } from '../../services/log.service';
import { MainService } from '../../services/main.service';
import { SettingsService } from '../../services/settings.service';


@Component({
  selector: 'app-cashbox',
  templateUrl: './cashbox.component.html',
  styleUrls: ['./cashbox.component.scss'],
  providers: [SettingsService]
})
export class CashboxComponent implements OnInit {
  cashboxData: Array<Cashbox>;
  selectedData: Cashbox;
  sellingIncomes: number;
  incomes: number;
  outcomes: number;
  leftTotal: number;
  type: string;
  user: string;
  onUpdate: boolean;
  day: any;
  @ViewChild('cashboxForm') cashboxForm: NgForm;

  constructor(private mainService: MainService, private settingsService: SettingsService, private messageService: MessageService, private logService: LogService) {
    this.user = this.settingsService.getUser('name');
    this.sellingIncomes = 0;
    this.settingsService.DateSettings.subscribe(res => {
      this.day = res.value.day;
    });
  }

  ngOnInit() {
    this.fillData();
    this.onUpdate = false;
  }

  addData(cashboxForm) {
    let form = cashboxForm.value;
    if (form.description == '' || null) {
      this.messageService.sendMessage('Açıklama Girmek Zorundasınız.');
      return false;
    }
    if (form.cash == null && form.card == null && form.coupon == null) {
      this.messageService.sendMessage('Herhangi Bir ' + this.type + ' Miktarı Belirtmelisiniz.');
      return false;
    }
    if (form.cash == null) { form.cash = 0 }
    if (form.card == null) { form.card = 0 }
    if (form.coupon == null) { form.coupon = 0 }
    if (!form._id) {
      let schema = new Cashbox(this.type, form.description, Date.now(), form.cash, form.card, form.coupon, this.user);
      this.mainService.addData('cashbox', schema).then(res => {
        this.logService.createLog(logType.CASHBOX_CREATED, res.id, `Kasaya ${(form.cash + form.card + form.coupon)} tutarında ${this.type} eklendi.`);
        this.fillData();
        this.messageService.sendMessage(this.type + ' Eklendi');
      });
    } else {
      let schema = new Cashbox(this.type, form.description, Date.now(), form.cash, form.card, form.coupon, this.user, form._id, form._rev);
      this.mainService.updateData('cashbox', form._id, schema).then(res => {
        this.fillData();
        this.messageService.sendMessage(this.type + ' Düzenlendi');
      });
    }
    this.cashboxForm.reset();
    $('#cashboxModal').modal('hide');
  }

  updateData(data) {
    this.onUpdate = true;
    this.selectedData = data;
    this.type = this.selectedData.type;
    this.mainService.getData('cashbox', data._id).then(res => {
      this.logService.createLog(logType.CASHBOX_UPDATED, res.id, `Kasa '${this.selectedData.description}' adlı ${this.type}'i güncellendi.`);
      this.cashboxForm.setValue(res);
      this.fillData();
      $('#cashboxModal').modal('show');
    })
  }

  removeData(id) {
    this.mainService.removeData('cashbox', id).then(res => {
      this.logService.createLog(logType.CASHBOX_DELETED, res.id, `Kasadan '${this.selectedData.description}' adlı ${this.type}'i silindi.`);
      this.messageService.sendMessage('Kayıt Silindi');
      this.fillData();
    });
    $('#cashboxModal').modal('hide');
  }

  setDefault() {
    this.cashboxForm.reset();
    this.onUpdate = false;
  }

  fillData() {
    this.sellingIncomes = 0;
    this.mainService.getAllBy('cashbox', {}).then(result => {
      this.cashboxData = result.docs;
      this.cashboxData.sort((a, b) => b.timestamp - a.timestamp);
      try {
        this.incomes = this.cashboxData.filter(obj => obj.type == 'Gelir').map(obj => obj.card + obj.cash + obj.coupon).reduce((a, b) => a + b);
      } catch (error) {
        this.incomes = 0;
      }
      try {
        this.outcomes = this.cashboxData.filter(obj => obj.type == 'Gider').map(obj => obj.card + obj.cash + obj.coupon).reduce((a, b) => a + b);
      } catch (error) {
        this.outcomes = 0;
      }
      let left = this.incomes - this.outcomes;
      this.mainService.getAllBy('reports', { type: 'Store' }).then(res => {
        let report = res.docs;
        report = report.filter(obj => obj.connection_id !== 'Genel').sort((a, b) => b.connection_id.localeCompare(a.connection_id));
        report.forEach((element, index) => {
          if (element.connection_id !== 'İkram') {
            this.sellingIncomes += element.weekly[this.day];
          }
          if (report.length - 1 == index) {
            this.leftTotal = this.sellingIncomes + left;
            this.leftTotal = Math.round(this.leftTotal);
          };
        });
      });
    });
  }
}
