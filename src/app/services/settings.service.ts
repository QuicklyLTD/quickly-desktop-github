import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Settings } from '../mocks/settings';
import { MainService } from './main.service';

@Injectable()
export class SettingsService {
  Settings: Array<Settings>;
  AppInformation: Subject<Settings>;
  AppSettings: Subject<Settings>;
  AuthInfo: Subject<Settings>;
  ActivationStatus: Subject<Settings>;
  RestaurantInfo: Subject<Settings>;
  Printers: Subject<Settings>;
  ServerSettings: Subject<Settings>;
  DateSettings: Subject<Settings>;

  constructor(private mainService: MainService) {
    this.AppInformation = new Subject<Settings>();
    this.AppSettings = new Subject<Settings>();
    this.AuthInfo = new Subject<Settings>();
    this.ActivationStatus = new Subject<Settings>();
    this.RestaurantInfo = new Subject<Settings>();
    this.Printers = new Subject<Settings>();
    this.ServerSettings = new Subject<Settings>();
    this.DateSettings = new Subject<Settings>();

    this.mainService.getAllBy('settings', {}).then((res) => {
      this.Settings = res.docs;

      this.AppSettings.next(this.Settings.find((setting) => setting.key == 'AppSettings'));
      this.AuthInfo.next(this.Settings.find((setting) => setting.key == 'AuthInfo'));
      this.ActivationStatus.next(this.Settings.find((setting) => setting.key == 'ActivationStatus'));
      this.AppInformation.next(this.Settings.find((setting) => setting.key == 'AppInformation'));
      this.RestaurantInfo.next(this.Settings.find((setting) => setting.key == 'RestaurantInfo'));
      this.Printers.next(this.Settings.find((setting) => setting.key == 'Printers'));
      this.DateSettings.next(this.Settings.find((setting) => setting.key == 'DateSettings'));

      let appType = localStorage.getItem('AppType');
      switch (appType) {
        case 'Primary':
          this.ServerSettings.next(this.Settings.find((setting) => setting.key == 'ServerSettings' && setting.value.type == 0));
          break;
        case 'Secondary':
          this.ServerSettings.next(this.Settings.find((setting) => setting.key == 'ServerSettings' && setting.value.type == 1));
        default:
          break;
      }
    });
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

  setLocalStorage() {
    this.DateSettings.subscribe(res => {
      if (res) {
        localStorage.setItem('DayStatus', JSON.stringify(res.value));
      }
    });
  }

  setAppSettings(Key: string, SettingsData) {
    let AppSettings = new Settings(Key, SettingsData, Key, Date.now());
    return this.mainService.getAllBy('settings', { key: Key }).then(res => {
      return this.mainService.updateData('settings', res.docs[0]._id, AppSettings);
    });
  }

  getPrinters() {
    return this.Printers.asObservable();
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

  getDate() {
    this.DateSettings.asObservable();
  }

  getActivationStatus() {
    return this.ActivationStatus.asObservable();
  }

  getAppSettings() {
    return this.AppSettings.asObservable();
  }
}