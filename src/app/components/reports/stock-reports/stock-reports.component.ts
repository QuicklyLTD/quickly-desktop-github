import { Component, OnInit } from '@angular/core';
import { Log, logType } from '../../../mocks/log';
import { Stock, StockCategory } from '../../../mocks/stocks';
import { MainService } from '../../../services/main.service';

@Component({
  selector: 'app-stock-reports',
  templateUrl: './stock-reports.component.html',
  styleUrls: ['./stock-reports.component.scss']
})
export class StockReportsComponent implements OnInit {
  stocksView: Array<Stock>;
  allStocks: Array<Stock>;
  allCats: Array<StockCategory>;
  stockLogs: Array<Log>;
  selectedCat: string;

  constructor(private mainService: MainService) { }

  ngOnInit() {
    this.fillData();
  }

  getStocksByCategory(cat_id) {
    this.stocksView = this.allStocks.filter(obj => obj.sub_category == cat_id);
    this.selectedCat = cat_id;
  }

  fillData() {
    this.selectedCat = undefined;
    this.mainService.getAllBy('stocks', {}).then(result => {
      this.allStocks = result.docs;
      this.allStocks = this.allStocks.sort((b, a) => (b.left_total / (b.total * b.first_quantity)) * 100 - (a.left_total / (a.total * a.first_quantity)) * 100);
      this.stocksView = this.allStocks.sort((b, a) => (b.left_total / (b.total * b.first_quantity)) * 100 - (a.left_total / (a.total * a.first_quantity)) * 100);
    });
    this.mainService.getAllBy('stocks_cat', {}).then(result => {
      this.allCats = result.docs;
    });
    this.mainService.getAllBy('logs', {}).then(res => {
      this.stockLogs = res.docs.filter(obj => obj.type >= logType.STOCK_CREATED && obj.type <= logType.STOCK_CHECKPOINT).sort((a, b) => b.timestamp - a.timestamp);
    });
  }
}
