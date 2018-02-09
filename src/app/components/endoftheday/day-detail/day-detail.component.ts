import { Component, OnInit, Input } from '@angular/core';
import { MainService } from '../../../services/main.service';
import { Report } from '../../../mocks/report.mock';
import { EndDay, BackupData } from '../../../mocks/endoftheday.mock';

@Component({
  selector: 'app-day-detail',
  templateUrl: './day-detail.component.html',
  styleUrls: ['./day-detail.component.scss']
})
export class DayDetailComponent implements OnInit {
  @Input('data') detailData: EndDay;
  pieOptions: any = { responsive: false };
  pieData: Array<any>;
  pieLabels: Array<any>;
  pieColors: Array<any>;
  constructor(private mainService: MainService) {
  }

  ngOnInit() {
    this.pieColors = [];
    this.pieData = [];
    this.pieLabels = [];
    this.fillData();
  }

  fillData() {
    this.pieColors = [{ backgroundColor: ['#5cb85c', '#f0ad4e', '#5bc0de', '#d9534f'] }];
    this.pieLabels.push('Nakit', 'Kart', 'Kupon', 'İkram');
    this.pieData.push(this.detailData.cash_total, this.detailData.card_total, this.detailData.coupon_total, this.detailData.free_total);
  }

}
