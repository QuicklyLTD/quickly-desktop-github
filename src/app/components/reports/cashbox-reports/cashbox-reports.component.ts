import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cashbox-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cashbox-reports.component.html',
  styleUrls: ['./cashbox-reports.component.scss']
})
export class CashboxReportsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
