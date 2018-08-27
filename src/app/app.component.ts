import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from './providers/electron.service';
import { MessageService } from './providers/message.service';
import { ApplicationService } from './services/application.service';
import { AuthService } from './services/auth.service';
import { MainService } from './services/main.service';
import { SettingsService } from './services/settings.service';
import { ConflictService } from './services/conflict.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [SettingsService]
})

export class AppComponent implements OnInit {
  title = 'Quickly';
  description = 'Quickly';
  version = '1.3.0';
  date: number;
  windowStatus: boolean;
  connectionStatus: boolean;
  setupFinished: boolean;
  onSync: boolean;

  constructor(private electronService: ElectronService, private mainService: MainService, private router: Router, private aplicationService: ApplicationService, private settingsService: SettingsService, private messageService: MessageService, private authService: AuthService, private conflictService: ConflictService) {
    this.date = Date.now();
    this.windowStatus = false;
    this.setupFinished = false;
    this.onSync = false;
  }

  ngOnInit() {
    if (this.electronService.isElectron()) {
      this.settingsService.setLocalStorage();
      // this.loadAppBackup();
      this.startApp();
    }
    setInterval(() => {
      this.date = Date.now();
      this.connectionStatus = this.aplicationService.connectionStatus();
    }, 5000);
  }

  loadAppBackup() {
    let db_names = Object.keys(this.mainService.LocalDB).filter(obj => obj !== 'settings' && obj !== 'reports');
    console.log(db_names);
    db_names.forEach((db, index) => {
      this.mainService.destroyDB(db).then(res => {
        if (res.ok) {
          if (index == db_names.length - 1) {
            this.mainService.initDatabases();
            setTimeout(() => {
              this.electronService.fileSystem.readFile(this.electronService.appRealPath + '/data/db.dat', (err, data) => {
                if (!err) {
                  const realData = JSON.parse(data.toString('utf-8'));
                  this.mainService.putAll('allData', realData).then(() => {
                    db_names.forEach(element => {
                      let db_data = realData.filter(obj => obj.db_name == element);
                      db_data.map(obj => {
                        delete obj['db_name'];
                        delete obj['db_seq'];
                      })
                      if (db_data.length > 0) {
                        this.mainService.putAll(element, db_data).then(res => {
                          console.log(element, db_data);
                        });
                      }
                    });
                  });
                } else {
                  console.log('Dosya Yok')
                }
              });
            }, 5000)
          }
        }
      })
    });
  }

  startApp() {
    this.settingsService.ActivationStatus.subscribe(res => {
      if (res) {
        this.setupFinished = true;
        if (this.setupFinished) {
          if (res.value) {
            this.settingsService.DateSettings.subscribe(res => {
              if (new Date().getDay() !== res.value.day) {
                if (res.value.started) {
                  this.messageService.sendAlert('Dikkat!', 'Gün Sonu Yapılmamış.', 'warning');
                } else {
                  this.messageService.sendAlert('Dikkat!', 'Gün Başı Yapmalısınız.', 'warning');
                }
              }
            });
            this.settingsService.ServerSettings.subscribe(res => {
              let settings: any = res;
              let configrations = res.value;
              if (configrations.type == 0) {
                this.updateActivityReport();
              }
              if (configrations.status == 1) {
                if (configrations.type == 0) {
                  this.electronService.ipcRenderer.send('appServer', configrations.key, configrations.ip_port);
                  this.mainService.syncToServer();
                  this.conflictService.conflictListener();
                } else if (configrations.type == 1) {
                  let listener = this.mainService.LocalDB['endday'].changes({ since: 'now', live: true }).on('change', () => {
                    this.onSync = true;
                    listener.cancel();
                    this.mainService.syncToRemote().cancel();
                    this.router.navigate(['/endoftheday_no_guard']).then(() => {
                      $('#endDayModal').modal('show');
                      setTimeout(() => {
                        let databasesArray = Object.keys(this.mainService.LocalDB);
                        this.mainService.destroyDB(databasesArray).then(res => {
                          if (res.ok) {
                            setTimeout(() => {
                              this.mainService.initDatabases();
                              setTimeout(() => {
                                this.mainService.replicateDB(configrations).on('complete', () => {
                                  this.mainService.syncToLocal().then(res => {
                                    if (res) {
                                      delete settings._rev;
                                      this.mainService.putDoc('settings', settings).then(res => {
                                        if (res.ok) {
                                          $('#endDayModal').modal('hide');
                                          this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program 5sn içinde kapatılacak.', 'success');
                                          setTimeout(() => {
                                            this.electronService.shellCommand('shutdown now');
                                          }, 5000);
                                        }
                                      })
                                    }
                                  })
                                });
                              }, 60000);
                            }, 5000)
                          }
                        });
                      }, 10000);
                    });
                  });
                  this.mainService.LocalDB['settings'].changes({ since: 'now', live: true }).on('change', (res) => {
                    if (!this.onSync) {
                      clearInterval(this.conflictService.conflictListener());
                      setTimeout(() => {
                        this.electronService.reloadProgram();
                      }, 5000);
                    }
                  });
                }
              }
              this.mainService.syncToRemote();
            });
          } else {
            this.setupFinished = false;
            this.router.navigate(['/activation']);
          }
        }
      } else {
        this.router.navigate(['/setup']);
      }
    });
  }

  updateActivityReport() {
    setInterval(() => {
      this.mainService.getAllBy('tables', {}).then(tables => {
        this.mainService.getAllBy('checks', {}).then(res => {
          let checks_total_count = res.docs.length;
          let checks_total_amount;
          let activity_value
          try {
            checks_total_amount = res.docs.map(obj => obj.total_price + obj.discount).reduce((a, b) => a + b);
            activity_value = checks_total_amount / checks_total_count;
          } catch (error) {
            checks_total_amount = 0;
            activity_value = 0
          }
          let activity_count = (checks_total_count * 100) / tables.docs.length;
          this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
            let sellingAct = res.docs[0];
            let date = new Date();
            sellingAct.activity.push(Math.round(activity_value));
            sellingAct.activity_count.push(Math.round(activity_count));
            sellingAct.activity_time.push(date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes());
            this.mainService.updateData('reports', sellingAct._id, sellingAct);
          });
        });
      });
    }, 300000)
  }

  resetTimer() {
    this.aplicationService.screenLock('reset');
  }

  exitProgram() {
    let isOK = confirm('Programdan Çıkmak Üzeresiniz..');
    if (isOK) {
      this.authService.logout();
      this.electronService.exitProgram();
    }
  }

  changeWindow() {
    this.electronService.fullScreen(this.windowStatus);
    this.windowStatus = !this.windowStatus;
  }
}