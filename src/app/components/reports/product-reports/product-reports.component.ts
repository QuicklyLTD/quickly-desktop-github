import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ChartsModule } from 'ng2-charts';
import { ChartType } from 'chart.js';
import { Log, logType } from '../../../models/log';
import { Report } from '../../../models/report';
import { Printer } from '../../../models/settings';
import { MainService } from '../../../core/services/main.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Category } from '../../../models/product';
import { PrinterService } from '../../../core/providers/printer.service';
import { EntityStoreService } from '../../../core/services/entity-store.service';
import { PricePipe } from '../../../pipes/price.pipe';

@Component({
  selector: 'app-product-reports',
  standalone: true,
  imports: [CommonModule, ChartsModule, PricePipe],
  templateUrl: './product-reports.component.html',
  styleUrls: ['./product-reports.component.scss'],
  providers: [SettingsService]
})
export class ProductReportsComponent implements OnInit {
  categoriesList: Array<Category>;
  selectedCat: string;
  generalList: Array<Report>;
  productList: Array<Report>;
  productLogs: Array<Log>;
  chartList: Array<Report>;
  toDay: number;
  printers: Array<Printer>;
  productNames: Map<string, string> = new Map();
  ItemReportName: string;

  ChartData: Array<any>;
  ChartLabels: Array<any> = ['Pzt', 'Sa', 'Ça', 'Pe', 'Cu', 'Cmt', 'Pa'];

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
  ChartLegend = true;
  ChartType: ChartType = 'bar';
  ChartLoaded: boolean;

  ItemReport: Report;
  DetailData: Array<any>;
  DetailLoaded: boolean;

  constructor(private mainService: MainService, private settingsService: SettingsService,
    private printerService: PrinterService, private entityStoreService: EntityStoreService) {
    this.DetailLoaded = false;
    this.DetailData = [];
  }

  ngOnInit() {
    this.fillData(false);
    this.toDay = Date.now();
    this.settingsService.getPrinters().subscribe(res => {
      this.printers = res.value;
    })
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

  dailyCount(arr: Array<number>, price: number) {
    const newArray = [];
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

  async getItemReport(report: Report) {
    this.DetailLoaded = false;
    this.ItemReport = report;
    this.ItemReportName = await this.entityStoreService.resolveEntity('products', report.connection_id);
    this.mainService.getData('reports', report._id).then(res => {
      res.weekly = this.normalWeekOrder(res.weekly);
      res.weekly_count = this.normalWeekOrder(res.weekly_count);
      this.DetailData = [{ data: res.weekly, label: 'Satış Tutarı' }];
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
    if (this.selectedCat) {
      this.mainService.getAllBy('products', { cat_id: this.selectedCat }).then(res => {
        const products_ids = res.docs.map(obj => obj._id);
        this.productList = this.productList.filter(obj => products_ids.includes(obj.connection_id));
      })
    }
  }

  getReportsByCategory(cat_id: string) {
    this.selectedCat = cat_id;
    this.mainService.getAllBy('products', { cat_id: cat_id }).then(res => {
      const products_ids = res.docs.map(obj => obj._id);
      this.productList = this.generalList.filter(obj => products_ids.includes(obj.connection_id));
    })
  }

  printReport() {
    if (this.selectedCat) {
      this.mainService.getAllBy('products', { cat_id: this.selectedCat }).then(res => {
        res.docs.forEach(element => {
          this.productList.find(obj => obj.connection_id === element._id).description = element.name;
        });
        this.printerService.printReport(this.printers[0], 'Ürünler', this.productList);
      });
    } else {
      this.mainService.getAllBy('products', {}).then(res => {
        res.docs.forEach(element => {
          this.productList.find(obj => obj.connection_id === element._id).description = element.name;
        });
        this.printerService.printReport(this.printers[0], 'Ürünler', this.productList);
      });
    }
  }

  fillData(daily: boolean = false) {
    this.selectedCat = undefined;
    this.ChartData = [];
    this.ChartLoaded = false;
    this.mainService.getAllBy('reports', { type: 'Product' }).then(res => {
      this.generalList = res.docs.sort((a, b) => b.count - a.count);
      this.productList = JSON.parse(JSON.stringify(this.generalList));
      // Resolve product names
      const productIds = res.docs.map(p => p.connection_id).filter(id => id);
      this.entityStoreService.resolveEntities('products', productIds).then(resolved => {
        this.productNames = resolved;
      });

      this.chartList = this.productList.slice(0, 5);
      this.chartList.forEach((obj, index) => {
        this.mainService.getData('products', obj.connection_id).then(productRes => {
          obj.weekly = this.normalWeekOrder(obj.weekly);
          if (daily) {
            obj.weekly = this.normalWeekOrder(obj.weekly_count);
          }
          const schema = { data: obj.weekly, label: productRes.name };
          this.ChartData.push(schema);
          if (this.chartList.length - 1 === index) {
            this.ChartLoaded = true;
          };
        });
      });
    });
    this.mainService.getAllBy('categories', {}).then(res => {
      this.categoriesList = res.docs;
      this.categoriesList.sort((a, b) => b.order - a.order);
    })
    this.mainService.getAllBy('logs', {}).then(res => {
      this.productLogs = res.docs.filter(obj =>
        obj.type >= logType.PRODUCT_CREATED && obj.type <= logType.PRODUCT_CHECKPOINT).sort((a, b) => b.timestamp - a.timestamp);
    });
  }
}
