import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ElectronService } from '../../core/services/electron/electron.service';
import { SettingsService } from '../../core/services/settings.service';
import { ApplicationSettingsComponent } from './application-settings/application-settings.component';
import { CustomerSettingsComponent } from './customer-settings/customer-settings.component';
import { MenuSettingsComponent } from './menu-settings/menu-settings.component';
import { RecipeSettingsComponent } from './recipe-settings/recipe-settings.component';
import { RestaurantSettingsComponent } from './restaurant-settings/restaurant-settings.component';
import { StockSettingsComponent } from './stock-settings/stock-settings.component';
import { UserSettingsComponent } from './user-settings/user-settings.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ApplicationSettingsComponent,
    CustomerSettingsComponent,
    MenuSettingsComponent,
    RecipeSettingsComponent,
    RestaurantSettingsComponent,
    StockSettingsComponent,
    UserSettingsComponent
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  providers: [SettingsService]
})
export class SettingsComponent implements OnInit, OnDestroy {
  storeInfo: any;
  selected: number;
  logo: string;

  constructor(private electron: ElectronService, private settingsService: SettingsService) {
    this.logo = this.electron.isElectron ? this.electron.appRealPath + '/data/customer.png' : '';
  }

  ngOnInit() {
    this.settingsService.RestaurantInfo.subscribe(res => {
      if (res && res.value) {
        this.storeInfo = res.value;
      }
    });
  }

  ngOnDestroy() {

  }
}
