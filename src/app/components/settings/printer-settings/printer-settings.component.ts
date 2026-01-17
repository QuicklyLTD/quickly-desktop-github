import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-printer-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './printer-settings.component.html',
  styleUrls: ['./printer-settings.component.scss']
})
export class PrinterSettingsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
