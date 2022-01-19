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
import { Order, OrderStatus, OrderType } from './mocks/order';
import { Category } from './mocks/product';
import { Check, CheckProduct } from './mocks/check';
import { Table } from './mocks/table';
import { PrintOut, PrintOutStatus } from './mocks/print';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [SettingsService]
})

export class AppComponent implements OnInit {
  title = 'Quickly';
  description = 'Quickly';
  version = '1.9.5';
  windowStatus: boolean;
  connectionStatus: boolean;
  setupFinished: boolean;
  onSync: boolean;
  hasError: boolean;
  statusMessage: string;
  date: number;

  printers: Array<any>;
  categories: Array<Category>;

  //// App Settings ////

  activationStatus: boolean;
  serverSettings: ServerInfo;
  dayStatus: DayInfo;


  constructor(private callerService: CallerIDService, private scalerService: ScalerService, private electronService: ElectronService, private mainService: MainService, private router: Router, private aplicationService: ApplicationService, private settingsService: SettingsService, private messageService: MessageService, private authService: AuthService, private conflictService: ConflictService, private printerService: PrinterService) {
    this.date = Date.now();
    this.windowStatus = false;
    this.setupFinished = false;
    this.onSync = true;
    this.hasError = false;
  }

  ngOnInit() {
    // this.loadFromBackup();
    if (this.electronService.isElectron()) {
      this.settingsService.setLocalStorage();
      this.initAppSettings();
      this.initConnectivityAndTime();

      this.settingsService.getPrinters().subscribe(res => this.printers = res.value);


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
        let settings: Array<Settings> = res.docs;
        try {
          let appType = localStorage.getItem('AppType');
          switch (appType) {
            case 'Primary':
              this.serverSettings = settings.find(obj => obj.key == 'ServerSettings' && obj.value.type == 0).value;
              break;
            case 'Secondary':
              this.serverSettings = settings.find(obj => obj.key == 'ServerSettings' && obj.value.type == 1).value;
            default:
              break;
          }
        } catch (error) {
          this.messageService.sendAlert('Bağlantı Hatası', 'Sunucu Bağlantı Anahtarı Bulunamadı!', 'error');
          this.findServerSettings();
        }
        try {
          this.dayStatus = settings.find(obj => obj.key == 'DateSettings').value;
        } catch (error) {
          this.messageService.sendAlert('Gün Dökümanı Hatası', 'Tarih Eşleştirmesi Başarısız', 'error');
          this.findAppSettings();
        }
        try {
          this.activationStatus = settings.find(obj => obj.key == 'ActivationStatus').value;
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
                  this.updateLastSeen();
                  this.router.navigate(['']);
                  this.dayCheck();
                } else {
                  console.log('errr')
                }
              }).catch(err => {
                console.log(err);
                this.loadFromBackup();
              });
            } else if (this.serverSettings.type == 1) {
              ////// İkincil Ekran //////
              // this.mainService.destroyDB('allData').then(res => {
              //   this.mainService.initDatabases();
              //   setTimeout(() => this.serverReplication(), 1000)
              // }).catch(err => {
              //   console.log(err);
              //   this.hasError = true;
              // })
              this.serverReplication()
            }
          } else {
            if (this.serverSettings.type == 0) {
              this.onSync = false;
              this.mainService.loadAppData().then((isLoaded: boolean) => {
                if (isLoaded) {
                  this.onSync = false;
                  this.router.navigate(['']);
                  this.dayCheck();
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
        this.onSync = false;
        this.router.navigate(['/activation']);
        break;
      default:
        this.onSync = false;
        this.router.navigate(['/setup']);
        break;
    }
    if (this.serverSettings.type == 0) {
      setTimeout(() => this.orderListener(), 10000)
      // this.printsListener();
    }
    // this.commandListener();
  }


  serverReplication() {
    this.hasError = false;
    console.log('Server Replicating Started!')
    this.mainService.replicateDB(this.serverSettings)
      .on('change', (sync) => {
        this.statusMessage = `${sync.docs_written} - Senkronize Ediliyor `;
      }).on('complete', () => {
        setTimeout(() => this.appDataInitializer(), 2000);
      })
      .on('active', () => {
        console.log('active')
      })
      .on('denied', (ass) => {
        console.log(ass, 'denied')
      })
      .on('error', (err) => {
        console.log(err);
      }).catch(err => {
        console.warn('Server Replicating Error:', err);
        this.hasError = true;
        this.electronService.openDevTools();
        this.serverReplication();
      });
  }

  orderListener() {
    console.log('Order Listener Process Started');
    this.mainService.getAllBy('settings', { key: 'Printers' }).then(prints => {
      let printers = prints.docs[0].value;
      this.mainService.LocalDB['orders'].changes({ since: 'now', live: true, include_docs: true }).on('change', (res) => {
        if (!this.onSync) {
          let Order: Order = res.doc;
          console.log(Order);
          if (Order.status == OrderStatus.APPROVED && Order.type !== OrderType.EMPLOOYEE) {
            this.mainService.getAllBy('categories', {}).then(cats => {
              let categories = cats.docs;
              this.mainService.getData('checks', Order.check).then((check: Check) => {
                this.mainService.getData('tables', check.table_id).then((table: Table) => {
                  let orders: Array<CheckProduct> = check.products.filter(product => Order.timestamp == product.timestamp);
                  if (orders.length > 0) {
                    let splitPrintArray = [];
                    orders.forEach((obj, index) => {
                      let catPrinter = categories.filter(cat => cat._id == obj.cat_id)[0].printer || printers[0].name;
                      let contains = splitPrintArray.some(element => element.printer.name == catPrinter);
                      if (contains) {
                        let index = splitPrintArray.findIndex(p_name => p_name.printer.name == catPrinter);
                        splitPrintArray[index].products.push(obj);
                      } else {
                        let thePrinter = printers.filter(obj => obj.name == catPrinter)[0];
                        let splitPrintOrder = { printer: thePrinter, products: [obj] };
                        splitPrintArray.push(splitPrintOrder);
                      }
                    });
                    splitPrintArray.forEach(order => {
                      this.printerService.printOrder(order.printer, table.name, order.products, Order.user.name + (Order.type == OrderType.INSIDE ? ' (Müşteri)' : '(El Terminali)'));
                    });
                  };
                });
              });
            })
          }
        }
      });
    })

  }


  dayCheck() {
    if (new Date().getDay() !== this.dayStatus.day) {
      if (this.dayStatus.started) {
        this.messageService.sendAlert('Dikkat!', 'Gün Sonu Yapılmamış.', 'warning');
      } else {
        this.mainService.RemoteDB.find({ selector: { db_name: 'settings', key: 'DateSettings' }, limit: 5000 }).then((res) => {
          let serverDate: DayInfo = res.docs[0].value;
          if (serverDate.started) {
            this.mainService.getData('settings', res.docs[0]._id).then(settingsDoc => {
              this.mainService.LocalDB['settings'].get(settingsDoc._id).then(localDoc => {
                localDoc.value = serverDate;
                this.mainService.LocalDB['settings'].put(localDoc).then(isUpdated => {
                  this.electronService.reloadProgram();
                }).catch(err => {
                  console.log(err);
                })
              }).catch(err => {
                console.log(err);
              })
            }).catch(err => {
              console.log(err);
            })
          } else {
            this.messageService.sendAlert('Dikkat!', 'Gün Başı Yapmalısınız.', 'warning');
          }
        }).catch(err => {
          this.dayCheck();
        })
        // this.findAppSettings();
      }
    }
  }


  loadFromBackup() {
    this.electronService.fileSystem.readFile('./data/db.dat', (err, data) => {
      const rdata = JSON.parse(data.toString('utf-8'));
      this.mainService.destroyDB('allData').then(res => {
        if (res.ok) {
          this.mainService.initDatabases();
          setTimeout(() => {
            this.mainService.putAll('allData', rdata).then(res => {
              console.log(res);
              this.electronService.reloadProgram();
            }).catch(err => {
              this.electronService.reloadProgram();
            })
          }, 2500)
        }
      }).catch(err => {
        console.error(err);
      });
    })
  }

  commandListener() {
    console.log('Command Listener Process Started');
    this.mainService.LocalDB['commands'].changes({ since: 'now', live: true, include_docs: true }).on('change', (change) => {
      if (!change.deleted) {
        let commandObj = change.doc;
        if (!commandObj.executed) {
          this.electronService.shellSpawn(commandObj.cmd, commandObj.args);
        }
      }
    });
  }

  appDataInitializer() {
    this.mainService.loadAppData().then((isLoaded: boolean) => {
      if (isLoaded) {
        this.onSync = false;
        this.router.navigate(['']);
        this.settingsListener();
        this.dayCheck();
        setTimeout(() => this.endDayListener(), 120000)
      }
    }).catch(err => {
      console.warn('LoadApp Data Error:', err);
    })
  }

  endDayListener() {
    console.log('Endday Listener Process Started');
    const signalListener = this.mainService.LocalDB['endday'].changes({ since: 'now', live: true }).on('change', (changes) => {
      this.mainService.syncToRemote().cancel();
      console.log('Endday Processing...');
      this.onSync = true;
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
        }, 5000);
      }
    });
  }

  printsListener() {
    console.log('Printer Listener Process Started');
    return this.mainService.LocalDB['prints'].changes({ since: 'now', live: true, include_docs: true }).on('change', (change) => {
      if (!this.onSync) {
        if (!change.deleted) {
          let printObj: PrintOut = change.doc;
          console.log(printObj)
          if (printObj.type == 'Check' && printObj.status == PrintOutStatus.WAITING) {
            this.mainService.getData('checks', printObj.connection).then((check: Check) => {
              this.mainService.getData('tables', check.table_id).then((table) => {
                this.mainService.updateData('prints',printObj._id,{status:PrintOutStatus.PRINTED}).then((isOK) => {
                  this.printerService.printCheck(printObj.printer, table.name, check)
                }).catch(err => {
                  console.log(err);
                })
              }).catch(err => {
                this.mainService.updateData('prints',printObj._id,{status:PrintOutStatus.ERROR});
              })
            }).catch(err => {
              this.mainService.updateData('prints',printObj._id,{status:PrintOutStatus.ERROR});
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
    }, 360000)
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