import { Injectable } from '@angular/core';
import { MainService } from './main.service';

@Injectable()
export class OrderService {

  orderListener: any;

  constructor(private mainService: MainService) { }


  startOrderListener() {
    this.orderListener = this.mainService.LocalDB['orders'].changes({ since: 'now', live: true, include_docs: true }).on('change', (changes) => {
      console.log(changes.doc);

      // this.mainService.getBulk([])
    });
  }

  closeOrderListener() {
    this.orderListener.cancel();
  }


  orderToCheck() {

  }


  orderToPrint() {

  }

}
