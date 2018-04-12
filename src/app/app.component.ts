import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from './providers/electron.service';
import { SettingsService } from './services/settings.service';
import { ApplicationService } from './services/application.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'Quickly';
  description = 'Quickly';
  version = '1.1.6';
  date: number;
  windowStatus: boolean;
  connectionStatus: boolean;
  setupFinished: boolean;

  constructor(private electronService: ElectronService, private router: Router, private aplicationService: ApplicationService, private settingsService: SettingsService) {
    this.date = Date.now();
    this.windowStatus = false;
    this.setupFinished = false;
    if (electronService.isElectron()) {
      this.startApp();
    }
  }

  ngOnInit() {
    if (this.setupFinished) {
      if (new Date().getDay() !== this.settingsService.getDay().day) {
        if (this.settingsService.getDay().started) {
          alert('Gün Sonu Yapılmamış.');
        } else {
          alert('Gün Başlangıcı Yapmalısınız.');
        }
      }
      setInterval(() => {
        this.connectionStatus = this.aplicationService.connectionStatus();
      }, 3000)
    }
  }

  startApp() {
    let activationStatus = localStorage['ActivationStatus'];
    if (activationStatus !== undefined) {
      this.setupFinished = true;
    } else {
      this.router.navigate(['/setup']);
    }
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