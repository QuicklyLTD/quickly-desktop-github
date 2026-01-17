import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-notifications-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-reports.component.html',
  styleUrls: ['./notifications-reports.component.scss']
})
export class NotificationsReportsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
