import { Component, OnInit } from '@angular/core';
import { Log, logType } from '../../../mocks/log';
import { Report } from '../../../mocks/report';
import { MainService } from '../../../services/main.service';
@Component({
  selector: 'app-user-reports',
  templateUrl: './user-reports.component.html',
  styleUrls: ['./user-reports.component.scss']
})
export class UserReportsComponent implements OnInit {
  usersList: Array<Report>;
  userLogs: Array<Log>;
  generalList: Array<Report>;


  ChartOptions: any = {
    responsive: false,
    legend: {
      labels: {
        fontColor: 'rgb(255, 255, 255)',
        fontStyle: 'bolder'
      }
    },
    tooltips: {
      callbacks: {
        label: function (value) {
          return ' ' + Number(value.yLabel).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ₺';
        }
      }
    },
    elements: {
      line: {
        tension: 0.5,
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
          fontColor: 'rgba(255,255,255)',
          callback: function (value, index, values) {
            return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ₺';
          }

        },
        gridLines: {
          color: 'rgba(255,255,255)',
          lineWidth: 0.4
        }
      }]
    },
  };
  ChartData: Array<any>;
  ChartLabels: Array<any> = ['Pzt', 'Sa', 'Ça', 'Pe', 'Cu', 'Cmt', 'Pa'];
  ChartLegend: boolean = true;
  ChartType: string = 'bar';
  ChartLoaded: boolean;

  ItemReport: Report;
  DetailData: Array<any>;
  DetailLoaded: boolean;

  constructor(private mainService: MainService) {
    this.DetailLoaded = false;
    this.DetailData = [];
    this.fillData(false);
  }

  ngOnInit() {
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

  changeFilter(value: string) {
    switch (value) {
      case 'Sipariş Adedi':
        this.fillData(true);
        break;
      case 'Satış Tutarı':
        this.fillData(false);
        break;
      default:
        break;
    }
  }

  getItemReport(report: Report) {
    this.DetailLoaded = false;
    this.ItemReport = report;
    let detailLabel;
    this.mainService.getData('reports', report._id).then(res => {
      res.weekly = this.normalWeekOrder(res.weekly);
      res.weekly_count = this.normalWeekOrder(res.weekly_count);
      this.DetailData = [{ data: res.weekly, label: 'Sipariş Tutarı' }, { data: res.weekly_count, label: 'Sipariş Adedi' }];
      this.DetailLoaded = true;
      $('#reportDetail').modal('show');
    });
  }

  changeListFilter(value: string) {
    let newArray: Array<Report> = [];
    switch (value) {
      case 'Genel':
        newArray = JSON.parse(JSON.stringify(this.generalList));
        break;
      case 'Günlük':
        newArray = JSON.parse(JSON.stringify(this.generalList));
        newArray.filter((obj) => {
          obj.count = obj.weekly_count[new Date().getDay()];
          obj.amount = obj.weekly[new Date().getDay()];
        });
        break;
      case 'Haftalık':
        newArray = JSON.parse(JSON.stringify(this.generalList));
        newArray.filter((obj) => {
          obj.count = obj.weekly_count.reduce((a, b) => a + b);
          obj.amount = obj.weekly.reduce((a, b) => a + b);
        });
        break;
      default:
        break;
    }
    newArray = newArray.sort((a, b) => b.count - a.count);
    this.usersList = newArray;
  }
  
  getLogs() {
    this.mainService.getAllBy('logs', {}).then(res => {
      this.userLogs = res.docs.filter(obj => obj.type >= logType.USER_CREATED && obj.type <= logType.USER_CHECKPOINT || obj.type == logType.ORDER_CREATED).sort((a, b) => b.timestamp - a.timestamp);
    });
  }

  fillData(daily) {
    this.mainService.getAllBy('reports', { type: 'User' }).then(res => {
      this.usersList = res.docs;
    });
    this.ChartData = [];
    this.ChartLoaded = false;
    this.mainService.getAllBy('reports', { type: 'User' }).then(res => {
      this.generalList = res.docs.sort((a, b) => b.count - a.count);
      this.usersList = JSON.parse(JSON.stringify(this.generalList));
      let chartTable = this.usersList.slice(0, 5);
      chartTable.forEach((obj, index) => {
        this.mainService.getData('users', obj.connection_id).then(res => {
          obj.weekly = this.normalWeekOrder(obj.weekly);
          obj.weekly_count = this.normalWeekOrder(obj.weekly_count);
          let schema;
          if (daily) {
            schema = { data: obj.weekly_count, label: res.name };
          } else {
            schema = { data: obj.weekly, label: res.name };
          }
          this.ChartData.push(schema);
          if (chartTable.length - 1 == index) {
            this.ChartLoaded = true;
          };
        });
      });
    });
  }
}
