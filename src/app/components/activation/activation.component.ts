import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../../services/settings.service';
import { MainService } from '../../services/main.service';
import { ElectronService } from '../../providers/electron.service';

@Component({
  selector: 'app-activation',
  templateUrl: './activation.component.html',
  styleUrls: ['./activation.component.scss'],
  providers: [SettingsService, MainService]
})

export class ActivationComponent implements OnInit {
  restInfo: any;

  constructor(private settingsService: SettingsService, private mainService: MainService, private electronService: ElectronService) {
    this.settingsService.RestaurantInfo.subscribe(res => {
      this.restInfo = res.value;
      this.mainService.syncToRemote();
    });
  }

  ngOnInit() {
    this.mainService.LocalDB['settings'].changes({ since: 'now', live: true }).on('change', change => {
      setTimeout(() => {
        this.electronService.relaunchProgram();
      }, 5000)
    });
  }

}
