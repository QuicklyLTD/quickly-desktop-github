import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from './providers/electron.service';
import { MessageService } from './providers/message.service';
import { ApplicationService } from './services/application.service';
import { AuthService } from './services/auth.service';
import { MainService } from './services/main.service';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [SettingsService]
})

export class AppComponent implements OnInit {
  title = 'Quickly';
  description = 'Quickly';
  version = '1.2.9';
  date: number;
  windowStatus: boolean;
  connectionStatus: boolean;
  setupFinished: boolean;

  constructor(private electronService: ElectronService, private mainService: MainService, private router: Router, private aplicationService: ApplicationService, private settingsService: SettingsService, private messageService: MessageService, private authService: AuthService) {
    this.date = Date.now();
    this.windowStatus = false;
    this.setupFinished = false;
  }

  ngOnInit() {
    if (this.electronService.isElectron()) {
      this.settingsService.setLocalStorage();
      // this.initAppData();
      this.startApp();
    }
    setInterval(() => {
      this.date = Date.now();
      this.connectionStatus = this.aplicationService.connectionStatus();
    }, 5000);
  }

  initAppData() {
    let db_names = Object.keys(this.mainService.LocalDB);
    this.electronService.fileSystem.readFile(this.electronService.appRealPath + '/data/all.txt', (err, data) => {
      if (!err) {
        const realData = JSON.parse(data.toString('utf-8'));
        db_names.forEach(element => {
          let db_data = realData.filter(obj => obj.db_name == element);
          db_data.map(obj => {
            delete obj['db_name'];
            delete obj['db_seq'];
          })
          if (db_data.length > 0) {
            this.mainService.putAll(element, db_data);
            console.log(element, db_data);
          }
        });
        this.startApp();
      } else {
        console.log('Dosya Yok')
      }
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
              let configrations = res.value;
              if (configrations.status == 1) {
                if (configrations.type == 0) {
                  this.electronService.ipcRenderer.send('appServer', configrations.key, configrations.ip_port);
                  this.mainService.syncToServer();
                } else if (configrations.type == 1) {
                  this.mainService.LocalDB['endday'].changes({ since: 'now', live: true }).on('change', () => {
                    this.router.navigate(['/endoftheday_no_guard']).then(() => {
                      $('#endDayModal').modal('show');
                      this.mainService.syncToRemote().cancel();
                      this.mainService.replicateDB(configrations).on('complete', () => {
                        $('#endDayModal').modal('hide');
                        this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program 5sn içinde kapatılacak.', 'success');
                        setTimeout(() => {
                          this.electronService.shellCommand('shutdown now');
                        }, 10000);
                      });
                    });
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