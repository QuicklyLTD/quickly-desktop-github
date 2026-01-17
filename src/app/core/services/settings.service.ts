import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Settings } from '../../models/settings';
import { MainService } from '../services/main.service';

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

      const appSettings = this.Settings.find((setting) => setting.key === 'AppSettings');
      if (appSettings) {
        this.AppSettings.next(appSettings);
      }

      const authInfo = this.Settings.find((setting) => setting.key === 'AuthInfo');
      if (authInfo) {
        this.AuthInfo.next(authInfo);
      }

      const activationStatus = this.Settings.find((setting) => setting.key === 'ActivationStatus');
      if (activationStatus) {
        this.ActivationStatus.next(activationStatus);
      }

      const appInfo = this.Settings.find((setting) => setting.key === 'AppInformation');
      if (appInfo) {
        this.AppInformation.next(appInfo);
      }

      const restaurantInfo = this.Settings.find((setting) => setting.key === 'RestaurantInfo');
      if (restaurantInfo) {
        this.RestaurantInfo.next(restaurantInfo);
      }

      const printers = this.Settings.find((setting) => setting.key === 'Printers');
      if (printers) {
        this.Printers.next(printers);
      }

      const dateSettings = this.Settings.find((setting) => setting.key === 'DateSettings');
      if (dateSettings) {
        this.DateSettings.next(dateSettings);
      }

      const appType = localStorage.getItem('AppType');
      switch (appType) {
        case 'Primary':
          const primaryServer = this.Settings.find(
            (setting) => setting.key === 'ServerSettings' && setting.value && setting.value.type === 0
          );
          if (primaryServer) {
            this.ServerSettings.next(primaryServer);
          }
          break;
        case 'Secondary':
          const secondaryServer = this.Settings.find(
            (setting) => setting.key === 'ServerSettings' && setting.value && setting.value.type === 1
          );
          if (secondaryServer) {
            this.ServerSettings.next(secondaryServer);
          }
          break;
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
      if (res && res.value) {
        localStorage.setItem('DayStatus', JSON.stringify(res.value));
      }
    });
  }

  setAppSettings(Key: string, SettingsData) {
    const AppSettings = new Settings(Key, SettingsData, Key, Date.now());
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
        const printerSettings = new Settings('Printers', [printerData], 'Yazıcılar', Date.now());
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
