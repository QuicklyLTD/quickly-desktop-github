import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../core/services/electron/electron.service';
import { MainService } from '../../core/services/main.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-activation',
  standalone: true,
  imports: [CommonModule],
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

  ngOnInit() { }

}
