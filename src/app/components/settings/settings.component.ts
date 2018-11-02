import { Component, OnDestroy, OnInit } from '@angular/core';
import { ElectronService } from './../../providers/electron.service';
import { SettingsService } from './../../services/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  providers: [SettingsService]
})
export class SettingsComponent implements OnInit, OnDestroy {
  storeInfo: any;
  selected: number;
  logo: string;

  constructor(private electron: ElectronService, private settingsService: SettingsService) {
    this.logo = this.electron.appRealPath + '/data/customer.png';
  }

  ngOnInit() {
    this.settingsService.RestaurantInfo.subscribe(res => {
      this.storeInfo = res.value;
    })
  }

  ngOnDestroy() {

  }
}
