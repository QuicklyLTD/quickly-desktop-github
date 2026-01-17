import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Log, logType } from '../../../models/log';
import { Report } from '../../../models/report';
import { MainService } from '../../../core/services/main.service';
import { EntityStoreService } from '../../../core/services/entity-store.service';
import { ChartsModule } from 'ng2-charts';
import { ChartType } from 'chart.js';

@Component({
  selector: 'app-user-reports',
  standalone: true,
  imports: [CommonModule, ChartsModule],
  templateUrl: './user-reports.component.html',
  styleUrls: ['./user-reports.component.scss']
})
export class UserReportsComponent implements OnInit {
  usersList: Array<Report>;
  userLogs: Array<Log>;
  generalList: Array<Report>;
  userNames: Map<string, string> = new Map();
  ItemReportName: string;


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
  ChartLegend = true;
  ChartType: ChartType = 'bar';
  ChartLoaded: boolean;

  ItemReport: Report;
  DetailData: Array<any>;
  DetailLoaded: boolean;

  constructor(private mainService: MainService, private entityStoreService: EntityStoreService) {
    this.DetailLoaded = false;
    this.DetailData = [];
    this.fillData(false);
  }

  ngOnInit() {
  }


  normalWeekOrder(array: Array<any>) {
    const arrayLength = array.length;
    for (let i = 0; i < arrayLength - 1; i++) {
      const temp = array[i];
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

  async getItemReport(report: Report) {
    this.DetailLoaded = false;
    this.ItemReport = report;
    this.ItemReportName = await this.entityStoreService.resolveEntity('users', report.connection_id);
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
      this.userLogs = res.docs.filter(obj =>
        obj.type >= logType.USER_CREATED && obj.type <= logType.USER_CHECKPOINT ||
        obj.type === logType.ORDER_CREATED).sort((a, b) => b.timestamp - a.timestamp);
    });
  }

  fillData(daily) {
    this.mainService.getAllBy('reports', { type: 'User' }).then(res => {
      this.usersList = res.docs;

      // Resolve user names
      const userIds = res.docs.map(u => u.connection_id).filter(id => id);
      this.entityStoreService.resolveEntities('users', userIds).then(resolved => {
        this.userNames = resolved;
      });
    });
    this.ChartData = [];
    this.ChartLoaded = false;
    this.mainService.getAllBy('reports', { type: 'User' }).then(res => {
      this.generalList = res.docs.sort((a, b) => b.count - a.count);
      this.usersList = JSON.parse(JSON.stringify(this.generalList));
      const chartTable = this.usersList.slice(0, 5);
      chartTable.forEach((obj, index) => {
        this.entityStoreService.resolveEntity('users', obj.connection_id).then(name => {
          obj.weekly = this.normalWeekOrder(obj.weekly);
          obj.weekly_count = this.normalWeekOrder(obj.weekly_count);
          let schema;
          if (daily) {
            schema = { data: obj.weekly_count, label: name };
          } else {
            schema = { data: obj.weekly, label: name };
          }
          this.ChartData.push(schema);
          if (chartTable.length - 1 === index) {
            this.ChartLoaded = true;
          };
        });
      });
    });
  }
}
