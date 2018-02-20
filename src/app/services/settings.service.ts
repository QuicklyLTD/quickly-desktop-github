import { Injectable } from '@angular/core';
import { MainService } from './main.service';
import { Settings } from '../mocks/settings.mock';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class SettingsService {
  Settings: Array<Settings>;
  AppInformation: Subject<Settings>;
  AppSettings: Subject<Settings>;
  AuthInfo: Subject<Settings>;
  ActivationStatus: Subject<Settings>;
  RestaurantInfo: Subject<Settings>;
  Printers: Subject<Settings>;

  constructor(private mainService: MainService) {
    this.AppInformation = new Subject<Settings>();
    this.AppSettings = new Subject<Settings>();
    this.AuthInfo = new Subject<Settings>();
    this.ActivationStatus = new Subject<Settings>();
    this.RestaurantInfo = new Subject<Settings>();
    this.Printers = new Subject<Settings>();

    this.mainService.getAllBy('settings', {}).then((res) => {
      this.Settings = res.docs;
      this.AppSettings.next(this.Settings.filter((setting) => setting.key == 'AppSettings')[0]);
      this.AuthInfo.next(this.Settings.filter((setting) => setting.key == 'AuthInfo')[0]);
      this.ActivationStatus.next(this.Settings.filter((setting) => setting.key == 'ActivationStatus')[0]);
      this.AppInformation.next(this.Settings.filter((setting) => setting.key == 'AppInformation')[0]);
      this.RestaurantInfo.next(this.Settings.filter((setting) => setting.key == 'RestaurantInfo')[0]);
      this.Printers.next(this.Settings.filter((setting) => setting.key == 'Printers')[0]);
    });
  }

  getDay() {
    return JSON.parse(localStorage.getItem('DayStatus'));
  }
  getWeekStatus() {
    return JSON.parse(localStorage.getItem('WeekStatus')).started;
  }

  getUser(value) {
    let result;
    switch (value) {
      case 'id':
        result = localStorage.getItem('userID');
        break;
      case 'auth':
        result = localStorage.getItem('userAuth');
        break;
      case 'type':
        result = localStorage.getItem('userType');
        break;
      case 'name':
        result = localStorage.getItem('userName');
        break;
      default:
        break;
    }
    return result;
  }

  setAppSettings(Key: string, SettingsData) {
    let AppSettings = new Settings(Key, SettingsData, 'Uygulama Ayarları', Date.now());
    this.mainService.getAllBy('settings', { key: Key }).then(res => {
      this.mainService.updateData('settings', res.docs[0]._id, AppSettings);
    });
  }

  addPrinter(printerData) {
    this.mainService.getAllBy('settings', { key: 'Printers' }).then(res => {
      if (res.docs.length > 0) {
        res.docs[0].value.push(printerData);
        this.mainService.updateData('settings', res.docs[0]._id, res.docs[0]);
        this.Printers.next(res.docs[0]);
      } else {
        let printerSettings = new Settings('Printers', [printerData], 'Yazıcılar', Date.now());
        this.mainService.addData('settings', printerSettings);
        this.Printers.next(printerSettings);
      }
    });
  }

  updatePrinter(newPrinter, oldPrinter) {
    this.mainService.getAllBy('settings', { key: 'Printers' }).then(res => {
      res.docs[0].value = res.docs[0].value.filter(obj => obj.name !== oldPrinter.name);
      res.docs[0].value.push(newPrinter);
      this.mainService.updateData('settings', res.docs[0]._id, res.docs[0]);
      this.Printers.next(res.docs[0]);
    });
  }

  removePrinter(printer) {
    this.mainService.getAllBy('settings', { key: 'Printers' }).then(res => {
      res.docs[0].value = res.docs[0].value.filter(obj => obj.name !== printer.name);
      this.mainService.updateData('settings', res.docs[0]._id, res.docs[0]);
      this.Printers.next(res.docs[0]);
    });
  }

  getPrinters() {
    return this.Printers.asObservable();
  }

  getAppSettings() {
    return new Promise((resolve) => {
      this.mainService.getAllBy('settings', {}).then((res) => {
        resolve(res.docs.filter((setting) => setting.key == 'AppSettings')[0].value);
      });
    });
  }
}