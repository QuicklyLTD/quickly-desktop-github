import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../providers/electron.service';
import { PrinterService } from '../../providers/printer.service';
import { MainService } from '../../services/main.service';
import { MessageService } from '../../providers/message.service';
import { EndDay, BackupData } from '../../mocks/endoftheday.mock';
import { SettingsService } from '../../services/settings.service';
import { ClosedCheck } from '../../mocks/check.mock';
import { Report } from '../../mocks/report.mock';
import { Cashbox } from '../../mocks/cashbox.mock';

@Component({
  selector: 'app-endoftheday',
  templateUrl: './endoftheday.component.html',
  styleUrls: ['./endoftheday.component.scss'],
  providers: [SettingsService]
})

export class EndofthedayComponent implements OnInit {
  isStarted: boolean;
  day: number;
  printers: any;
  owner: string;
  endDayReport: EndDay;
  endDayData: Array<EndDay>;
  backupData: Array<BackupData>;
  total: number;
  checks: Array<ClosedCheck>;
  reports: Array<Report>;
  cashbox: Array<Cashbox>;
  selectedEndDay: EndDay;
  progress: string;

  constructor(private electronService: ElectronService, private printerService: PrinterService, private mainService: MainService, private messageService: MessageService, private settings: SettingsService) {
    this.isStarted = this.settings.getDay().started;
    this.day = this.settings.getDay().day;
    this.owner = this.settings.getUser('id');
    this.endDayReport = new EndDay(Date.now(), this.owner, 0, 0, 0, 0, 0, 0, 0, 0, 0, '');
  }

  ngOnInit() {
    this.progress = 'Veriler Senkorinize Ediliyor...'
    this.total = 0;
    this.endDayData = [];
    this.backupData = [];
    this.fillData();
  }

  getDetail(data: EndDay) {
    this.selectedEndDay = data;
  }

  startDay() {
    if (this.settings.getDay().started) {
      this.messageService.sendMessage('Gün Sonu Yapmalısınız!');
      return false;
    } else {
      localStorage.setItem('DayStatus', '{"started":true, "day":' + new Date().getDay() + ', "time": ' + Date.now() + '}');
      this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
        res.docs.forEach(element => {
          this.mainService.changeData('reports', element._id, (doc) => {
            doc.activity = [0];
            doc.activity_time = ['Gün Başlangıcı'];
            return doc;
          });
        });
      });
      this.messageService.sendMessage('Gün Başlatıldı.');
      if (this.settings.getDay().day == 1) {
        this.mainService.getAllBy('reports', {}).then(res => {
          let reports = res.docs.filter(obj => obj.type !== 'Activity');
          reports.forEach(element => {
            this.mainService.changeData('reports', element._id, (doc) => {
              doc.weekly = [0, 0, 0, 0, 0, 0, 0];
              doc.weekly_count = [0, 0, 0, 0, 0, 0, 0];
              return doc;
            });
          });
        });
        localStorage.setItem('WeekStatus', '{"started": true, "time": ' + Date.now() + '}');
      }
      this.isStarted = true;
      this.electronService.reloadProgram();
    }
  }

  endDay() {
    if (this.settings.getDay().started) {
      this.mainService.getAllBy('checks', {}).then((res) => {
        let date = Date.now();
        if (res.docs.length == 0) {
          $('#endDayModal').modal('show');
          this.stepChecks();
        } else {
          alert('Ödemesi Alınmamış Hesaplar Var..!');
        }
      });
    } else {
      this.messageService.sendMessage('Gün Başı Yapmalısınız!');
      return false;
    }
  }

  stepChecks() {
    this.mainService.getAllBy('closed_checks', {}).then(res => {
      this.checks = res.docs;
      const checksBackup = new BackupData('closed_checks', this.checks);
      this.backupData.push(checksBackup);
      let canceledTotal = 0;
      try {
        canceledTotal = res.docs.filter(obj => obj.type == 3).map(obj => obj.total_price).reduce((a, b) => a + b);
      } catch (error) {
        console.log('İptal Hesap Bulunamadı..')
      }
      this.mainService.compactBeforeSync('closed_checks');
      this.checks.forEach((element, index) => {
        this.mainService.removeDoc('closed_checks', element);
      });
      this.endDayReport.canceled_total = canceledTotal;
      this.endDayReport.check_count = this.checks.length;
      this.stepCashbox();
    });
  }

  stepCashbox() {
    this.mainService.getAllBy('cashbox', {}).then(res => {
      this.cashbox = res.docs;
      const cashboxBackup = new BackupData('cashbox', this.cashbox);
      this.backupData.push(cashboxBackup);
      this.mainService.compactBeforeSync('cashbox');
      this.cashbox.forEach((element, index) => {
        this.mainService.removeDoc('cashbox', element);
      });
      let incomes = 0;
      let outcomes = 0;
      try {
        incomes = this.cashbox.filter(obj => obj.type == 'Gelir').map(obj => obj.card + obj.cash + obj.coupon).reduce((a, b) => a + b);
        outcomes = this.cashbox.filter(obj => obj.type == 'Gider').map(obj => obj.card + obj.cash + obj.coupon).reduce((a, b) => a + b);
      } catch (error) {
        console.log('Kasa Geliri Yok..');
      }
      this.endDayReport.incomes = incomes;
      this.endDayReport.outcomes = outcomes;
      this.stepReports()
    });
  }

  stepReports() {
    this.mainService.getAllBy('reports', {}).then(res => {
      this.reports = res.docs.filter(obj => obj.type !== 'Activity');
      const reportsBackup = new BackupData('reports', this.reports);
      this.backupData.push(reportsBackup);
      ////////////////////////////////////////////////////////////////////
      const activities = res.docs.filter(obj => obj.type == 'Activity');
      const storeData = res.docs.filter(obj => obj.type == 'Store' && obj.connection_id !== 'İkram');
      storeData.forEach(element => {
        this.total += element.weekly[this.settings.getDay().day];
      });
      let cashTotal = this.reports.filter(obj => obj.connection_id == 'Nakit')[0].weekly[this.day];
      let cardTotal = this.reports.filter(obj => obj.connection_id == 'Kart')[0].weekly[this.day];
      let couponTotal = this.reports.filter(obj => obj.connection_id == 'Kupon')[0].weekly[this.day];
      let freeTotal = this.reports.filter(obj => obj.connection_id == 'İkram')[0].weekly[this.day];
      this.endDayReport.cash_total = cashTotal;
      this.endDayReport.card_total = cardTotal;
      this.endDayReport.coupon_total = couponTotal;
      this.endDayReport.free_total = freeTotal;
      this.endDayReport.total_income = this.total;
      /////////////////////////////////////////////////////////////////
      activities.forEach(element => {
        this.mainService.changeData('reports', element._id, (doc) => {
          doc.activity = [];
          doc.activity_count = [];
          doc.activity_time = [];
          return doc;
        });
      });
      //////////////////////////////////////////////////////////////////
      if (this.settings.getDay().day == 0) {
        this.reports.forEach((element, index) => {
          this.mainService.changeData('reports', element._id, (doc) => {
            doc.weekly = [0, 0, 0, 0, 0, 0, 0];
            doc.weekly_count = [0, 0, 0, 0, 0, 0, 0];
            return doc;
          });
        });
        this.mainService.compactBeforeSync('reports');
        localStorage.setItem('WeekStatus', '{"started": false, "time": ' + Date.now() + '}');
      }
      //////////////////////////////////////////////////////////////////
      this.stepFinal()
    });
  }

  stepFinal() {
    this.endDayReport.time = Date.now();
    this.endDayReport.data_file = this.endDayReport.time + '.qdat';
    this.mainService.addData('endday', this.endDayReport).then(res => {
      this.electronService.backupData(this.backupData, this.endDayReport.time);
      this.printerService.printReport(this.printers[0], this.endDayReport);
      localStorage.setItem('DayStatus', '{"started":false, "day":' + this.settings.getDay().day + ', "time": ' + Date.now() + '}');
      this.fillData();
      this.isStarted = false;
      setTimeout(() => {
        $('#endDayModal').modal('hide');
        this.messageService.sendMessage('Gün Sonu Tamamlandı.');
        this.electronService.reloadProgram();
      }, 15000);
    });
  }

  fillData() {
    this.mainService.getAllBy('endday', {}).then((result) => {
      this.endDayData = result.docs;
      this.endDayData = this.endDayData.sort((a, b) => b.time - a.time);
    });
    this.settings.getPrinters().subscribe(res => this.printers = res.value);
  }
}