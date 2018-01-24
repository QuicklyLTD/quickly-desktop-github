import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { MainService } from '../../../services/main.service';
import { SettingsService } from '../../../services/settings.service';
import { MessageService } from '../../../providers/message.service';
import { Check, CheckProduct, PaymentStatus } from '../../../mocks/check.mock';
import { PrinterService } from '../../../providers/printer.service';
import { Printer } from '../../../mocks/settings.mock';

@Component({
  selector: 'app-payment-screen',
  templateUrl: './payment-screen.component.html',
  styleUrls: ['./payment-screen.component.scss'],
  providers: [SettingsService]
})
export class PaymentScreenComponent implements OnInit {
  id: string;
  check: Check;
  table: string;
  userId: string;
  userName: string;
  payedShow: boolean;
  payedTitle: string;
  numboard: Array<any>;
  numpad: string;
  isFirstTime: boolean;
  productsWillPay: Array<CheckProduct>;
  priceWillPay: number;
  payedPrice: number;
  changePrice: number;
  changeMessage: string;
  printers: Array<Printer>;

  constructor(private route: ActivatedRoute, private settings: SettingsService, private mainService: MainService, private printerService: PrinterService, private messageService: MessageService) {
    this.route.params.subscribe(params => {
      this.id = params['id'];
      this.fillData();
    });
    this.settings.getPrinters().subscribe(res => this.printers = res.value);
  }
  
  ngOnInit() {
    this.numboard = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [".", 0, "✔"]];
    this.setDefault();
    this.payedShow = false;
    this.payedTitle = 'Alınan Ödemeleri Göster';
    this.userId = this.settings.getUser('id');
    this.userName = this.settings.getUser('name');
  }

  payProducts(method: string) {
    let newPayment = new PaymentStatus(this.userName, method, this.priceWillPay, 0, Date.now(), this.productsWillPay);
    if (this.check.payment_flow == undefined) {
      this.check.payment_flow = [];
      this.check.type = 3;
    }
    this.check.payment_flow.push(newPayment);
    this.check.discount += this.priceWillPay; 
    this.mainService.updateData('checks', this.id, this.check).then(res => {
      this.messageService.sendMessage(`Ürünler ${method} olarak ödendi`);
      this.fillData();
      this.setDefault();
      this.togglePayed();
    });
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
  addProductToList(product: CheckProduct) {
    this.check.products = this.check.products.filter(obj => obj !== product);
    this.productsWillPay.push(product);
    this.check.total_price -= product.price;
    this.priceWillPay += product.price;
    this.numpad = this.priceWillPay.toString();
    this.setChange();
  }
  addProductToCheck(product: CheckProduct) {
    this.productsWillPay = this.productsWillPay.filter(obj => obj !== product);
    this.check.products.push(product);
    this.check.total_price += product.price;
    this.priceWillPay -= product.price;
    this.setChange();
  }
  sendAllProducts() {
    this.check.products.forEach(element => {
      this.productsWillPay.push(element);
      this.check.products = this.check.products.filter(obj => obj !== element);
    })
    this.priceWillPay = this.productsWillPay.map(obj => obj.price).reduce((a, b) => a + b);
    this.check.products = [];
    this.numpad = this.priceWillPay.toString();
    this.check.total_price = 0;
    this.setChange();
  }
  getPayment(number: number) {
    this.payedPrice += number;
    this.setChange();
  }
  resetPayment() {
    this.payedPrice = 0;
    this.setChange();
  }
  setChange() {
    this.changePrice = this.payedPrice - this.priceWillPay;
    if (this.changePrice > 0) {
      this.changeMessage = 'Para Üstü';
    } else {
      this.changeMessage = 'Kalan Ödeme';
    }
  }
  pushKey(key: any) {
    if (key === "✔") {
      this.payedPrice = parseFloat(this.numpad);
      this.setChange();
      this.numpad = '';
    } else {
      if (this.isFirstTime) {
        this.numpad = '';
        this.isFirstTime = false;
      }
      this.numpad += key;
    }
  }
  cleanPad() {
    this.numpad = '';
  }
  printCheck() {
    this.printerService.printCheck(this.printers[0], this.table, this.check);
  }
  setDefault(){
    this.numpad = '';
    this.isFirstTime = true;
    this.productsWillPay = [];
    this.priceWillPay = 0;
    this.changePrice = 0;
    this.payedPrice = 0;
  }
  fillData() {
    this.mainService.getData('checks', this.id).then(res => {
      this.check = res;
      this.check.products = this.check.products.filter(obj => obj.status == 2);
      this.mainService.getData('tables', this.check.table_id).then(res => {
        this.table = res.name;
      })
    });
  }
}
