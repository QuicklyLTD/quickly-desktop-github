import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Activity, Report } from '../../models/report';
import { MainService } from '../../core/services/main.service';
import { SettingsService } from '../../core/services/settings.service';
import { ChartsModule } from 'ng2-charts';
import { ChartType } from 'chart.js';
import { PricePipe } from '../../pipes/price.pipe';
import { ActivityReportsComponent } from './activity-reports/activity-reports.component';
import { CashboxReportsComponent } from './cashbox-reports/cashbox-reports.component';
import { NotificationsReportsComponent } from './notifications-reports/notifications-reports.component';
import { ProductReportsComponent } from './product-reports/product-reports.component';
import { StockReportsComponent } from './stock-reports/stock-reports.component';
import { StoreReportsComponent } from './store-reports/store-reports.component';
import { TableReportsComponent } from './table-reports/table-reports.component';
import { UserReportsComponent } from './user-reports/user-reports.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ChartsModule,
    PricePipe,
    ActivityReportsComponent,
    CashboxReportsComponent,
    NotificationsReportsComponent,
    ProductReportsComponent,
    StockReportsComponent,
    StoreReportsComponent,
    TableReportsComponent,
    UserReportsComponent
  ],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  providers: [SettingsService]
})
export class ReportsComponent implements OnInit {
  day: number;

  selected: number | null;
  freeTotal: number;
  closedTotal: number;
  canceledTotal: number;
  activeTotal: number;
  generalTotal: number;
  sellingActivity: Activity;

  ChartOptions: Record<string, any>;
  ChartLegend = true;
  ChartType: ChartType = 'bar';
  ChartData: Array<{ data: number[]; label: string }>;
  ChartColors: Array<{ backgroundColor: string }>;
  ChartLoaded: boolean;
  ChartLabels: Array<string>;

  monthlyData: Array<{ label: string; data: number[] }>;
  monthlyLabels: Array<string>;
  monthlyLegends = true;
  monthlyLoaded = false;

  activityData: Array<{ data: number[]; label: string }>;
  activityLabels: Array<string>;
  activityLegend = true;

  salesReport: {
    cash: number;
    card: number;
    coupon: number;
    free: number;
    discount: number;
    partial: Array<{ payment_flow: Array<{ method: string; amount: number }> }> | null;
  } = { cash: 0, card: 0, coupon: 0, free: 0, discount: 0, partial: null };

  pieData: number[];
  pieLabels: string[];
  pieColors: Array<{ backgroundColor: string[] }>;
  pieOptions: Record<string, any>;

  constructor(private mainService: MainService, private settingsService: SettingsService) {
    this.settingsService.DateSettings.subscribe(res => {
      this.day = res.value.day;
    });
    this.closedTotal = 0;
    this.activeTotal = 0;
    this.generalTotal = 0;
    this.freeTotal = 0;
    this.canceledTotal = 0;
    this.selected = null;
    this.monthlyLabels = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    this.ChartLabels = ['Pzt', 'Sa', 'Ça', 'Pe', 'Cu', 'Cmt', 'Pa'];
    this.ChartOptions = {
      responsive: false,
      legend: {
        labels: {
          fontColor: 'rgb(255, 255, 255)',
          fontStyle: 'bolder'
        }
      },
      tooltips: {
        callbacks: {
          label: (value: any) => {
            return ' ' + Number((value as { yLabel: number }).yLabel).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ₺';
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
            callback: (value: number, index: number, values: number[]) => {
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
    this.ChartColors = [
      { backgroundColor: '#5cb85c' },
      { backgroundColor: '#5bc0de' },
      { backgroundColor: '#f0ad4e' },
      { backgroundColor: '#d9534f' },
      { backgroundColor: '#DF691A' },
      { backgroundColor: '#FFFFFF' },
    ];
    this.pieColors = [{ backgroundColor: ['#5cb85c', '#f0ad4e', '#5bc0de', '#d9534f'] }];
    this.pieOptions = {
      legend: {
        labels: { fontColor: 'rgb(255, 255, 255)', fontStyle: 'bolder' }
      },
      tooltips: {
        callbacks: {
          label: (
            tooltipItem: { index: number; datasetIndex: number },
            data: { labels: string[]; datasets: Array<{ data: number[] }> }
          ) => {
            const dataLabel = data.labels[tooltipItem.index];
            const value = ': ' + Number(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ₺';
            return dataLabel + value;
          }
        }
      },
    };
  }

  ngOnInit() {
    this.fillData();
    this.dailySalesReport();
  }

  normalWeekOrder(array: number[]): number[] {
    if (!array || array.length === 0) {
      return [];
    }
    const arrayLength = array.length;
    for (let i = 0; i < arrayLength - 1; i++) {
      const temp = array[i];
      array[i] = array[i + 1];
      array[i + 1] = temp;
    }
    return array;
  }


  getMonthlyReport(year?: number) {
    this.monthlyLoaded = false;
    if (!year) {
      year = new Date(Date.now()).getFullYear();
    }
    const Days: Array<{
      cash: number;
      card: number;
      coupon: number;
      free: number;
      total: number;
      checks: number;
      outcome: any;
      income: any;
      month: number;
      year: number;
    }> = [];
    const Months: Array<{ label: string; data: number[] }> = [];
    this.mainService.getAllBy('endday', {}).then(res => {
      const endDayRecords: Array<{
        timestamp: number;
        cash_total: number;
        card_total: number;
        coupon_total: number;
        free_total: number;
        total_income: number;
        check_count: number;
        outcomes: any;
        incomes: any;
      }> = res.docs;
      const endDayData = endDayRecords.filter(obj => new Date(obj.timestamp).getFullYear() === year);
      if (endDayData.length > 0) {
        endDayData.forEach((obj, index) => {
          const Schema = {
            cash: obj.cash_total,
            card: obj.card_total,
            coupon: obj.coupon_total,
            free: obj.free_total,
            total: obj.total_income,
            checks: obj.check_count,
            outcome: obj.outcomes,
            income: obj.incomes,
            month: new Date(obj.timestamp).getMonth(),
            year: new Date(obj.timestamp).getFullYear()
          };
          Days.push(Schema);
          if (index === endDayData.length - 1) {
            const cash = { label: 'Nakit', data: [] as number[] };
            const coupon = { label: 'Kupon', data: [] as number[] };
            const card = { label: 'Kart', data: [] as number[] };
            const free = { label: 'İkram', data: [] as number[] };
            const total = { label: 'Toplam', data: [] as number[] };
            this.monthlyLabels.forEach((monthName, index2) => {
              const monthWillProcess = Days.filter(day => day.month === index2);
              if (monthWillProcess.length > 0) {
                cash.data[index2] = monthWillProcess.map(day => day.cash).reduce((a, b) => a + b, 0);
                card.data[index2] = monthWillProcess.map(day => day.card).reduce((a, b) => a + b);
                coupon.data[index2] = monthWillProcess.map(day => day.coupon).reduce((a, b) => a + b);
                free.data[index2] = monthWillProcess.map(day => day.free).reduce((a, b) => a + b);
                total.data[index2] = monthWillProcess.map(day => day.total).reduce((a, b) => a + b);
              } else if (monthWillProcess.length === 1) {
                cash.data[index2] = monthWillProcess[0].cash;
                card.data[index2] = monthWillProcess[0].card;
                coupon.data[index2] = monthWillProcess[0].coupon;
                free.data[index2] = monthWillProcess[0].free;
                total.data[index2] = monthWillProcess[0].total;
              } else {
                cash.data[index2] = 0;
                card.data[index2] = 0;
                coupon.data[index2] = 0;
                free.data[index2] = 0;
                total.data[index2] = 0;
              }
              if (index2 === this.monthlyLabels.length - 1) {
                Months.push(cash, coupon, card, free, total);
                this.monthlyData = Months;
                this.monthlyLoaded = true;
              }
            });
          }
        });
      }
    });
  }


  fillData() {
    this.getMonthlyReport();
    this.ChartData = [];
    this.pieData = [];
    this.pieLabels = [];
    this.ChartLoaded = false;
    this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
      if (!res.docs.length) {
        this.ChartLoaded = false;
        return;
      }
      this.sellingActivity = res.docs[0];
      this.activityData = [
        { data: this.sellingActivity.activity, label: 'Gelir Endeksi' },
        { data: this.sellingActivity.activity_count, label: 'Doluluk Oranı ( % )' }
      ];
      this.activityLabels = this.sellingActivity.activity_time;
    });
    this.mainService.getAllBy('reports', { type: 'Store' }).then(res => {
      let report: Array<Report> = res.docs;
      report = report
        .filter((obj: Report) => obj.connection_id !== 'Genel')
        .sort((a, b) => (b.connection_id || '').localeCompare(a.connection_id || ''));
      report.forEach((element, index) => {
        element.weekly = this.normalWeekOrder(element.weekly);
        const chartObj = { data: element.weekly, label: element.connection_id };
        this.ChartData.push(chartObj);
        if (report.length - 1 === index) {
          this.ChartLoaded = true;
        }
      });
    });
    this.mainService.getAllBy('closed_checks', { type: 3 }).then(res => {
      if (res.docs.length > 0) {
        this.canceledTotal = res.docs.map((obj) => obj.total_price).reduce((a, b) => a + b);
      }
    });
  }

  dailySalesActivity() {
    this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
      if (!res.docs.length) {
        this.ChartLoaded = false;
        return;
      }
      this.sellingActivity = res.docs[0];
      this.activityData = [
        { data: this.sellingActivity.activity, label: 'Gelir Endeksi' },
        { data: this.sellingActivity.activity_count, label: 'Doluluk Oranı ( % )' }
      ];
      this.activityLabels = this.sellingActivity.activity_time;
    });
  }

  dailySalesReport() {
    this.mainService.getAllBy('checks', {}).then(res => {
      this.activeTotal = res.docs.map(obj => obj.total_price + obj.discount).reduce((a, b) => a + b, 0);
    });

    this.mainService.getAllBy('closed_checks', {}).then(res => {

      const checks = res.docs.filter((obj: { type: number }) => obj.type !== 3);

      this.salesReport.cash = checks.filter(obj => obj.payment_method === 'Nakit').map(obj => obj.total_price).reduce((a, b) => a + b, 0);
      this.salesReport.card = checks.filter(obj => obj.payment_method === 'Kart').map(obj => obj.total_price).reduce((a, b) => a + b, 0);
      this.salesReport.coupon = checks.filter(obj => obj.payment_method === 'Kupon').map(obj => obj.total_price).reduce((a, b) => a + b, 0);
      this.salesReport.free = checks.filter(obj => obj.payment_method === 'İkram').map(obj => obj.total_price).reduce((a, b) => a + b, 0);
      this.salesReport.discount = checks.filter(obj => 'discount' in obj).map(obj => obj.discount).reduce((a, b) => a + b, 0);

      this.salesReport.partial = checks.filter(obj => obj.payment_method === 'Parçalı');

      this.salesReport.partial.forEach(element => {
        element.payment_flow.forEach(payment => {
          if (payment.method === 'Nakit') {
            this.salesReport.cash += payment.amount;
          }
          if (payment.method === 'Kart') {
            this.salesReport.card += payment.amount;
          }
          if (payment.method === 'Kupon') {
            this.salesReport.coupon += payment.amount;
          }
          if (payment.method === 'İkram') {
            this.salesReport.free += payment.amount;
          }
        });
      });

      this.closedTotal = this.salesReport.cash + this.salesReport.card + this.salesReport.coupon;
      this.generalTotal = this.closedTotal + this.activeTotal;

      this.pieData.push(this.salesReport.cash);
      this.pieData.push(this.salesReport.card);
      this.pieData.push(this.salesReport.coupon);
      this.pieData.push(this.salesReport.free);

      this.pieLabels.push('Nakit');
      this.pieLabels.push('Kart');
      this.pieLabels.push('Kupon');
      this.pieLabels.push('İkram');

    });
  }
}
