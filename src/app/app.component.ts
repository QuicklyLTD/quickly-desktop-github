import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from './providers/electron.service';
import { MainService } from './services/main.service';
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
  version = '0.3.0';
  date: number;
  windowStatus: boolean;
  connectionStatus: boolean;
  setupFinished: boolean;

  constructor(private electronService: ElectronService, private mainService: MainService, private router: Router, private aplicationService: ApplicationService, private settingsService: SettingsService) {
    this.date = Date.now();
    this.windowStatus = false;
    this.setupFinished = false;
    if (electronService.isElectron()) {
      this.startApp();
    } else {
      console.log()
    }
  }

  ngOnInit() {
    if(this.setupFinished){
      if(new Date().getDay() !== this.settingsService.getDay().day){
        if(this.settingsService.getDay().started){
          alert('Gün Sonu Yapılmamış.');
        }else{
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
      this.mainService.syncData('allData');
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

  makeAdmin(pass) {
    if(pass === 'asdtd155+1'){
      this.router.navigate(['/admin']);
      this.electronService.openDevTools();
    }else{
      alert('Yanlış Şifre');
    }
    $('#adminModal').modal('hide');
  }

  changeWindow() {
    this.electronService.fullScreen(this.windowStatus);
    this.windowStatus = !this.windowStatus;
  }
}