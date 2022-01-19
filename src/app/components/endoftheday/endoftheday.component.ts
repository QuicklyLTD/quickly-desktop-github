import { Component, OnInit } from '@angular/core';
import { Cashbox } from '../../mocks/cashbox';
import { CheckType, ClosedCheck } from '../../mocks/check';
import { BackupData, EndDay } from '../../mocks/endoftheday';
import { Log } from '../../mocks/log';
import { Report } from '../../mocks/report';
import { ElectronService } from '../../providers/electron.service';
import { MessageService } from '../../providers/message.service';
import { PrinterService } from '../../providers/printer.service';
import { MainService } from '../../services/main.service';
import { SettingsService } from '../../services/settings.service';
import { ConflictService } from '../../services/conflict.service';
import { HttpService } from '../../services/http.service';

@Component({
  selector: 'app-endoftheday',
  templateUrl: './endoftheday.component.html',
  styleUrls: ['./endoftheday.component.scss'],
  providers: [SettingsService]
})

export class EndofthedayComponent implements OnInit {
  isStarted: boolean;
  day: number;
  dateToReport: number;
  printers: any;
  owner: string;
  endDayReport: EndDay;
  endDayData: Array<EndDay>;
  backupData: Array<BackupData>;
  checks: Array<ClosedCheck>;
  reports: Array<Report>;
  cashbox: Array<Cashbox>;
  logs: Array<Log>;
  selectedEndDay: EndDay;
  lastDay: any;
  progress: string;
  permissions: any;
  appType: any;
  serverSet: any;
  token: string;
  restaurantID: string;

  constructor(private electronService: ElectronService, private printerService: PrinterService, private mainService: MainService, private messageService: MessageService, private settingsService: SettingsService, private httpService: HttpService, private conflictService: ConflictService) {
    this.token = localStorage.getItem("AccessToken");
    this.owner = this.settingsService.getUser('id');
    this.permissions = JSON.parse(localStorage.getItem('userPermissions'));
  }

  ngOnInit() {
    this.progress = 'Veriler Senkorinize Ediliyor...'
    this.endDayData = [];
    this.backupData = [];
    this.settingsService.DateSettings.subscribe(res => {
      this.isStarted = res.value.started;
      this.day = res.value.day;
      this.dateToReport = res.value.time;
      this.endDayReport = new EndDay(this.dateToReport, this.owner, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, { male: 0, female: 0 }, '');
    })
    this.settingsService.AppSettings.subscribe(res => this.lastDay = res.value.last_day);
    this.settingsService.RestaurantInfo.subscribe(res => this.restaurantID = res.value.id);
    this.settingsService.ServerSettings.subscribe(res => {
      this.serverSet = res;
      this.appType = res.value
    });
    this.settingsService.getPrinters().subscribe(res => this.printers = res.value);
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
      clearInterval(this.conflictService.conflictListener());
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

      this.settingsService.setAppSettings('DateSettings', dateData).then((res) => {
        if (res.ok) {
          this.isStarted = true;
          this.messageService.sendAlert('Gün Başlatıldı!', 'Program 5 sn içinde yeniden başlatılacak.', 'success');
          setTimeout(() => {
            this.electronService.reloadProgram();
          }, 5000)
        }
      })

    }
  }

  endDay() {
    if (this.isStarted) {
      this.mainService.getAllBy('checks', {}).then((res) => {
        if (res.docs.length == 0) {
          $('#endDayModal').modal({backdrop:'static',keyboard:false});
          clearInterval(this.conflictService.conflictListener());
          setTimeout(() => {
            this.stepChecks();
          }, 2000)
        } else {
          this.messageService.sendAlert('Dikkat!', 'Ödenmesi alınmamış hesaplar var!', 'warning');
        }
      });
    } else {
      this.messageService.sendMessage('Gün Başı Yapmalısınız!');
      return false;
    }
  }


  StoreSalesReport = (checks: Array<ClosedCheck>) => {
    let SalesReport = { cash: 0, card: 0, coupon: 0, free: 0, canceled: 0, discount: 0, checks: checks.length, customers: { male: 0, female: 0 } };
    SalesReport.cash = checks.filter(obj => obj.payment_method == 'Nakit').map(obj => obj.total_price).reduce((a, b) => a + b, 0);
    SalesReport.card = checks.filter(obj => obj.payment_method == 'Kart').map(obj => obj.total_price).reduce((a, b) => a + b, 0);
    SalesReport.coupon = checks.filter(obj => obj.payment_method == 'Kupon').map(obj => obj.total_price).reduce((a, b) => a + b, 0);
    SalesReport.free = checks.filter(obj => obj.type !== CheckType.CANCELED && obj.payment_method == 'İkram').map(obj => obj.total_price).reduce((a, b) => a + b, 0);
    SalesReport.canceled = checks.filter(obj => obj.type == CheckType.CANCELED).map(obj => obj.total_price).reduce((a, b) => a + b, 0);
    SalesReport.discount = checks.filter(obj => obj.type !== CheckType.CANCELED).map(obj => obj.discount).reduce((a, b) => a + b, 0);
    SalesReport.customers.male = checks.filter(obj => obj.type !== CheckType.CANCELED && obj.hasOwnProperty('occupation')).map(obj => obj.occupation.male).reduce((a, b) => a + b, 0);
    SalesReport.customers.female = checks.filter(obj => obj.type !== CheckType.CANCELED && obj.hasOwnProperty('occupation')).map(obj => obj.occupation.female).reduce((a, b) => a + b, 0);
    const partial = checks.filter(obj => obj.payment_method == 'Parçalı');
    partial.forEach(element => {
      SalesReport.discount += element.discount;
      element.payment_flow.forEach(payment => {
        if (payment.method == 'Nakit') {
          SalesReport.cash += payment.amount;
        }
        if (payment.method == 'Kart') {
          SalesReport.card += payment.amount;
        }
        if (payment.method == 'Kupon') {
          SalesReport.coupon += payment.amount;
        }
        if (payment.method == 'İkram') {
          SalesReport.free += payment.amount;
        }
      })
    });
    return SalesReport;
  }

  stepChecks() {
    this.mainService.getAllBy('closed_checks', {}).then(res => {

      this.progress = 'Kapatılan Hesaplar Yedekleniyor...';
      this.checks = res.docs;
      const checksBackup = new BackupData('closed_checks', this.checks);
      this.backupData.push(checksBackup);

      const Sales = this.StoreSalesReport(this.checks);

      this.endDayReport.card_total = Sales.card;
      this.endDayReport.cash_total = Sales.cash;
      this.endDayReport.coupon_total = Sales.coupon;
      this.endDayReport.free_total = Sales.free;

      this.endDayReport.discount_total = Sales.discount;
      this.endDayReport.canceled_total = Sales.canceled;

      this.endDayReport.total_income = Sales.cash + Sales.card + Sales.coupon;

      this.endDayReport.check_count = this.checks.length;

      this.endDayReport.customers.male = Sales.customers.male;
      this.endDayReport.customers.female = Sales.customers.female;

      this.mainService.removeAll('closed_checks', {}).then(() => {
        this.mainService.removeAll('allData', { db_name: 'closed_checks' }).then(() => {
          this.progress = 'Kapatılan Hesaplar Temizlendi...';
          this.stepCashbox();
        });
      });
    });
  }

  stepCashbox() {
    let incomes = 0;
    let outcomes = 0;
    this.mainService.getAllBy('cashbox', {}).then(res => {
      this.progress = 'Kasa Verileri Yedekleniyor...';
      this.cashbox = res.docs;
      const cashboxBackup = new BackupData('cashbox', this.cashbox);
      this.backupData.push(cashboxBackup);
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
      this.mainService.removeAll('cashbox', {}).then(res => {
        this.mainService.removeAll('allData', { db_name: 'cashbox' }).then(() => {
          this.progress = 'Kasa Verileri Temizlendi...';
          this.stepReports();
        });
      });
    });
  }

  stepReports() {
    this.mainService.getAllBy('reports', {}).then(res => {
      this.progress = 'Raporlar Yedekleniyor...';
      this.reports = res.docs.filter(obj => obj.type !== 'Activity');
      const reportsBackup = new BackupData('reports', res.docs);
      this.backupData.push(reportsBackup);
      const activities = res.docs.filter(obj => obj.type == 'Activity');

      this.mainService.localSyncBeforeRemote('reports').on('complete', () => {
        this.progress = 'Raporlar Temizlendi...';
        this.stepLogs();
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
      }
    });
  }

  stepLogs() {
    this.mainService.getAllBy('logs', {}).then(res => {
      this.progress = 'Kayıtlar Yedekleniyor...';
      this.logs = res.docs;
      const logsBackup = new BackupData('logs', this.logs);
      this.backupData.push(logsBackup);
      this.mainService.removeAll('prints', {}).then(() => {
        this.mainService.removeAll('logs', {}).then(() => {
          this.mainService.removeAll('allData', { db_name: 'logs' }).then(() => {
            this.progress = 'Kayıtlar Temizlendi...';
            this.stepOrders();
          });
        });
      });
    }).catch(err => {
      console.log('Logs Clearing Error:', err)
    })
  }

  stepOrders() {
    this.mainService.getAllBy('orders', {}).then(res => {
      this.progress = 'Siparişler Yedekleniyor...';
      this.logs = res.docs;
      const logsBackup = new BackupData('orders', this.logs);
      this.backupData.push(logsBackup);
      this.mainService.removeAll('orders', {}).then(() => {
        this.mainService.removeAll('allData', { db_name: 'orders' }).then(() => {
          this.progress = 'Siparişler Temizlendi...';
          this.stepReceipts();
        });
      });
    }).catch(err => {
      console.log('Orders Clearing Error:', err)
    })
  }

  stepReceipts() {
    this.mainService.getAllBy('receipts', {}).then(res => {
      this.progress = 'Ödemeler Yedekleniyor...';
      this.logs = res.docs;
      const logsBackup = new BackupData('receipts', this.logs);
      this.backupData.push(logsBackup);
      this.mainService.removeAll('receipts', {}).then(() => {
        this.mainService.removeAll('allData', { db_name: 'receipts' }).then(() => {
          this.progress = 'Ödemeler Temizlendi...';
          this.stepFinal();
        });
      });
    }).catch(err => {
      console.log('Receipts Clearing Error:', err)
    })
  }

  stepFinal() {
    let finalDate = Date.now();
    this.endDayReport.data_file = finalDate.toString();
    this.progress = 'Yerel Süreç Tamamlanıyor...';
    this.mainService.addData('endday', this.endDayReport).then(() => {
      this.electronService.backupData(this.backupData, finalDate);
      this.printerService.printEndDay(this.printers[0], this.endDayReport);
      let dateData = { started: false, day: this.day, time: Date.now() };
      this.settingsService.setAppSettings('DateSettings', dateData).then((res) => {
        if (res.ok) {
          this.fillData();
          this.isStarted = false;
          setTimeout(() => {
            this.mainService.syncToRemote().cancel();
            if (this.appType.type == 0) {
              if (this.appType.status == 1) {
                this.electronService.ipcRenderer.send('closeServer');
                this.mainService.syncToServer().cancel();
              }
            }
            this.progress = 'Veritabanı Yedekleniyor!';
            this.uploadBackup(this.backupData, finalDate);
          }, 5000);
        }
      });
    }).catch(err => {
      console.log('Final Step Error: Document Post Error',err);
    })
  }


  uploadBackup(data: Array<BackupData>, timestamp: number) {
    this.httpService.post('/store/backup', { data: data, timestamp: timestamp }, this.token).subscribe(res => {
      if (res.ok) {
        this.coverData();
      }
    }, err => {
      console.log(err);
      this.messageService.sendAlert('Hata!', 'Veritabanı Yedeği İletilemedi', 'error');
      this.coverData();
    });
  }

  coverData() {
    this.mainService.getAllBy('allData', {}).then(res => {
      return res.docs.map((obj) => {
        delete obj._rev;
        return obj;
      })
    }).then((cleanDocs: Array<any>) => {
      this.electronService.fileSystem.writeFile(this.electronService.appRealPath + '/data/db.dat', JSON.stringify(cleanDocs), err => {
        if (!err) {
          this.progress = 'Veritabanı Yedeği Alındı!';
          this.refreshToken();
        }
      })
    }).catch(err => {
      console.log(err);
    })
  }

  refreshToken() {
    this.httpService.post('/store/refresh', null, this.token).subscribe(res => {
      if (res.ok) {
        const token = res.json().token;
        localStorage.setItem('AccessToken', token);
        this.purgeData(token);
      }
    }, err => {
      console.log(err);
      $('#endDayModal').modal('hide');
      this.messageService.sendAlert('Hata!', 'Sunucudan İzin Alınamadı', 'error');
      setTimeout(() => {
        this.electronService.relaunchProgram();
      }, 5000);
    });
  }

  purgeData(token) {
    this.mainService.getAllBy('allData', {}).then(res => {
      this.httpService.post(`/store/endday`, { docs: res.docs }, token).subscribe(res => {
        if (res.ok) {
          this.progress = 'Uzak Sunucu İsteği Onaylandı!';
          let databasesArray = Object.keys(this.mainService.LocalDB).filter(obj => obj !== 'settings')
          this.mainService.destroyDB(databasesArray).then(res => {
            if (res.ok) {
              setTimeout(() => {
                this.mainService.initDatabases();
                setTimeout(() => {
                  this.mainService.replicateFrom()
                    .on('active', () => {
                      this.progress = 'Veriler Sıfırlanıyor...';
                    })
                    .on('complete', (info) => {
                      this.progress = 'Gün Sonu Tamamlanıyor..';
                      $('#endDayModal').modal('hide');
                      this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program Yeniden Başlatılacak', 'success');
                      setTimeout(() => {
                        this.electronService.relaunchProgram();
                      }, 5000);
                    });
                  // this.mainService.syncToLocal().then(res => {
                  //   if (res) {
                  //     delete this.serverSet._rev;
                  //     this.mainService.putDoc('settings', this.serverSet).then(res => {
                  //       if (res.ok) {
                  //         $('#endDayModal').modal('hide');
                  //         this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program 5sn içinde kapatılacak.', 'success');
                  //         setTimeout(() => {
                  //           this.electronService.relaunchProgram();
                  //         }, 5000);
                  //       }
                  //     })
                  //   }
                  // })
                }, 3000)
              }, 2000)
            }
          });
        }
      }, err => {
        console.log(err);
        $('#endDayModal').modal('hide');
        this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program Yeniden Başlatılacak', 'success');
        setTimeout(() => {
          this.electronService.relaunchProgram();
        }, 5000);
        // const serverSelectedRevs = res.json();
        // this.electronService.fileSystem.readFile(this.electronService.appRealPath + '/data/db.dat', 'utf-8', (err, data) => {
        //   if (!err) {
        //     let appData = JSON.parse(data);
        //     appData.map(obj => {
        //       obj._rev = serverSelectedRevs.find(serverRes => serverRes[1] == obj._id)[2];
        //     });
        //     this.mainService.putAll('allData', appData).then(res => {
        //       this.progress = 'Gün Sonu Tamamlanıyor..';
        //       this.loadAppData().then(res => {
        //         if (res) {
        //           $('#endDayModal').modal('hide');
        //           this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program 5sn içinde kapatılacak.', 'success');
        //           setTimeout(() => {
        //             this.electronService.relaunchProgram();
        //           }, 5000);
        //         }
        //       })
        //     });
        //   }
        // });
      });
    })
  }

  fillData() {
    this.mainService.getAllBy('endday', {}).then((result) => {
      this.endDayData = result.docs;
      this.endDayData = this.endDayData.sort((a, b) => b.timestamp - a.timestamp).filter(obj => obj.total_income !== 0);
    });
  }
}