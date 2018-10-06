import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from './providers/electron.service';
import { MessageService } from './providers/message.service';
import { ApplicationService } from './services/application.service';
import { AuthService } from './services/auth.service';
import { MainService } from './services/main.service';
import { SettingsService } from './services/settings.service';
import { ConflictService } from './services/conflict.service';
import { Settings, ServerInfo, DayInfo } from './mocks/settings.mock';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [SettingsService]
})

export class AppComponent implements OnInit {
  title = 'Quickly';
  description = 'Quickly';
  version = '1.3.2';
  windowStatus: boolean;
  connectionStatus: boolean;
  setupFinished: boolean;
  onSync: boolean;
  hasError: boolean;
  date: number;

  //// App Settings ////

  activationStatus: boolean;
  serverSettings: ServerInfo;
  dayStatus: DayInfo;


  constructor(private electronService: ElectronService, private mainService: MainService, private router: Router, private aplicationService: ApplicationService, private settingsService: SettingsService, private messageService: MessageService, private authService: AuthService, private conflictService: ConflictService) {
    this.date = Date.now();
    this.windowStatus = false;
    this.setupFinished = false;
    this.onSync = true;
    this.hasError = false;
  }

  ngOnInit() {
    if (this.electronService.isElectron()) {
      this.settingsService.setLocalStorage();
      this.initAppSettings();
      this.initConnectivityAndTime();
    }
  }

  initAppSettings() {
    this.mainService.getAllBy('settings', {}).then(res => {
      if (res.docs.length > 0) {
        let settings: Array<Settings> = res.docs;
        try {
          this.activationStatus = settings.find(obj => obj.key == 'ActivationStatus').value;
          this.dayStatus = settings.find(obj => obj.key == 'DateSettings').value;
          this.serverSettings = settings.find(obj => obj.key == 'ServerSettings').value;
        } catch (error) {
          console.log('Settings Error Documents Not Available');
          this.electronService.openDevTools();
        }
      }
      this.initAppProcess();
    });
  }

  initConnectivityAndTime() {
    setInterval(() => {
      this.date = Date.now();
      this.connectionStatus = this.aplicationService.connectionStatus();
    }, 5000);
  }

  initAppProcess() {
    switch (this.activationStatus) {
      case true:
        this.setupFinished = true;
        if (this.serverSettings !== undefined) {
          if (this.serverSettings.status == 1) {
            ////// Birincil Ekran ///////
            if (this.serverSettings.type == 0) {
              this.electronService.ipcRenderer.send('appServer', this.serverSettings.key, this.serverSettings.ip_port);
              this.mainService.syncToServer();
              this.conflictService.conflictListener();
              this.mainService.loadAppData().then((isLoaded: boolean) => {
                if (isLoaded) {
                  this.onSync = false;
                  this.updateActivityReport();
                  this.router.navigate(['']);
                }
              }).catch(err => {
                console.log(err);
              });
            }
            if (this.serverSettings.type == 1) {
              ////// İkincil Ekran //////
              this.mainService.replicateDB(this.serverSettings).on('complete', () => {
                this.mainService.loadAppData().then((isLoaded: boolean) => {
                  if (isLoaded) {
                    this.onSync = false;
                    this.router.navigate(['']);
                    const signalListener = this.mainService.LocalDB['endday'].changes({ since: 'now', live: true }).on('change', () => {
                      this.onSync = true;
                      signalListener.cancel();
                      this.mainService.syncToRemote().cancel();
                      let databasesArray = Object.keys(this.mainService.LocalDB).filter(obj => obj !== 'settings');
                      this.mainService.destroyDB(databasesArray).then(res => {
                        if (res.ok) {
                          setTimeout(() => {
                            this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program kapatılacak.', 'success');
                            this.electronService.shellCommand('shutdown now');
                          }, 5000);
                        }
                      });
                    });
                  }
                })
              }).catch(err => {
                console.log(err);
                this.hasError = true;
                setTimeout(() => {
                  this.electronService.relaunchProgram();
                }, 10000);
              });
              this.mainService.LocalDB['settings'].changes({ since: 'now', live: true }).on('change', (res) => {
                if (!this.onSync) {
                  setTimeout(() => {
                    this.electronService.reloadProgram();
                  }, 5000);
                }
              });
            }
          } else {
            if (this.serverSettings.type == 0) {
              this.onSync = false;
              this.mainService.loadAppData().then((isLoaded: boolean) => {
                if (isLoaded) {
                  this.onSync = false;
                  this.router.navigate(['']);
                }
              }).catch(err => {
                console.log(err);
              });
              this.updateActivityReport();
            }
          }
          this.mainService.syncToRemote();
          if (new Date().getDay() !== this.dayStatus.day) {
            if (this.dayStatus.started) {
              this.messageService.sendAlert('Dikkat!', 'Gün Sonu Yapılmamış.', 'warning');
            } else {
              this.messageService.sendAlert('Dikkat!', 'Gün Başı Yapmalısınız.', 'warning');
            }
          }
        } else {
          let serverDocument;
          let AppType = localStorage.getItem('AppType');
          this.mainService.getAllBy('allData', { key: 'ServerSettings' }).then(res => {
            switch (AppType) {
              case 'Primary':
                serverDocument = res.docs.find(obj => obj.value.type == 0);
                delete serverDocument._rev;
                this.mainService.putDoc('settings', serverDocument).then(res => {
                  this.electronService.reloadProgram();
                });
                break;
              case 'Secondary':
                serverDocument = res.docs.find(obj => obj.value.type == 1);
                delete serverDocument._rev;
                this.mainService.putDoc('settings', serverDocument).then(res => {
                  this.electronService.reloadProgram();
                });
              default:
                break;
            }
          })
          // this.mainService.syncToLocal('settings').then(res => {
          //   console.log(res);
          // })
        }
        break;
      case false:
        this.setupFinished = false;
        this.onSync = false;
        this.router.navigate(['/activation']);
        break;
      default:
        this.onSync = false;
        this.router.navigate(['/setup']);
        break;
    }
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