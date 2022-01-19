import { Component, Input, OnInit } from '@angular/core';
import { Cashbox } from '../../../mocks/cashbox';
import { ClosedCheck } from '../../../mocks/check';
import { BackupData, EndDay } from '../../../mocks/endoftheday';
import { Report } from '../../../mocks/report';
import { ElectronService,  } from '../../../providers/electron.service';
import { Log, logType } from '../../../mocks/log';
import { PrinterService } from '../../../providers/printer.service';
import { SettingsService } from '../../../services/settings.service';


@Component({
  selector: 'app-day-detail',
  templateUrl: './day-detail.component.html',
  styleUrls: ['./day-detail.component.scss']
})
export class DayDetailComponent implements OnInit {
  @Input('data') detailData: EndDay;
  @Input('printers') printers: any;
  oldBackupData: Array<BackupData>;
  oldChecks: any;
  oldCashbox: any;
  oldReports: any;
  oldLogs: any;
  selectedCat: string;
  currentSection: string;
  checksTable: Array<ClosedCheck>;
  cashboxTable: Array<Cashbox>;
  reportsTable: Array<Report>;
  productsTable: Array<Report>;
  usersTable: Array<Report>;
  tablesTable: Array<Report>;
  logsTable: Array<Log>;
  checkDetail: ClosedCheck;
  activityData: any;
  activityLabels: any;
  activityOptions: any;
  cashDetail: Cashbox;
  syncStatus: boolean;
  pieData: Array<any>;
  pieLabels: Array<any>;
  pieOptions: any;
  pieColors: Array<any>;
  detailTitle: string;
  detailDay: number;
  constructor(private electronService: ElectronService, private printerService: PrinterService, private settingsService:SettingsService) {

    this.pieOptions = { responsive: false, legend: { labels: { fontColor: 'rgb(255, 255, 255)' } } };
    this.activityOptions = {
      responsive: false,
      elements: {
        line: {
          tension: 0.5,
        }
      },
      legend: { labels: { fontColor: 'rgb(255, 255, 255)' } },
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
            fontColor: 'rgba(255,255,255)'
          },
          gridLines: {
            color: 'rgba(255,255,255)',
            lineWidth: 0.4
          }
        }]
      },
    };
  }

  ngOnInit() {
    // this.settingsService.getPrinters().subscribe(res => this.printers = res.value);
    console.log(this.detailData,this.printers);

    this.detailTitle = 'Genel Detaylar & Grafik';
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
          this.detailTitle = 'Kapatılan Hesap Detayları';
          if (filter == 'All') {
            this.checksTable = this.oldChecks.docs.sort((a, b) => a.timestamp - b.timestamp);
          } else if (filter == 'İptal') {
            this.checksTable = this.oldChecks.docs.filter(obj => obj.type == 3).sort((a, b) => a.timestamp - b.timestamp);
          } else {
            this.checksTable = this.oldChecks.docs.filter(obj => obj.type !== 3).sort((a, b) => a.timestamp - b.timestamp);
            this.checksTable = this.oldChecks.docs.filter(obj => obj.payment_method == filter).sort((a, b) => a.timestamp - b.timestamp);
          }
          break;
        case 'Cashbox':
          this.detailTitle = 'Kasa Gelir-Gider Detayları';
          if (filter == 'All') {
            this.cashboxTable = this.oldCashbox.docs;
          }
          else if (filter == 'Gelir') {
            this.cashboxTable = this.oldCashbox.docs.filter(obj => obj.type == 'Gelir').sort((a, b) => a.timestamp - b.timestamp);
          } else if (filter == 'Gider') {
            this.cashboxTable = this.oldCashbox.docs.filter(obj => obj.type == 'Gider').sort((a, b) => a.timestamp - b.timestamp);
          }
          break;
        case 'Products':
          this.detailTitle = 'Güne Ait Ürün Satış Detayları';
          this.productsTable = this.oldReports.docs.filter(obj => obj.type == 'Product').sort((a, b) => b.weekly[this.detailDay] - a.weekly[this.detailDay]);
          this.productsTable = this.productsTable.filter(obj => obj.weekly[this.detailDay] !== 0);
          break;
        case 'Users':
          this.detailTitle = 'Güne Ait Kullanıcı Satış Detayları';
          this.usersTable = this.oldReports.docs.filter(obj => obj.type == 'User').sort((a, b) => b.weekly[this.detailDay] - a.weekly[this.detailDay]);
          this.usersTable = this.usersTable.filter(obj => obj.weekly[this.detailDay] !== 0);
          break;
        case 'Tables':
          this.detailTitle = 'Güne Ait Masa Satış Detayları';
          this.tablesTable = this.oldReports.docs.filter(obj => obj.type == 'Table').sort((a, b) => b.weekly[this.detailDay] - a.weekly[this.detailDay]);
          this.tablesTable = this.tablesTable.filter(obj => obj.weekly[this.detailDay] !== 0);
          break;
        case 'Logs':
          this.detailTitle = 'Güne Ait Sistem Kayıtları';
          this.logsTable = this.oldLogs.docs.sort((a, b) => b.timestamp - a.timestamp);
          break;
        case 'Activity':
          this.detailTitle = 'Güne Ait Aktivite Grafiği';
          let sellingActivity = this.oldReports.docs.find(obj => obj.type == 'Activity');
          this.activityData = [{ data: sellingActivity.activity, label: 'Gelir Endeksi' }, { data: sellingActivity.activity_count, label: 'Doluluk Oranı ( % )' }];
          this.activityLabels = sellingActivity.activity_time;
          break;

        default:
          break;
      }
    } else {
      alert('Senkorinizasyon işleminin bitmesini bekleyin.')
    }
  }

  printEndday(){
    this.printerService.printEndDay(this.printers[0], this.detailData);
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
    this.detailDay = new Date(this.detailData.timestamp).getDay();
    this.electronService.readBackupData(this.detailData.data_file).then((result: Array<BackupData>) => {
      this.oldBackupData = result;
      this.oldChecks = this.oldBackupData[0];
      this.oldCashbox = this.oldBackupData[1];
      this.oldReports = this.oldBackupData[2];
      this.oldLogs = this.oldBackupData[3];
      this.syncStatus = true;
    }).catch(err => {
      console.log(err);
      this.oldBackupData = [];
      this.syncStatus = false;
    });
  }

}
