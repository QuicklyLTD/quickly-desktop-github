import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { MainService } from '../../../services/main.service';
import { MessageService } from '../../../providers/message.service';
import { Check } from '../../../mocks/check.mock';

@Component({
  selector: 'app-payment-screen',
  templateUrl: './payment-screen.component.html',
  styleUrls: ['./payment-screen.component.scss']
})
export class PaymentScreenComponent implements OnInit {
  id: string;
  check: Check;
  payedShow: boolean;
  payedTitle: string;
  numboard: Array<any>;

  constructor(private route: ActivatedRoute, private mainService: MainService, private messageService: MessageService) {
    this.numboard = [[1, 2, 3],[4, 5, 6],[7, 8, 9],[".", 0, "✔"],];
    this.payedShow = true;
    this.payedTitle = 'Alınan Ödemeleri Gizle';
    this.route.params.subscribe(params => {
      this.id = params['id'];
      this.mainService.getData('checks', this.id).then(res => {
        console.log(res);
        this.check = res;
      })
    });
  }

  ngOnInit() {
  }

  togglePayed() {
    if (this.payedShow) {
      this.payedShow = false;
      this.payedTitle = 'Alınan Ödemeleri Görüntüle';
    } else {
      this.payedShow = true;
      this.payedTitle = 'Alınan Ödemeleri Gizle';
    }
  }


}
