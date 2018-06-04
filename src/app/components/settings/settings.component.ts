import { Component, OnDestroy, OnInit } from '@angular/core';
import { ElectronService } from './../../providers/electron.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  selected: number;
  logo: string;

  constructor(private electron: ElectronService) {
    this.logo = this.electron.appRealPath + '/data/customer.png';
  }

  ngOnInit() { }

  ngOnDestroy() {

  }
}
