import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from './providers/electron.service';
import { MainService } from './services/main.service';
import { SettingsService } from './services/settings.service';
import { ApplicationService } from './services/application.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [SettingsService]
})

export class AppComponent implements OnInit {
  title = 'Quickly';
  description = 'Quickly';
  version = '1.2.0';
  date: number;
  windowStatus: boolean;
  connectionStatus: boolean;
  setupFinished: boolean;

  constructor(private electronService: ElectronService, private mainService: MainService, private router: Router, private aplicationService: ApplicationService, private settingsService: SettingsService) {
    this.date = Date.now();
    this.windowStatus = false;
    this.setupFinished = false;
  }

  ngOnInit() {
    if (this.electronService.isElectron()) {
      this.startApp();
    }
    setInterval(() => {
      this.date = Date.now();
      this.connectionStatus = this.aplicationService.connectionStatus();
    }, 5000);
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
                  alert('Gün Sonu Yapılmamış.');
                } else {
                  alert('Gün Başlangıcı Yapmalısınız.');
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
                  this.mainService.LocalDB['endday'].changes({ since: 'now', live: true }).on('change', change => {
                    this.router.navigate(['/endoftheday_no_guard']).then(res => {
                      $('#endDayModal').modal('show');
                      setTimeout(() => {
                        this.electronService.shellCommand('shutdown now');
                      }, 15000)
                    });
                  });
                }
              }
              this.mainService.syncToRemote();
            });
          } else {
            console.log('Aktif Değil');
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
      localStorage.removeItem('userType');
      localStorage.removeItem('userName');
      this.electronService.exitProgram();
    }
  }

  changeWindow() {
    this.electronService.fullScreen(this.windowStatus);
    this.windowStatus = !this.windowStatus;
  }
}