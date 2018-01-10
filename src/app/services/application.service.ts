import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SettingsService } from './settings.service';
import { MessageService } from '../providers/message.service';

@Injectable()
export class ApplicationService {
  appLockTime: number;
  appDayStatus: object;
  appWeekStatus: object;
  appConnectionStatus: boolean;
  appActivationStatus: boolean;
  countDown: any;
  timer: number;
  constructor(private settings: SettingsService, private messageService: MessageService, private router: Router) {
    this.settings.AppSettings.subscribe((data) => {
      if(data){
        this.appLockTime = data.value.timeout;
        this.screenLock('start');
      }
    });
  }

  isActive() {
    this.settings.ActivationStatus.subscribe(res => {
      if (res.value) {
        ///// İşletme Aktif İse
        console.log('İşletme Hesabı Aktif.');
      } else {
        ///// İşletme Aktif Değil İse
        console.warn('İşletme Hesabı Aktif Değil.');
        this.router.navigate(['/setup']);
      }
    });
  }

  connectionStatus() {
    if (navigator.onLine) {
      return true;
    } else {
      return false
    }
  }

  screenLock(command: string) {
    switch (command) {
      case 'start':
        this.timer = this.appLockTime;
        this.countDown = setInterval(() => {
          if (this.timer == 0) {
            if (this.router.url === '/' || this.router.url === '/settings' || this.router.url === '/reports' || this.router.url === '/setup' || this.router.url === '/admin') {
              this.timer = this.appLockTime;
            } else {
              this.timer = this.appLockTime;
              $('*').modal('hide');
              this.router.navigate(['']);
              this.messageService.sendMessage('Zaman aşımına uğrandı.');
            }
          }
          this.timer--;
        }, 1000);
        break;
      case 'reset':
        this.timer = this.appLockTime;
        break;
      case 'stop':
        clearInterval(this.countDown);
        break;
      default:
        break;
    }
  }
}