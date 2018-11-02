import { Component, OnInit } from '@angular/core';
import { Activity, Report } from '../../mocks/report.mock';
import { MainService } from '../../services/main.service';
import { SettingsService } from '../../services/settings.service';

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

  PieOptions: any;
  ChartOptions: any;
  ChartLegend: boolean = true;
  ChartType: string = 'bar';
  ChartData: Array<any>;
  ChartColors: Array<any>;
  ChartLoaded: boolean;
  ChartLabels: Array<string>;

  monthlyData: Array<object>;
  monthlyLabels: Array<string>;
  monthlyLegends: boolean = true;
  monthlyLoaded: boolean = false;

  activityData: Array<object>;
  activityLabels: Array<string>;
  activityLegend: boolean = true;

  pieData: Array<any>;
  pieLabels: Array<any>;
  pieColors: Array<any>;

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
    this.monthlyLabels = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    this.ChartLabels = ['Pzt', 'Sa', 'Ça', 'Pe', 'Cu', 'Cmt', 'Pa'];
    this.ChartOptions = {
      responsive: false,
      legend: { labels: { fontColor: 'rgb(255, 255, 255)' } },
      elements: {
        line: {
          tension: 0,
        }
      },
      scales: {
        xAxes: [{
          ticks: {
            beginAtZero: true,
            fontColor: 'rgba(255,255,255)'
          },
          gridLines: {
            color: 'rgba(255,255,255)',
            lineWidth: 0.4
          }
        }],
        yAxes: [{
          ticks: {
            fontColor: 'rgba(255,255,255)'
          },
          gridLines: {
            color: 'rgba(255,255,255)',
            lineWidth: 0.4
          }
        }]
      },
    };
    this.ChartColors = [
      { backgroundColor: '#5cb85c' },
      { backgroundColor: '#5bc0de' },
      { backgroundColor: '#f0ad4e' },
      { backgroundColor: '#d9534f' },
      { backgroundColor: '#DF691A' },
      { backgroundColor: '#FFFFFF' },
    ];
    this.pieColors = [{ backgroundColor: ['#5cb85c', '#5bc0de', '#f0ad4e', '#d9534f'] }];
    this.PieOptions = {
      legend: { labels: { fontColor: 'rgb(255, 255, 255)' } },
    }
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


  getMonthlyReport(year?: number) {
    this.monthlyLoaded = false;
    if (!year) {
      year = new Date(Date.now()).getFullYear();
    }
    let Days = [];
    let Months = [];
    this.mainService.getAllBy('endday', {}).then(res => {
      let endDayData = res.docs;
      endDayData = endDayData.filter(obj => new Date(obj.timestamp).getFullYear() == year);
      if (endDayData.length > 0) {
        endDayData.forEach((obj, index) => {
          let Schema = { cash: obj.cash_total, card: obj.card_total, coupon: obj.coupon_total, free: obj.free_total, total: obj.total_income, checks: obj.check_count, outcome: obj.outcomes, income: obj.incomes, month: new Date(obj.timestamp).getMonth(), year: new Date(obj.timestamp).getFullYear() };
          Days.push(Schema);
          if (index == endDayData.length - 1) {
            let cash = { label: 'Nakit', data: [] };
            let coupon = { label: 'Kupon', data: [] };
            let card = { label: 'Kart', data: [] };
            let free = { label: 'İkram', data: [] };
            let total = { label: 'Toplam', data: [] };
            let checks = { label: 'Hesap Adedi', data: [] };
            this.monthlyLabels.forEach((monthName, index2) => {
              let monthWillProcess = Days.filter(obj => obj.month == index2);
              if (monthWillProcess.length > 1) {
                cash.data[index2] = monthWillProcess.map(obj => obj.cash).reduce((a, b) => a + b);
                card.data[index2] = monthWillProcess.map(obj => obj.card).reduce((a, b) => a + b);
                coupon.data[index2] = monthWillProcess.map(obj => obj.coupon).reduce((a, b) => a + b);
                free.data[index2] = monthWillProcess.map(obj => obj.free).reduce((a, b) => a + b);
                total.data[index2] = monthWillProcess.map(obj => obj.total).reduce((a, b) => a + b);
                checks.data[index2] = monthWillProcess.map(obj => obj.checks).reduce((a, b) => a + b);
              } else if (monthWillProcess.length == 1) {
                cash.data[index2] = monthWillProcess[0].cash;
                card.data[index2] = monthWillProcess[0].card;
                coupon.data[index2] = monthWillProcess[0].coupon;
                free.data[index2] = monthWillProcess[0].free;
                checks.data[index2] = monthWillProcess[0].checks;
                total.data[index2] = monthWillProcess[0].total;
              } else {
                cash.data[index2] = 0;
                card.data[index2] = 0;
                coupon.data[index2] = 0;
                free.data[index2] = 0;
                checks.data[index2] = 0;
                total.data[index2] = 0;
              }
              if (index2 == this.monthlyLabels.length - 1) {
                Months.push(cash, coupon, card, free, total, checks);
                this.monthlyData = Months;
                this.monthlyLoaded = true;
              }
            });
          }
        });
      }
    })
  }


  fillData() {
    this.getMonthlyReport();
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
      if (res.docs.length > 0) {
        this.canceledTotal = res.docs.map((obj) => obj.total_price).reduce((a, b) => a + b);
      }
    });
  }
}