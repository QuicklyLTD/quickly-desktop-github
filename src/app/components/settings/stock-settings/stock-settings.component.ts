import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Stock, StockCategory } from '../../../models/stocks';
import { MessageService } from '../../../core/providers/message.service';
import { LogService, logType } from '../../../core/services/log.service';
import { MainService } from '../../../core/services/main.service';
import { EntityStoreService } from '../../../core/services/entity-store.service';

@Component({
  selector: 'app-stock-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-settings.component.html',
  styleUrls: ['./stock-settings.component.scss']
})
export class StockSettingsComponent implements OnInit {
  categories: Array<StockCategory>;
  stocks: Array<Stock>;
  selectedStock: Stock;
  selectedCat: StockCategory;
  onUpdate: boolean;
  units: Array<string>;
  stockCatName: string;
  @ViewChild('stockCatForm', { static: false }) stockCatForm: NgForm;
  @ViewChild('stockCatDetailForm', { static: false }) stockCatDetailForm: NgForm;
  @ViewChild('stockForm', { static: false }) stockForm: NgForm;
  @ViewChild('stockDetailForm', { static: false }) stockDetailForm: NgForm;
  constructor(
    private mainService: MainService,
    private messageService: MessageService,
    private logService: LogService,
    private entityStoreService: EntityStoreService
  ) {
    this.units = ['Gram', 'Mililitre', 'Adet'];
    this.fillData();
  }

  ngOnInit() {
    this.onUpdate = false;
  }

  setDefault() {
    this.stockCatForm.reset();
    this.stockForm.reset();
    this.onUpdate = false;
  }

  getStockCatDetail(Category: StockCategory) {
    this.selectedCat = Category;
    this.stockCatDetailForm.setValue(Category);
  }

  getStocks(id: string) {
    this.mainService.getAllBy('stocks', { sub_category: id }).then((result) => {
      this.stocks = result.docs;
    });
  }

  removeStock(id: string) {
    this.messageService.sendConfirm('Kaydı Silmek Üzeresiniz. Bu İşlem Geri Alınamaz').then(isOk => {
      if (isOk) {
        this.mainService.removeData('stocks', id).then(res => {
          this.logService.createLog(logType.STOCK_DELETED, res.id, `${this.selectedStock.name} adlı Stok silindi.`);
          this.fillData();
          $('#stock').modal('hide');
          this.messageService.sendMessage('Stok Silindi!');
        });
      }
    });
  }

  getStockDetail(stock: Stock) {
    this.onUpdate = true;
    this.mainService.getData('stocks', stock._id).then(async result => {
      this.stockForm.form.patchValue(result);
      this.selectedStock = stock;
      this.stockCatName = await this.entityStoreService.resolveEntity('stocks_cat', stock.category);
      $('#stock').modal('show');
    });
  }

  addQuantity(value: string) {
    const old_quantity = this.selectedStock.left_total / this.selectedStock.total;
    const new_quantity = (old_quantity + parseFloat(value));
    const after = {
      quantity: new_quantity,
      left_total: this.selectedStock.left_total + (this.selectedStock.total * parseFloat(value)),
      first_quantity: new_quantity,
      warning_limit: (this.selectedStock.total * new_quantity) * 25 / 100
    };
    this.stockForm.form.patchValue(Object.assign(this.selectedStock, after));
    $('#quantityModal').modal('hide');
    $('#stock').modal('show');
  }

  addStock(stockForm: NgForm) {
    const form = stockForm.value;
    if (!form.name) {
      this.messageService.sendMessage('Stok Adı Belirtmelisiniz');
      return false;
    } else if (!form.category) {
      this.messageService.sendMessage('Kategori Seçmelisiniz');
      return false;
    }
    if (form._id === undefined) {
      const left_total = form.total * form.quantity;
      // const schema = new Stock(form.name, form.description, form.category, form.quantity, form.unit,
      //   form.total, left_total, form.quantity, (form.total * form.quantity) * form.warning_value / 100,
      //   form.warning_value, Date.now());
      // this.mainService.addData('stocks', schema).then((res) => {
      //   this.logService.createLog(logType.STOCK_CREATED, res.id, `${form.name} adlı Stok oluşturuldu.`);
      //   this.fillData();
      //   stockForm.reset();
      //   this.messageService.sendMessage('Stok oluşturuldu');
      // });
    } else {
      form.warning_limit = (form.total * form.quantity) * form.warning_value / 100;
      this.mainService.updateData('stocks', form._id, form).then(() => {
        this.fillData();
        stockForm.reset();
        this.logService.createLog(logType.STOCK_UPDATED, form._id, `${form.name} adlı Stok Güncellendi.`);
        this.messageService.sendMessage('Stok Düzenlendi');
      });
    }
    $('#stock').modal('hide');
  }

  addCategory(stockCatForm: NgForm) {
    const form = stockCatForm.value;
    if (!form.name) {
      this.messageService.sendMessage('Kategori İsmi Belirtmelisiniz!');
      return false;
    }
    const schema = new StockCategory(form.name, form.description);
    this.mainService.addData('stocks_cat', schema).then(() => {
      this.fillData();
      this.messageService.sendMessage('Stok Kategorisi Oluşturuldu.');
      stockCatForm.reset();
    });
    $('#stockCat').modal('hide');
  }

  updateCategory(Form: NgForm) {
    const form = Form.value;
    this.mainService.updateData('stocks_cat', form._id, form).then(() => {
      this.fillData();
      this.messageService.sendMessage('Stok Kategorisi Güncellendi.');
      this.selectedCat = undefined;
    });
  }

  removeCategory(id: string) {
    const isOk = confirm('Kategoriyi Silmek Üzeresiniz. Kategoriye Dahil Olan Stoklarda Silinecektir.');
    if (isOk) {
      this.mainService.removeData('stocks_cat', id).then(() => {
        this.mainService.getAllBy('stocks', { cat_id: id }).then(result => {
          const data = result.docs;
          if (data.length > 0) {
            for (const prop in data) {
              if (data.hasOwnProperty(prop)) {
                this.mainService.removeData('stocks', data[prop]._id);
              }
            }
          }
          this.messageService.sendMessage('Stok Kategorisi ve Bağlı Stoklar Silindi.');
          this.selectedCat = undefined;
          this.fillData();
        });
      });
    }
  }

  filterStocks(value: string) {
    const regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('stocks', { name: { $regex: regexp } }).then(res => {
      this.stocks = res.docs;
      this.stocks = this.stocks.sort((a, b) => a.left_total - b.left_total);
    });
  }

  fillData() {
    this.mainService.getAllBy('stocks_cat', {}).then(result => {
      this.categories = result.docs;
    });
    this.mainService.getAllBy('stocks', {}).then(result => {
      this.stocks = result.docs;
      this.stocks = this.stocks.sort((a, b) => b.timestamp - a.timestamp);
    });
  }
}
