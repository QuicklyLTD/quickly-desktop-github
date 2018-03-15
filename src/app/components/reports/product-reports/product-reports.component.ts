import { Component, OnInit } from '@angular/core';
import { MainService } from '../../../services/main.service';
import { Report } from '../../../mocks/report.mock';
import { Log, logType } from '../../../mocks/log.mock';

@Component({
  selector: 'app-product-reports',
  templateUrl: './product-reports.component.html',
  styleUrls: ['./product-reports.component.scss']
})
export class ProductReportsComponent implements OnInit {
  generalList: Array<Report>;
  productList: Array<Report>;
  productLogs: Array<Log>;
  chartList: Array<Report>;
  toDay: number;

  ChartData: Array<any>;
  ChartLabels: Array<any> = ['Pzt', 'Sa', 'Ça', 'Pe', 'Cu', 'Cmt', 'Pa'];
  ChartOptions: any = { responsive: false };
  ChartLegend: boolean = true;
  ChartType: string = 'bar';
  ChartLoaded: boolean;

  ItemReport: Report;
  DetailData: Array<any>;
  DetailLoaded: boolean;

  constructor(private mainService: MainService) {
    this.DetailLoaded = false;
    this.DetailData = [];
  }

  ngOnInit() {
    this.fillData(false);
    this.toDay = Date.now();
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


  dailyCount(arr: Array<number>, price: number) {
    let newArray = [];
    for (let item of arr) {
      item = item / price;
      newArray.push(item);
    }
    return newArray;
  }

  changeFilter(value: string) {
    switch (value) {
      case 'Adet':
        this.fillData(true);
        break;
      case 'Tutar':
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
      this.DetailData = [{ data: res.weekly, label: 'Satış Tutarı' }, { data: res.weekly_count, label: 'Satış Adedi' }];
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
    this.productList = newArray;
  }

  fillData(daily: boolean) {
    this.ChartData = [];
    this.ChartLoaded = false;
    this.mainService.getAllBy('reports', { type: 'Product' }).then(res => {
      this.generalList = res.docs.sort((a, b) => b.count - a.count);
      this.productList = JSON.parse(JSON.stringify(this.generalList));
      this.chartList = this.productList.slice(0, 5);
      this.chartList.forEach((obj, index) => {
        this.mainService.getData('products', obj.connection_id).then(res => {
          obj.weekly = this.normalWeekOrder(obj.weekly);
          if (daily) {
            obj.weekly = this.normalWeekOrder(obj.weekly_count);
          }
          let schema = { data: obj.weekly, label: res.name };
          this.ChartData.push(schema);
          if (this.chartList.length - 1 == index) {
            this.ChartLoaded = true;
          };
        });
      });
    });
    this.mainService.getAllBy('logs', {}).then(res => {
      this.productLogs = res.docs.filter(obj => obj.type >= logType.PRODUCT_CREATED && obj.type <= logType.PRODUCT_CHECKPOINT).sort((a, b) => b.timestamp - a.timestamp);
    });
  }
}