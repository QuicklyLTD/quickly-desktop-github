import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Stock, StockCategory } from '../../../mocks/stocks';
import { MessageService } from '../../../providers/message.service';
import { LogService, logType } from '../../../services/log.service';
import { MainService } from '../../../services/main.service';

@Component({
  selector: 'app-stock-settings',
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
  @ViewChild('stockCatForm') stockCatForm: NgForm;
  @ViewChild('stockCatDetailForm') stockCatDetailForm: NgForm;
  @ViewChild('stockForm') stockForm: NgForm;
  @ViewChild('stockDetailForm') stockDetailForm: NgForm;
  constructor(private mainService: MainService, private messageService: MessageService, private logService: LogService) {
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

  getStockCatDetail(Category) {
    this.selectedCat = Category;
    this.stockCatDetailForm.setValue(Category);
  }

  getStocks(id) {
    this.mainService.getAllBy('stocks', { sub_category: id }).then((result) => {
      this.stocks = result.docs;
    });
  }

  removeStock(id) {
    this.messageService.sendConfirm('Kaydı Silmek Üzeresiniz. Bu İşlem Geri Alınamaz').then(isOk => {
      if (isOk) {
        this.mainService.removeData('stocks', id).then(res => {
          this.logService.createLog(logType.STOCK_DELETED, res.id, `${this.selectedStock.name} adlı Stok silindi.`);
          this.fillData();
          $('#stock').modal('hide');
          this.messageService.sendMessage('Stok Silindi!');
        });
      }
    })
  }

  getStockDetail(stock) {
    this.onUpdate = true;
    this.mainService.getData('stocks', stock._id).then(result => {
      this.stockForm.setValue(result)
      this.selectedStock = stock;
      $('#stock').modal('show');
    });
  }

  addQuantity(value) {
    const old_quantity = this.selectedStock.left_total / this.selectedStock.total;
    const new_quantity = (old_quantity + parseFloat(value));
    let after = { quantity: new_quantity, left_total: this.selectedStock.left_total + (this.selectedStock.total * parseFloat(value)), first_quantity: new_quantity, warning_limit: (this.selectedStock.total * new_quantity) * 25 / 100 };
    this.stockForm.setValue(Object.assign(this.selectedStock, after));
    $('#quantityModal').modal('hide');
    $('#stock').modal('show');
  }

  addStock(stockForm) {
    let form = stockForm.value;
    if (!form.name) {
      this.messageService.sendMessage('Stok Adı Belirtmelisiniz');
      return false;
    } else if (!form.category) {
      this.messageService.sendMessage('Kategori Seçmelisiniz');
      return false;
    }
    if (form._id == undefined) {
      let left_total = form.total * form.quantity;
      // let schema = new Stock(form.name, form.description, form.category, form.quantity, form.unit, form.total, left_total, form.quantity, (form.total * form.quantity) * form.warning_value / 100, form.warning_value, Date.now());
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

  addCategory(stockCatForm) {
    let form = stockCatForm.value;
    if (!form.name) {
      this.messageService.sendMessage('Kategori İsmi Belirtmelisiniz!');
      return false;
    }
    let schema = new StockCategory(form.name, form.description);
    this.mainService.addData('stocks_cat', schema).then(() => {
      this.fillData();
      this.messageService.sendMessage('Stok Kategorisi Oluşturuldu.');
      stockCatForm.reset();
    });
    $('#stockCat').modal('hide');
  }

  updateCategory(Form: NgForm) {
    let form = Form.value;
    this.mainService.updateData('stocks_cat', form._id, form).then(() => {
      this.fillData();
      this.messageService.sendMessage('Stok Kategorisi Güncellendi.');
      this.selectedCat = undefined;
    });
  }

  removeCategory(id) {
    let isOk = confirm('Kategoriyi Silmek Üzeresiniz. Kategoriye Dahil Olan Stoklarda Silinecektir.');
    if (isOk) {
      this.mainService.removeData('stocks_cat', id).then(() => {
        this.mainService.getAllBy('stocks', { cat_id: id }).then(result => {
          let data = result.docs
          if (data.length > 0) {
            for (let prop in data) {
              this.mainService.removeData('stocks', data[prop]._id);
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
    let regexp = new RegExp(value, 'i');
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
    })
  }
}
