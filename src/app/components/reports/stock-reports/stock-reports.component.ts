import { Component, OnInit } from '@angular/core';
import { Stock, StockCategory } from '../../../mocks/stocks.mock';
import { MainService } from '../../../services/main.service';

@Component({
  selector: 'app-stock-reports',
  templateUrl: './stock-reports.component.html',
  styleUrls: ['./stock-reports.component.scss']
})
export class StockReportsComponent implements OnInit {
  allStocks: Array<Stock>;
  allCats: Array<StockCategory>;

  constructor(private mainService: MainService) { }

  ngOnInit() {
    this.fillData();
  }


  fillData() {
    this.mainService.getAllBy('stocks', {}).then(result => {
      this.allStocks = result.docs;
      this.allStocks = this.allStocks.sort((a,b) => (b.quantity*b.total/b.left_total) - (a.quantity*a.total/a.left_total) );
    });
    this.mainService.getAllBy('stocks_cat', {}).then(result => {
      this.allCats = result.docs;
    });
  }
}
