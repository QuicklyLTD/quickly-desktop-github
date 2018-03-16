import { Component, OnInit } from '@angular/core';
import { Stock, StockCategory } from '../../../mocks/stocks.mock';
import { MainService } from '../../../services/main.service';
import { Log, logType } from '../../../mocks/log.mock';

@Component({
  selector: 'app-stock-reports',
  templateUrl: './stock-reports.component.html',
  styleUrls: ['./stock-reports.component.scss']
})
export class StockReportsComponent implements OnInit {
  allStocks: Array<Stock>;
  allCats: Array<StockCategory>;
  stockLogs: Array<Log>;

  constructor(private mainService: MainService) { }

  ngOnInit() {
    this.fillData();
  }


  fillData() {
    this.mainService.getAllBy('stocks', {}).then(result => {
      this.allStocks = result.docs;
      this.allStocks = this.allStocks.sort((b, a) => (b.left_total / (b.total * b.first_quantity)) * 100 - (a.left_total / (a.total * a.first_quantity)) * 100);
    });
    this.mainService.getAllBy('stocks_cat', {}).then(result => {
      this.allCats = result.docs;
    });
    this.mainService.getAllBy('logs', {}).then(res => {
      this.stockLogs = res.docs.filter(obj => obj.type >= logType.STOCK_CREATED && obj.type <= logType.STOCK_CHECKPOINT).sort((a, b) => b.timestamp - a.timestamp);
    });
  }
}
