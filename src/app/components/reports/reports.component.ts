import { Component, OnInit } from '@angular/core';
import { MainService } from '../../services/main.service';
import { SettingsService } from '../../services/settings.service';
import { ClosedCheck } from '../../mocks/check.mock';
import { Report, Activity } from '../../mocks/report.mock';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  providers: [SettingsService]
})
export class ReportsComponent implements OnInit {
  selected: number;
  closedTotal: number;
  freeTotal: number;
  canceledTotal: number;
  activeTotal: number;
  generalTotal: number;
  sellingActivity: Activity;
  day: number;

  //////////////////////
  ChartOptions: any = { responsive: false };
  ChartLegend: boolean = true;
  ChartType: string = 'bar';
  ChartData: Array<any>;
  ChartColors: Array<any>;
  ChartLoaded: boolean;
  ChartLabels: Array<string>;

  activityData: Array<object>;
  activityLabels: Array<string>;
  activityLegend: boolean = true;

  pieData: Array<any>;
  pieLabels: Array<any>;
  pieColors: Array<any>;
  ///////////////////////


  constructor(private mainService: MainService, private settingsService: SettingsService) {
    this.settingsService.DateSettings.subscribe(res => {
      this.day = res.value.day;
    })
    this.closedTotal = 0;
    this.activeTotal = 0;
    this.generalTotal = 0;
    this.freeTotal = 0;
    this.canceledTotal = 0;
    this.selected = undefined;
    this.ChartLabels = ['Pzt', 'Sa', 'Ça', 'Pe', 'Cu', 'Cmt', 'Pa'];
    this.ChartColors = [
      { backgroundColor: '#5cb85c' },
      { backgroundColor: '#5bc0de' },
      { backgroundColor: '#f0ad4e' },
      { backgroundColor: '#d9534f' },
    ];
    this.pieColors = [{ backgroundColor: ['#5cb85c', '#5bc0de', '#f0ad4e', '#d9534f'] }];
  }

  ngOnInit() {
    this.fillData();
  }

  normalWeekOrder(array: Array<any>) {
    var arrayLength = array.length
    for (var i = 0; i < arrayLength - 1; i++) {
      var temp = array[i];
      array[i] = array[i + 1];
      array[i + 1] = temp;
    }
    return array;
  }


  fillData() {
    this.ChartData = [];
    this.pieData = [];
    this.pieLabels = [];
    this.ChartLoaded = false;
    this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
      this.sellingActivity = res.docs[0];
      this.activityData = [{ data: this.sellingActivity.activity, label: 'Gelir Endeksi' }, { data: this.sellingActivity.activity_count, label: 'Doluluk Oranı ( % )' }];
      this.activityLabels = this.sellingActivity.activity_time;
    });
    this.mainService.getAllBy('checks', {}).then(res => {
      const activeChecks = res.docs;
      if (res.docs.length > 0) {
        this.activeTotal = activeChecks.map(obj => obj.total_price + obj.discount).reduce((a, b) => a + b);
      }
    });

    this.mainService.getAllBy('reports', { type: 'Store' }).then(res => {
      let report: Array<Report> = res.docs;
      report = report.filter(obj => obj.connection_id !== 'Genel').sort((a, b) => b.connection_id.localeCompare(a.connection_id));
      report.forEach((element, index) => {
        if (element.connection_id !== 'İkram') {
          this.closedTotal += element.weekly[this.day];
        } else {
          this.freeTotal += element.weekly[this.day];

        }
        this.pieData.push(element.weekly[this.day]);
        this.pieLabels.push(element.connection_id);
        element.weekly = this.normalWeekOrder(element.weekly);
        let chartObj = { data: element.weekly, label: element.connection_id };
        this.ChartData.push(chartObj);
        if (report.length - 1 == index) {
          this.ChartLoaded = true;
          this.generalTotal = this.closedTotal + this.activeTotal;
        };
      });
    });

    this.mainService.getAllBy('closed_checks', { type: 3 }).then(res => {
      if(res.docs.length > 0){
        this.canceledTotal = res.docs.map((obj) => obj.total_price).reduce((a, b) => a + b);
      }
    });
  }
}