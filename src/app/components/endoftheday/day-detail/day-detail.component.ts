import { Component, Input, OnInit } from '@angular/core';
import { Cashbox } from '../../../mocks/cashbox.mock';
import { ClosedCheck } from '../../../mocks/check.mock';
import { BackupData, EndDay } from '../../../mocks/endoftheday.mock';
import { Report } from '../../../mocks/report.mock';
import { ElectronService } from '../../../providers/electron.service';
import { MainService } from '../../../services/main.service';

@Component({
  selector: 'app-day-detail',
  templateUrl: './day-detail.component.html',
  styleUrls: ['./day-detail.component.scss']
})
export class DayDetailComponent implements OnInit {
  @Input('data') detailData: EndDay;
  oldBackupData: Array<BackupData>;
  oldChecks: any;
  oldCashbox: any;
  oldReports: any;
  currentSection: string;
  checksTable: Array<ClosedCheck>;
  cashboxTable: Array<Cashbox>;
  reportsTable: Array<Report>;
  checkDetail: ClosedCheck;
  cashDetail: Cashbox;
  syncStatus: boolean;
  pieOptions: any = { responsive: false };
  pieData: Array<any>;
  pieLabels: Array<any>;
  pieColors: Array<any>;
  constructor(private mainService: MainService, private electronService: ElectronService) {
  }

  ngOnInit() {
    this.pieColors = [];
    this.pieData = [];
    this.pieLabels = [];
    this.cashboxTable = [];
    this.checksTable = [];
    this.fillData();
  }

  filterOldData(section, filter) {
    if (this.syncStatus) {
      this.currentSection = section;
      switch (section) {
        case 'Checks':
          if (filter == 'All') {
            this.checksTable = this.oldChecks.docs.sort((a,b) => a.timestamp - b.timestamp);
          } else if (filter == 'İptal') {
            this.checksTable = this.oldChecks.docs.filter(obj => obj.type == 3).sort((a,b) => a.timestamp - b.timestamp);
          } else {
            this.checksTable = this.oldChecks.docs.filter(obj => obj.type !== 3).sort((a,b) => a.timestamp - b.timestamp);
            this.checksTable = this.oldChecks.docs.filter(obj => obj.payment_method == filter).sort((a,b) => a.timestamp - b.timestamp);
          }
          break;
        case 'Cashbox':
          if (filter == 'Gelir') {
            this.cashboxTable = this.oldCashbox.docs.filter(obj => obj.type == 'Gelir').sort((a,b) => a.timestamp - b.timestamp);
          } else {
            this.cashboxTable = this.oldCashbox.docs.filter(obj => obj.type == 'Gider').sort((a,b) => a.timestamp - b.timestamp);
          }
          break;
        case 'Reports':

          break;

        default:
          break;
      }
    } else {
      alert('Senkorinizasyon işleminin bitmesini bekleyin.')
    }
  }

  showCheckDetail(check) {
    this.checkDetail = check;
    $('#checkDetail').modal('show');
  }

  showCashDetail(cash) {
    this.cashDetail = cash;
    $('#cashDetail').modal('show');
  }

  fillData() {
    this.pieColors = [{ backgroundColor: ['#5cb85c', '#f0ad4e', '#5bc0de', '#d9534f'] }];
    this.pieLabels.push('Nakit', 'Kart', 'Kupon', 'İkram');
    this.pieData.push(this.detailData.cash_total, this.detailData.card_total, this.detailData.coupon_total, this.detailData.free_total);
    this.electronService.readBackupData(this.detailData.data_file).then((result: Array<BackupData>) => {
      this.oldBackupData = result;
      this.oldChecks = this.oldBackupData[0];
      this.oldCashbox = this.oldBackupData[1];
      this.oldReports = this.oldBackupData[2];
      this.syncStatus = true;
    }).catch(err => {
      console.log(err);
      this.oldBackupData = [];
      this.syncStatus = false;
    });
  }

}
