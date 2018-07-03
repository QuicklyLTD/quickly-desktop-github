import { Component, OnInit } from '@angular/core';
import { Cashbox } from '../../mocks/cashbox.mock';
import { ClosedCheck } from '../../mocks/check.mock';
import { BackupData, EndDay } from '../../mocks/endoftheday.mock';
import { Log } from '../../mocks/log.mock';
import { Report } from '../../mocks/report.mock';
import { ElectronService } from '../../providers/electron.service';
import { MessageService } from '../../providers/message.service';
import { PrinterService } from '../../providers/printer.service';
import { MainService } from '../../services/main.service';
import { SettingsService } from '../../services/settings.service';

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
  logs: Array<Log>;
  selectedEndDay: EndDay;
  lastDay: any;
  progress: string;
  permissions: any;

  constructor(private electronService: ElectronService, private printerService: PrinterService, private mainService: MainService, private messageService: MessageService, private settingsService: SettingsService) {
    this.settingsService.DateSettings.subscribe(res => {
      this.isStarted = res.value.started;
      this.day = res.value.day;
    })
    this.owner = this.settingsService.getUser('id');
    this.endDayReport = new EndDay(Date.now(), this.owner, 0, 0, 0, 0, 0, 0, 0, 0, 0, '');
    this.settingsService.AppSettings.subscribe(res => {
      this.lastDay = res.value.last_day;
    });
    this.permissions = JSON.parse(localStorage.getItem('userPermissions'));
  }

  ngOnInit() {
    this.progress = 'Veriler Senkorinize Ediliyor...'
    this.total = 0;
    this.endDayData = [];
    this.backupData = [];
    this.fillData();
  }

  getDetail(data: EndDay) {
    if (this.permissions.end) {
      this.selectedEndDay = data;
    } else {
      this.messageService.sendMessage('Görüntüleme Yetkiniz Yok')
    }
  }

  startDay() {
    if (this.isStarted) {
      this.messageService.sendMessage('Gün Sonu Yapmalısınız!');
      return false;
    } else {
      let dateData = { started: true, day: new Date().getDay(), time: Date.now() };
      this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
        res.docs.forEach(element => {
          this.mainService.changeData('reports', element._id, (doc) => {
            doc.activity = [0];
            doc.activity_count = [0];
            doc.activity_time = ['GB'];
            return doc;
          });
        });
      });
      this.messageService.sendMessage('Gün Başlatıldı. Program Yeniden Başlatılıyor..');
      if (this.day == 1) {
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
      }
      this.settingsService.setAppSettings('DateSettings', dateData).then(() => {
        this.settingsService.setLocalStorage();
        this.isStarted = true;
        setTimeout(() => {
          this.electronService.reloadProgram();
        }, 5000)
      })
    }
  }

  endDay() {
    if (this.isStarted) {
      this.mainService.getAllBy('checks', {}).then((res) => {
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
      this.progress = 'Kapatılan Hesaplar Yedekleniyor...';
      this.checks = res.docs;
      const checksBackup = new BackupData('closed_checks', this.checks);
      this.backupData.push(checksBackup);
      let canceledTotal = 0;
      try {
        canceledTotal = res.docs.filter(obj => obj.type == 3).map(obj => obj.total_price).reduce((a, b) => a + b);
      } catch (error) {
        console.log('İptal Hesap Bulunamadı..')
      }
      // this.mainService.localSyncBeforeRemote('closed_checks').on('complete', (info) => {
      //   this.progress = 'Kapatılan Hesaplar Temizlendi...';
      //   this.mainService.compactDB('closed_checks').then(() => {
      //     this.stepCashbox();
      //   });
      // });
      // this.checks.forEach((element, index) => {
      //   this.mainService.removeDoc('closed_checks', element);
      // });
      this.mainService.clearAll('closed_checks', {});
      this.mainService.clearAll('allData', { db_name: 'closed_checks' }).then(() => {
        this.progress = 'Kapatılan Hesaplar Temizlendi...';
        this.mainService.compactDB('closed_checks').then(() => {
          this.stepCashbox();
        });
      });
      this.endDayReport.canceled_total = canceledTotal;
      this.endDayReport.check_count = this.checks.length;
    });
  }

  stepCashbox() {
    this.mainService.getAllBy('cashbox', {}).then(res => {
      this.progress = 'Kasa Verileri Yedekleniyor...';
      this.cashbox = res.docs;
      const cashboxBackup = new BackupData('cashbox', this.cashbox);
      this.backupData.push(cashboxBackup);
      // this.mainService.localSyncBeforeRemote('cashbox').on('complete', (info) => {
      //   this.progress = 'Kasa Verileri Temizlendi...';
      //   this.mainService.compactDB('cashbox').then(() => {
      //     this.stepReports();
      //   });
      // });
      // this.cashbox.forEach((element, index) => {
      //   this.mainService.removeDoc('cashbox', element);
      // });
      this.mainService.clearAll('cashbox', {});
      this.mainService.clearAll('allData', { db_name: 'cashbox' }).then(() => {
        this.progress = 'Kasa Verileri Temizlendi...';
        this.mainService.compactDB('cashbox').then(() => {
          this.stepReports();
        });
      });
      let incomes = 0;
      let outcomes = 0;
      try {
        incomes = this.cashbox.filter(obj => obj.type == 'Gelir').map(obj => obj.card + obj.cash + obj.coupon).reduce((a, b) => a + b);
        this.endDayReport.incomes = incomes;
      } catch (error) {
        this.endDayReport.incomes = 0;
        console.log('Kasa Geliri Yok..');
      }
      try {
        outcomes = this.cashbox.filter(obj => obj.type == 'Gider').map(obj => obj.card + obj.cash + obj.coupon).reduce((a, b) => a + b);
        this.endDayReport.outcomes = outcomes;
      } catch (error) {
        this.endDayReport.outcomes = 0;
        console.log('Kasa Gideri Yok..');
      }
    });
  }

  stepReports() {
    this.mainService.getAllBy('reports', {}).then(res => {
      this.progress = 'Raporlar Yedekleniyor...';
      this.reports = res.docs.filter(obj => obj.type !== 'Activity');
      const reportsBackup = new BackupData('reports', this.reports);
      this.backupData.push(reportsBackup);
      ////////////////////////////////////////////////////////////////////
      const activities = res.docs.filter(obj => obj.type == 'Activity');
      const storeData = res.docs.filter(obj => obj.type == 'Store' && obj.connection_id !== 'İkram');
      storeData.forEach(element => {
        this.total += element.weekly[this.day];
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
      this.mainService.localSyncBeforeRemote('reports').on('complete', () => {
        this.progress = 'Raporlar Temizlendi...';
        this.mainService.compactDB('reports').then(() => {
          this.stepLogs();
        });
      });
      activities.forEach(element => {
        this.mainService.changeData('reports', element._id, (doc) => {
          doc.activity = [];
          doc.activity_count = [];
          doc.activity_time = [];
          return doc;
        });
      });
      if (this.day == this.lastDay) {
        this.reports.forEach((element) => {
          this.mainService.changeData('reports', element._id, (doc) => {
            doc.weekly = [0, 0, 0, 0, 0, 0, 0];
            doc.weekly_count = [0, 0, 0, 0, 0, 0, 0];
            return doc;
          });
        });
        localStorage.setItem('WeekStatus', '{"started": false, "time": ' + Date.now() + '}');
      }
    });
  }

  stepLogs() {
    this.mainService.getAllBy('logs', {}).then(res => {
      this.progress = 'Kayıtlar Yedekleniyor...';
      this.logs = res.docs;
      const logsBackup = new BackupData('logs', this.logs);
      this.backupData.push(logsBackup);
      this.mainService.clearAll('logs', {});
      this.mainService.clearAll('allData', { db_name: 'logs' }).then(() => {
        this.progress = 'Kayıtlar Temizlendi...';
        this.mainService.compactDB('logs').then(() => {
          this.stepFinal();
        });
      });

      // this.mainService.localSyncBeforeRemote('logs').on('complete', () => {
      // });
      // this.logs.forEach(element => {
      //   this.mainService.removeDoc('logs', element);
      // });
    });
  }

  stepFinal() {
    this.endDayReport.time = Date.now();
    this.endDayReport.data_file = this.endDayReport.time + '.qdat';
    this.progress = 'Gün Sonu Tamamlanıyor...';
    this.mainService.compactDB('allData').then(() => {
      this.mainService.addData('endday', this.endDayReport).then(() => {
        this.electronService.backupData(this.backupData, this.endDayReport.time);
        this.printerService.printReport(this.printers[0], this.endDayReport);
        this.progress = 'Gün Sonu Tamamlandı !';
        let dateData = { started: false, day: this.day, time: Date.now() };
        this.settingsService.setAppSettings('DateSettings', dateData);
        localStorage.setItem('DayStatus', JSON.stringify(dateData));
        this.fillData();
        this.isStarted = false;
        setTimeout(() => {
          $('#endDayModal').modal('hide');
          this.messageService.sendMessage('Program yeniden başlatılacak.');
          this.electronService.reloadProgram();
        }, 10000);
      });
    });
  }

  fillData() {
    this.mainService.getAllBy('endday', {}).then((result) => {
      this.endDayData = result.docs;
      this.endDayData = this.endDayData.sort((a, b) => b.time - a.time);
    });
    this.settingsService.getPrinters().subscribe(res => this.printers = res.value);
  }
}