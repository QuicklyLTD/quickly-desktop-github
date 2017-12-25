import { Component, OnInit } from '@angular/core';
import { MainService } from '../../../services/main.service';
import { ClosedCheck, Check } from '../../../mocks/check.mock';

@Component({
  selector: 'app-store-reports',
  templateUrl: './store-reports.component.html',
  styleUrls: ['./store-reports.component.scss']
})
export class StoreReportsComponent implements OnInit {
  AllChecks: Array<ClosedCheck>;
  FastChecks: Array<ClosedCheck>;
  NormalChecks: Array<ClosedCheck>;
  NotPayedChecks: Array<ClosedCheck>;
  checkDetail: any;
  selectedCat: any;
  NormalTotal: number = 0;
  FastTotal: number = 0;

  constructor(private mainService: MainService) {
    this.fillData();
  }

  ngOnInit() {
  }

  getDetail(check) {
    this.checkDetail = check;
    $('#reportDetail').modal('show');
  }

  filterTables(value: string) {
    if (value == '' || null) {
      this.fillData();
    } else {
      let regexp = new RegExp(value, 'i');
      this.mainService.getAllBy('tables', { name: { $regex: regexp } }).then(data => {
        if (data.docs.length > 0) {
          let results = this.AllChecks.filter(obj => obj.table_id == data.docs[0]._id);
          if (results.length > 0) {
            this.NormalChecks = results;
          }
        }
      });
    }
  }

  filterChecks(value: string) {
    if (this.AllChecks) {
      this.FastChecks = this.AllChecks.filter(obj => obj.owner.toLocaleLowerCase().includes(value.toLocaleLowerCase()) && obj.type == 2);
    }
  }

  getFastChecksBy(method) {
    if (this.AllChecks) {
      this.FastChecks = this.AllChecks.filter(obj => obj.payment_method == method && obj.type == 2);
    }
  }

  getNormalChecksBy(method) {
    if (this.AllChecks) {
      this.NormalChecks = this.AllChecks.filter(obj => obj.payment_method == method && obj.type == 1);
    }
  }

  cancelCheck(id, note) {
    let isOK = confirm('Kapanmış Hesap İptal Edilecek. Bu İşlem Geri Alınamaz!');
    if (isOK) {
      this.mainService.updateData('closed_checks', id, { description: note, type: 3 }).then(() => {
        this.fillData();
        $('#cancelDetail').modal('hide');
      });
    }
  }


  fillData() {
    this.mainService.getAllBy('closed_checks', {}).then(res => {
      if (res.docs.length > 0) {
        this.AllChecks = res.docs;
        this.AllChecks.sort((a, b) => b.timestamp - a.timestamp);
        this.NotPayedChecks = this.AllChecks.filter((obj) => obj.type == 3);
        this.FastChecks = this.AllChecks.filter(obj => obj.type == 2);
        this.NormalChecks = this.AllChecks.filter(obj => obj.type == 1);
        try {
          this.NormalTotal = this.NormalChecks.filter(obj => obj.payment_method !== 'İkram').map(obj => obj.total_price).reduce((a, b) => a + b);
          this.FastTotal = this.FastChecks.filter(obj => obj.payment_method !== 'İkram').map(obj => obj.total_price).reduce((a, b) => a + b);
        } catch (error) { }
      }
    });
  }
}
