import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from './providers/electron.service';
import { MessageService } from './providers/message.service';
import { ApplicationService } from './services/application.service';
import { AuthService } from './services/auth.service';
import { MainService } from './services/main.service';
import { SettingsService } from './services/settings.service';
import { ConflictService } from './services/conflict.service';
import { Settings, ServerInfo, DayInfo } from './mocks/settings';
import { CallerIDService } from './providers/caller-id.service';
import { ScalerService } from './providers/scaler.service';
import { PrinterService } from './providers/printer.service';
import { ConnectionService } from './services/connection.service';
import { DayManagementService } from './services/day-management.service';
import { SyncService } from './services/sync.service';
import { OrderListenerService } from './services/order-listener.service';
import { Check } from './mocks/check';
import { PrintOut, PrintOutStatus } from './mocks/print';
import { POLLING_INTERVALS, SERVER_TYPES, SERVER_STATUS } from './shared/constants';

/**
 * AppComponent - Application lifecycle orchestrator
 *
 * Delegates to:
 * - ConnectionService: Time and connectivity monitoring
 * - DayManagementService: Day validation and synchronization
 * - SyncService: Database replication and data initialization
 * - OrderListenerService: Order change detection and printer routing
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'Quickly';
  description = 'Quickly';
  version = '1.9.5';
  windowStatus: boolean;
  setupFinished: boolean;
  onSync: boolean;

  //// App Settings ////

  activationStatus: boolean;
  serverSettings: ServerInfo;
  dayStatus: DayInfo;

  get connectionStatus(): boolean {
    return this.connectionService.getConnectionStatus();
  }

  get date(): number {
    return this.connectionService.getDate();
  }

  get hasError(): boolean {
    return this.syncService.hasError;
  }

  get statusMessage(): string {
    return this.syncService.statusMessage;
  }

  constructor(
    private callerService: CallerIDService,
    private scalerService: ScalerService,
    private electronService: ElectronService,
    private mainService: MainService,
    private router: Router,
    private aplicationService: ApplicationService,
    private settingsService: SettingsService,
    private messageService: MessageService,
    private authService: AuthService,
    private conflictService: ConflictService,
    private printerService: PrinterService,
    private connectionService: ConnectionService,
    private dayManagementService: DayManagementService,
    private syncService: SyncService,
    private orderListenerService: OrderListenerService
  ) {
    this.windowStatus = false;
    this.setupFinished = false;
    this.setOnSync(true);
  }

  private setOnSync(value: boolean) {
    this.onSync = value;
    this.orderListenerService.setOnSync(value);
  }

  ngOnInit() {
    // this.loadFromBackup();
    if (this.electronService.isElectron()) {
      this.settingsService.setLocalStorage();
      this.initAppSettings();
      this.connectionService.startMonitoring();

      // this.callerService.startCallerID();
      // this.callerService.testCall();
      // this.scalerService.startScaler();
    }
  }

  callMe() {
    // this.callerService.testCall();
  }

  initAppSettings() {
    this.mainService.getAllBy('settings', {}).then(res => {
      if (res.docs.length > 0) {
        const settings: Array<Settings> = res.docs;
        try {
          const appType = localStorage.getItem('AppType');
          let serverDoc;
          switch (appType) {
            case 'Primary':
              serverDoc = settings.find(obj => obj.key === 'ServerSettings' && obj.value.type === 0);
              break;
            case 'Secondary':
              serverDoc = settings.find(obj => obj.key === 'ServerSettings' && obj.value.type === 1);
              break;
            default:
              break;
          }
          if (serverDoc && serverDoc.value) {
            this.serverSettings = serverDoc.value;
          }
        } catch (error) {
          this.messageService.sendAlert('Bağlantı Hatası', 'Sunucu Bağlantı Anahtarı Bulunamadı!', 'error');
          this.findServerSettings();
        }
        try {
          this.dayStatus = settings.find(obj => obj.key === 'DateSettings').value;
        } catch (error) {
          this.messageService.sendAlert('Gün Dökümanı Hatası', 'Tarih Eşleştirmesi Başarısız', 'error');
          this.findAppSettings();
        }
        try {
          this.activationStatus = settings.find(obj => obj.key === 'ActivationStatus').value;
        } catch (error) {
          this.messageService.sendAlert('Aktivasyon Hatası', 'Aktivasyon Anahtarı Bulunamadı!', 'error');
          this.findAppSettings();
        }
      }
    }).then(() => {
      this.initAppProcess();
    }).catch(err => {
      console.log(err);
    })
  }

  initAppProcess() {
    switch (this.activationStatus) {
      case true:
        this.setupFinished = true;
        if (this.serverSettings !== undefined) {
          if (this.serverSettings.status === SERVER_STATUS.ACTIVE) {
            ////// Birincil Ekran ///////
            if (this.serverSettings.type === SERVER_TYPES.PRIMARY) {
              this.electronService.ipcRenderer.send('appServer', this.serverSettings.key, this.serverSettings.ip_port);
              this.mainService.syncToServer();
              this.conflictService.conflictListener();


              this.mainService.loadAppData().then((isLoaded: boolean) => {
                if (isLoaded) {
                  this.setOnSync(false);
                  this.updateActivityReport();
                  this.updateLastSeen();
                  this.router.navigate(['']);
                  this.dayManagementService.dayCheck(this.dayStatus);
                } else {
                  console.log('errr')
                }
              }).catch(err => {
                console.log(err);
                this.syncService.loadFromBackup();
              });
            } else if (this.serverSettings.type === SERVER_TYPES.SECONDARY) {
              ////// İkincil Ekran //////
              // this.mainService.destroyDB('allData').then(res => {
              //   this.mainService.initDatabases();
              //   setTimeout(() => this.serverReplication(), 1000)
              // }).catch(err => {
              //   console.log(err);
              //   this.hasError = true;
              // })
              this.syncService.serverReplication(this.serverSettings)
                .on('complete', () => {
                  setTimeout(() => this.appDataInitializer(), 2000);
                });
            }
          } else {
            if (this.serverSettings.type === SERVER_TYPES.PRIMARY) {
              this.setOnSync(false);
              this.mainService.loadAppData().then((isLoaded: boolean) => {
                if (isLoaded) {
                  this.setOnSync(false);
                  this.router.navigate(['']);
                  this.dayManagementService.dayCheck(this.dayStatus);
                }
              }).catch(err => {
                console.log(err);
              });
              this.updateActivityReport();
              this.updateLastSeen();
            }
          }
          this.mainService.syncToRemote();
        } else {
          this.findServerSettings();
        }
        break;
      case false:
        this.setupFinished = false;
        this.setOnSync(false);
        this.router.navigate(['/activation']);
        break;
      default:
        this.setOnSync(false);
        this.router.navigate(['/setup']);
        break;
    }
    if (this.serverSettings && this.serverSettings.type === SERVER_TYPES.PRIMARY) {
      setTimeout(() => this.orderListenerService.startOrderListener(), 10000)
      // this.printsListener();
    }
    // this.commandListener();
  }


  commandListener() {
    console.log('Command Listener Process Started');
    this.mainService.LocalDB['commands'].changes({ since: 'now', live: true, include_docs: true }).on('change', (change) => {
      if (!change.deleted) {
        const commandObj = change.doc;
        if (!commandObj.executed) {
          this.electronService.shellSpawn(commandObj.cmd, commandObj.args);
        }
      }
    });
  }

  appDataInitializer() {
    this.syncService.appDataInitializer(() => {
      this.setOnSync(false);
      this.router.navigate(['']);
      this.settingsListener();
      this.dayManagementService.dayCheck(this.dayStatus);
      setTimeout(() => this.endDayListener(), POLLING_INTERVALS.END_DAY_LISTENER_DELAY);
    });
  }

  endDayListener() {
    console.log('Endday Listener Process Started');
    const signalListener = this.mainService.LocalDB['endday'].changes({ since: 'now', live: true }).on('change', (changes) => {
      this.mainService.syncToRemote().cancel();
      console.log('Endday Processing...');
      this.setOnSync(true);
      signalListener.cancel();
      this.mainService.destroyDB('allData').then(res => {
        if (res.ok) {
          this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program kapatılacak.', 'success');
          setTimeout(() => {
            // this.electronService.shellCommand('shutdown now');
            this.electronService.relaunchProgram();
            console.log('Endday Finished')
          }, 5000);
        }
      });
    });
  }

  settingsListener() {
    console.log('Settings Listener Process Started');
    return this.mainService.LocalDB['settings'].changes({ since: 'now', live: true }).on('change', (res) => {
      if (!this.onSync) {
        setTimeout(() => {
          this.electronService.reloadProgram();
        }, POLLING_INTERVALS.SETTINGS_RELOAD_DELAY);
      }
    });
  }

  printsListener() {
    console.log('Printer Listener Process Started');
    return this.mainService.LocalDB['prints'].changes({ since: 'now', live: true, include_docs: true }).on('change', (change) => {
      if (!this.onSync) {
        if (!change.deleted) {
          const printObj: PrintOut = change.doc;
          console.log(printObj)
          if (printObj.type === 'Check' && printObj.status === PrintOutStatus.WAITING) {
            this.mainService.getData('checks', printObj.connection).then((check: Check) => {
              if (check) {
                this.mainService.getData('tables', check.table_id).then((table) => {
                  if (table) {
                    this.mainService.updateData('prints', printObj._id, { status: PrintOutStatus.PRINTED }).then((isOK) => {
                      this.printerService.printCheck(printObj.printer, table.name, check)
                    }).catch(err => {
                      console.log(err);
                    })
                  } else {
                    this.mainService.updateData('prints', printObj._id, { status: PrintOutStatus.ERROR });
                  }
                }).catch(err => {
                  this.mainService.updateData('prints', printObj._id, { status: PrintOutStatus.ERROR });
                })
              } else {
                this.mainService.updateData('prints', printObj._id, { status: PrintOutStatus.ERROR });
              }
            }).catch(err => {
              this.mainService.updateData('prints', printObj._id, { status: PrintOutStatus.ERROR });
            })
          }
        }
      }
    });
  }

  findAppSettings() {
    this.mainService.syncToLocal('settings').then(message => {
      this.messageService.sendMessage('Ayarlar Güncelleniyor...');
      this.electronService.reloadProgram();
    }).catch(err => {
      this.messageService.sendAlert('Hata!', 'Gün Dökümanı Bulunamadı!', 'error');
    });
  }

  findServerSettings() {
    let serverDocument;
    const AppType = localStorage.getItem('AppType');
    this.mainService.getAllBy('allData', { key: 'ServerSettings' }).then(res => {
      switch (AppType) {
        case 'Primary':
          serverDocument = res.docs.find(obj => obj.value.type === 0);
          delete serverDocument._rev;
          this.mainService.putDoc('settings', serverDocument).then(putRes => {
            this.electronService.reloadProgram();
          });
          break;
        case 'Secondary':
          serverDocument = res.docs.find(obj => obj.value.type === 1);
          delete serverDocument._rev;
          this.mainService.putDoc('settings', serverDocument).then(putRes => {
            this.electronService.reloadProgram();
          });
          break;
        default:
          break;
      }
    })
  }

  updateLastSeen() {
    // setInterval(() => {
    //   this.mainService.changeData('settings', 'lastseen', (obj) => {
    //     obj.value.last_seen = new Date().toLocaleString('tr-TR');
    //     obj.timestamp = Date.now();
    //     return obj;
    //   })
    // }, 60000)
  }

  updateActivityReport() {
    setInterval(() => {
      this.mainService.getAllBy('tables', {}).then(tables => {
        this.mainService.getAllBy('checks', {}).then(res => {
          const checks_total_count = res.docs.length;
          let checks_total_amount;
          let activity_value
          try {
            checks_total_amount = res.docs.map(obj => obj.total_price + obj.discount).reduce((a, b) => a + b);
            activity_value = checks_total_amount / checks_total_count;
          } catch (error) {
            checks_total_amount = 0;
            activity_value = 0
          }
          const activity_count = (checks_total_count * 100) / tables.docs.length;
          this.mainService.getAllBy('reports', { type: 'Activity' }).then(reportRes => {
            const sellingAct = reportRes.docs[0];
            const date = new Date();
            sellingAct.activity.push(Math.round(activity_value));
            sellingAct.activity_count.push(Math.round(activity_count));
            sellingAct.activity_time.push(date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes());
            this.mainService.updateData('reports', sellingAct._id, sellingAct);
          });
        });
      });
    }, POLLING_INTERVALS.ACTIVITY_REPORT_UPDATE)
  }

  resetTimer() {
    this.aplicationService.screenLock('reset');
  }

  exitProgram() {
    this.messageService.sendConfirm('Program Kapatılacak!').then(isOK => {
      if (isOK) {
        this.authService.logout();
        this.electronService.exitProgram();
      }
    })
  }

  changeWindow() {
    this.electronService.fullScreen(this.windowStatus);
    this.windowStatus = !this.windowStatus;
  }
}
