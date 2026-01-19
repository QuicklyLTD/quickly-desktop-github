import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ElectronService } from './core/services';
import { MessageService } from './core/providers/message.service';
import { ApplicationService } from './core/services/application.service';
import { AuthService } from './core/services/auth.service';
import { MainService } from './core/services/main.service';
import { SettingsService } from './core/services/settings.service';
import { ConflictService } from './core/services/conflict.service';
import { Settings, ServerInfo, DayInfo } from './models/settings';
import { CallerIDService } from './core/providers/caller-id.service';
import { ScalerService } from './core/providers/scaler.service';
import { PrinterService } from './core/providers/printer.service';
import { ConnectionService } from './core/services/connection.service';
import { DayManagementService } from './core/services/day-management.service';
import { SyncService } from './core/services/sync.service';
import { OrderListenerService } from './core/services/order-listener.service';
import { POLLING_INTERVALS, SERVER_TYPES, SERVER_STATUS } from './shared/constants';

// Import components
import { KeyboardComponent } from './components/helpers/keyboard/keyboard.component';
import { CallerComponent } from './components/helpers/caller/caller.component';
import { MessageComponent } from './components/helpers/message/message.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, KeyboardComponent, CallerComponent, MessageComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Quickly';
  description = 'Quickly';
  version = '2.1.0';
  windowStatus = false;
  setupFinished = false;
  onSync = false;
  isE2E = false;

  private callerService = inject(CallerIDService);
  private scalerService = inject(ScalerService);
  private electronService = inject(ElectronService);
  private mainService = inject(MainService);
  private router = inject(Router);
  private applicationService = inject(ApplicationService);
  private settingsService = inject(SettingsService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private conflictService = inject(ConflictService);
  private printerService = inject(PrinterService);
  private connectionService = inject(ConnectionService);
  private dayManagementService = inject(DayManagementService);
  private syncService = inject(SyncService);
  private orderListenerService = inject(OrderListenerService);

  activationStatus: boolean;
  serverSettings: ServerInfo;
  dayStatus: DayInfo;
  
  // Data for order listener
  categories: any[] = [];
  products: any[] = [];
  printers: any[] = [];

  get connectionStatus(): boolean {
    return this.connectionService.getConnectionStatus();
  }

  get currentDate(): number {
    return this.connectionService.getDate();
  }

  get hasError(): boolean {
    return this.syncService.hasError;
  }

  constructor() {
    this.setOnSync(true);
  }

  private setOnSync(value: boolean) {
    this.onSync = value;
    this.orderListenerService.setOnSync(value);
  }

  ngOnInit(): void {
    this.isE2E = localStorage.getItem('E2E_TEST') === '1';
    if (localStorage.getItem('E2E_TEST') === '1') {
      this.setupFinished = true;
      this.setOnSync(false);
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const target = localStorage.getItem('E2E_TARGET') || 'store';
      if (hash.includes('setup')) {
        this.router.navigate(['/setup']);
      } else {
        this.router.navigate([`/${target}`]);
      }
      return;
    }
    if (this.electronService.isElectron) {
      this.settingsService.setLocalStorage();
      this.initAppSettings();
      this.connectionService.startMonitoring();
    } else {
      this.settingsService.setLocalStorage();
      this.initAppSettings();
      this.connectionService.startMonitoring();
      this.setOnSync(false);
    }
  }

  callMe() {
    // this.callerService.testCall();
  }

  initAppSettings() {
    this.mainService.getAllBy('settings', {}).then(res => {
      if (!res.docs || res.docs.length === 0) {
        this.activationStatus = undefined;
        this.setupFinished = false;
        this.setOnSync(false);
        this.router.navigate(['/setup']);
        return;
      }
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
    });
  }

  initAppProcess() {
    switch (this.activationStatus) {
      case true:
        this.setupFinished = true;
        if (this.serverSettings !== undefined) {
          if (this.serverSettings.status === SERVER_STATUS.ACTIVE) {
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
                  this.mainService.cleanupMissingTableRefs();
                  if (this.authService.getToken()) {
                    this.dayManagementService.dayCheck(this.dayStatus);
                  }
                  // Load data for order listener and start listeners
                  setTimeout(() => {
                    this.loadProductsData();
                    this.orderListenerService.startOrderListener();
                    this.printsListener();
                  }, 10000);
                }
              }).catch(err => {
                console.log(err);
                this.loadFromBackup();
              });
            } else if (this.serverSettings.type === SERVER_TYPES.SECONDARY) {
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
                    this.mainService.cleanupMissingTableRefs();
                    if (this.authService.getToken()) {
                      this.dayManagementService.dayCheck(this.dayStatus);
                    }
                    // Load data for order listener and start listeners
                    setTimeout(() => {
                      this.loadProductsData();
                      this.orderListenerService.startOrderListener();
                      this.printsListener();
                    }, 10000);
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
  }

  appDataInitializer() {
    this.syncService.appDataInitializer(() => {
      this.setOnSync(false);
      this.router.navigate(['']);
      this.settingsListener();
      this.mainService.cleanupMissingTableRefs();
      if (this.authService.getToken()) {
        this.dayManagementService.dayCheck(this.dayStatus);
      }
      setTimeout(() => this.endDayListener(), POLLING_INTERVALS.END_DAY_LISTENER_DELAY);
    });
  }

  endDayListener() {
    const signalListener = this.mainService.LocalDB['endday'].changes({ since: 'now', live: true }).on('change', () => {
      this.mainService.syncToRemote().cancel();
      this.setOnSync(true);
      signalListener.cancel();
      this.mainService.destroyDB('allData').then(res => {
        if (res.ok) {
          this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program kapatılacak.', 'success');
          setTimeout(() => {
            this.electronService.relaunchProgram();
          }, 5000);
        }
      });
    });
  }

  settingsListener() {
    return this.mainService.LocalDB['settings'].changes({ since: 'now', live: true }).on('change', () => {
      if (!this.onSync) {
        setTimeout(() => {
          this.electronService.reloadProgram();
        }, POLLING_INTERVALS.SETTINGS_RELOAD_DELAY);
      }
    });
  }

  updateActivityReport() {
    setInterval(() => {
      this.mainService.getAllBy('tables', {}).then(tables => {
        this.mainService.getAllBy('checks', {}).then(res => {
          const checks_total_count = res.docs.length;
          let checks_total_amount;
          let activity_value;
          try {
            checks_total_amount = res.docs.map(obj => obj.total_price + obj.discount).reduce((a, b) => a + b);
            activity_value = checks_total_amount / checks_total_count;
          } catch (error) {
            checks_total_amount = 0;
            activity_value = 0;
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
    }, POLLING_INTERVALS.ACTIVITY_REPORT_UPDATE);
  }

  updateLastSeen() {
    // intentionally empty (legacy behavior kept)
  }

  findServerSettings() {
    this.syncService.findServerSettings();
  }

  findAppSettings() {
    this.syncService.findAppSettings();
  }

  changeWindow() {
    this.electronService.fullScreen(this.windowStatus);
    this.windowStatus = !this.windowStatus;
  }

  exitProgram() {
    this.messageService.sendConfirm('Program Kapatılacak!').then(isOK => {
      if (isOK) {
        this.authService.logout();
        this.electronService.exitProgram();
      }
    });
  }

  /**
   * Load categories and products data for order listener
   */
  loadProductsData() {
    this.mainService.getAllBy('categories', {}).then(cats => {
      this.categories = cats.docs;
      console.log('Categories Data Loaded!');
    });
    this.mainService.getAllBy('products', {}).then(products => {
      this.products = products.docs;
      console.log('Products Data Loaded!');
    });
    this.settingsService.getPrinters().subscribe(res => {
      this.printers = res.value;
      console.log('Printers Data Loaded!');
    });
  }

  /**
   * Listen for print requests (checks and cancellations)
   */
  printsListener() {
    console.log('Printer Listener Process Started');
    return this.mainService.LocalDB['prints'].changes({ 
      since: 'now', 
      live: true, 
      include_docs: true 
    }).on('change', (change: any) => {
      if (!this.onSync) {
        if (!change.deleted) {
          const printObj = change.doc;
          
          // Check printing
          if (printObj.type === 'Check' && printObj.status === 0) { // PrintOutStatus.WAITING
            this.mainService.getData('checks', printObj.connection).then((check: any) => {
              this.mainService.getData('tables', check.table_id).then((table: any) => {
                this.mainService.updateData('prints', printObj._id, { status: 1 }).then(() => { // PrintOutStatus.PRINTED
                  this.printerService.printCheck(printObj.printer, table.name, check);
                }).catch(() => {
                  this.mainService.updateData('prints', printObj._id, { status: 2 }); // PrintOutStatus.ERROR
                });
              }).catch(() => {
                this.mainService.updateData('prints', printObj._id, { status: 2 });
              });
            }).catch(() => {
              this.mainService.updateData('prints', printObj._id, { status: 2 });
            });
          }
          
          // Cancel printing
          else if (printObj.type === 'Cancel' && printObj.status === 0) { // PrintOutStatus.WAITING
            const product = printObj.cancelObj.product;
            this.mainService.getAllBy('categories', {}).then(cats => {
              const categories = cats.docs;
              const catPrinter = categories.filter((cat: any) => cat._id === product.cat_id)[0].printer;
              const thePrinter = this.printers.filter((obj: any) => obj.name === catPrinter)[0];
              this.mainService.updateData('prints', printObj._id, { status: 1 }).then(() => {
                this.printerService.printCancel(
                  thePrinter, 
                  printObj.cancelObj.product, 
                  printObj.cancelObj.reason, 
                  printObj.cancelObj.table, 
                  printObj.cancelObj.owner
                );
              }).catch(() => {
                this.mainService.updateData('prints', printObj._id, { status: 2 });
              });
            }).catch(() => {
              this.mainService.updateData('prints', printObj._id, { status: 2 });
            });
          }
        }
      }
    });
  }

  /**
   * Load data from backup file (db.dat)
   */
  loadFromBackup() {
    this.syncService.loadFromBackup();
  }

  resetTimer() {
    this.applicationService.screenLock('reset');
  }
}
