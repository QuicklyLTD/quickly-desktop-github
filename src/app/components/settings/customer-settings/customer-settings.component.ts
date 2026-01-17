import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MainService } from '../../../core/services/main.service';
import { MessageService } from '../../../core/providers/message.service';
import { LogService, logType } from '../../../core/services/log.service';
import { FormsModule, NgForm } from '@angular/forms';
import { Customer } from '../../../models/customer';
import { Report } from '../../../models/report';
import { Check, CheckNo, CheckType } from '../../../models/check';
import { PrinterService } from '../../../core/providers/printer.service';
import { SettingsService } from '../../../core/services/settings.service';
import { EntityStoreService } from '../../../core/services/entity-store.service';
import { NgxMaskModule } from 'ngx-mask';
import { PricePipe } from '../../../pipes/price.pipe';
import { TimeAgoPipe } from '../../../pipes/timeago.pipe';

@Component({
  selector: 'app-customer-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskModule, PricePipe, TimeAgoPipe],
  templateUrl: './customer-settings.component.html',
  styleUrls: ['./customer-settings.component.scss']
})
export class CustomerSettingsComponent implements OnInit {
  customers: Array<Customer>;
  selectedCustomer: any;
  onUpdate: boolean;
  selectedCat: any;

  credits: Array<Check>;
  creditsView: Array<Check>;

  @ViewChild('customerForm', { static: false }) customerForm: NgForm;
  checkDetail: Check;
  day: any;
  printers: any;
  tableNames: Map<string, string> = new Map();
  userNames: Map<string, string> = new Map();

  constructor(
    private mainService: MainService, private settingsService: SettingsService,
    private printerService: PrinterService, private messageService: MessageService,
    private logService: LogService, private entityStoreService: EntityStoreService) {
  }

  ngOnInit() {
    this.onUpdate = false;
    this.settingsService.DateSettings.subscribe(res => {
      if (res && res.value) {
        this.day = res.value.day;
      }
    });
    this.settingsService.getPrinters().subscribe(res => {
      if (res && res.value) {
        this.printers = res.value;
      }
    });
    this.fillData();
  }

  setDefault() {
    this.onUpdate = false;
    this.selectedCustomer = undefined;
    this.selectedCat = undefined;
    this.customerForm.reset();
  }

  addCustomer(customerForm) {
    const form = customerForm.value;
    if (form.name === undefined) {
      this.messageService.sendMessage('Müşteri Adı Girmek Zorundasınız.');
      return false;
    }
    if (form.type === undefined) {
      this.messageService.sendMessage('Müşteri Tipi Seçmek Zorundasınız.');
      return false;
    }
    if (form.phone_number === undefined) {
      this.messageService.sendMessage('Telefon Numarası Girmek Zorundasınız.');
      return false;
    }
    if (form.address === undefined) {
      this.messageService.sendMessage('Adres Girmek Zorundasınız.');
      return false;
    }
    form.phone_number = parseInt(form.phone_number, 10);
    if (form._id === undefined) {
      this.mainService.getAllBy('customers', { phone_number: form.phone_number }).then(result => {
        if (result.docs.length > 0) {
          this.messageService.sendMessage('Bu telefon numarası ile başka bir Müşteri kayıtlı. Lütfen başka bir numara deneyin.');
          customerForm.reset();
        } else {
          const schema = new Customer(form.name, form.surname, form.phone_number, form.address, '', form.type, Date.now());
          this.mainService.addData('customers', schema).then((response) => {
          const weeklyZeros = [0, 0, 0, 0, 0];
          const monthlyZeros = new Array(12).fill(0);
          const reportData = new Report('Customer', response.id, 0, 0, 0, weeklyZeros, weeklyZeros, monthlyZeros,
            monthlyZeros, new Date().getMonth(), new Date().getFullYear(), form.name, Date.now());
            this.mainService.addData('reports', reportData).then(res => {
              this.logService.createLog(logType.CUSTOMER_CREATED, res.id, `${form.name} Adlı Müşteri Oluşturuldu`);
            });
            this.messageService.sendMessage('Müşteri Oluşturuldu!');
            this.fillData();
            customerForm.reset();
            $('#customerModal').modal('hide');
          });
        }
      });
    } else {
      this.mainService.getAllBy('customers', { phone_number: form.phone_number }).then(result => {
        if (result.docs.length > 0 && result.docs[0].phone_number !== form.phone_number) {
          this.messageService.sendMessage('Bu telefon numarası ile başka bir Müşteri kayıtlı. Lütfen başka bir numara deneyin.');
        } else {
          this.mainService.updateData('customers', form._id, form).then((res) => {
            this.logService.createLog(logType.CUSTOMER_UPDATED, res.id, `${form.name} Adlı Müşteri Güncellendi`);
            this.messageService.sendMessage('Bilgiler Güncellendi!');
            this.fillData();
            customerForm.reset();
            $('#customerModal').modal('hide');
          });
        }
      });
    }
  }

  updateCustomer(id) {
    this.onUpdate = true;
    this.selectedCustomer = id;
    this.mainService.getData('customers', id).then(result => {
      delete result.role;
      this.customerForm.setValue(result);
      $('#customerModal').modal('show');
    });
  }

  removeCustomer(id) {
    const isOk = confirm('Müşteriyi Silmek Üzerisiniz. Bu işlem Geri Alınamaz.');
    if (isOk) {
      this.mainService.removeData('customers', id).then((result) => {
        this.logService.createLog(logType.CUSTOMER_DELETED, result.id, `${this.customerForm.value.name} Adlı Müşteri Silindi`);
        this.mainService.getAllBy('reports', { connection_id: result.id }).then(res => {
          this.mainService.removeData('reports', res.docs[0]._id);
        });
        this.messageService.sendMessage('Müşteri Silindi!');
        this.fillData();
        $('#customerModal').modal('hide');
      });
    }
  }

  reOpenCheck(check: Check) {
    let checkWillReOpen;
    let discount = 0;
    if (check.payment_flow) {
      check.payment_flow.forEach(element => {
        discount += element.amount;
      });
      checkWillReOpen = new Check('Hızlı Satış', 0, discount, check.owner, 'Geri Açılan',
        check.status, check.products, Date.now(), CheckType.FAST, CheckNo(), check.payment_flow);
    } else {
      checkWillReOpen = new Check('Hızlı Satış', check.total_price, check.discount, check.owner,
        'Geri Açılan', check.status, check.products, Date.now(), CheckType.FAST, CheckNo(), check.payment_flow);
    }
    this.mainService.addData('checks', checkWillReOpen).then(() => {
      this.mainService.removeData('credits', check._id).then(() => {
        this.fillData();
        $('#checkDetail').modal('hide');
        this.messageService.sendAlert('Başarılı !', 'Hesap Geri Açıldı', 'success');
      });
    });
  }

  rePrintCheck(check) {
    this.mainService.getData('tables', check.table_id).then(res => {
      if (check.products.length > 0) {
        this.printerService.printCheck(this.printers[0], res.name, check);
      } else {
        check.products = check.payment_flow.reduce((a, b) => a.payed_products.concat(b.payed_products));
        this.printerService.printCheck(this.printers[0], res.name, check);
      }
    }).catch(err => {
      this.printerService.printCheck(this.printers[0], check.table_id, check);
    });
  }

  async getDetail(check: Check) {
    this.checkDetail = check;
    $('#reportDetail').modal('show');

    // Resolve names for this specific check detail
    if (check.table_id) {
       this.entityStoreService.resolveEntity('customers', check.table_id).then(name => {
         this.tableNames = new Map([...this.tableNames, [check.table_id, name]]);
       });
    }

    if (check.products) {
       const userIds = check.products.map(p => p.owner).filter(id => id);
       const resolvedUsers = await this.entityStoreService.resolveEntities('users', userIds);
       this.userNames = new Map([...this.userNames, ...resolvedUsers]);
    }

    if (check.payment_flow) {
      for (const flow of check.payment_flow) {
        if (flow.payed_products) {
          const flowUserIds = flow.payed_products.map(p => p.owner).filter(id => id);
          const resolvedFlowUsers = await this.entityStoreService.resolveEntities('users', flowUserIds);
          this.userNames = new Map([...this.userNames, ...resolvedFlowUsers]);
        }
      }
    }
  }

  cancelCheck(id, note) {
    this.messageService.sendConfirm('Kapanmış Hesap İptal Edilecek! Bu işlem geri alınamaz!').then(isOK => {
      if (isOK) {
        this.mainService.updateData('closed_checks', id, { description: note, type: 3 }).then(res => {
          this.logService.createLog(logType.CHECK_CANCELED, id, `${this.checkDetail.total_price} TL tutarındaki kapatılan hesap iptal edildi. Açıklama:'${note}'`);
          this.fillData();
          $('#cancelDetail').modal('hide');
        });
      }
    });
  }

  customerCredit(customer_id: string) {
    if (!this.credits || this.credits.length === 0) {
      return 0;
    }
    return this.credits
      .filter(obj => obj.table_id === customer_id)
      .map(obj => obj.total_price)
      .reduce((a, b) => a + b, 0) || 0;
  }

  filterChecks(customer_id: string) {
    this.creditsView = this.credits.filter(obj => obj.table_id === customer_id);
  }

  filterCustomers(value: string) {
    const regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('customers', { name: { $regex: regexp } }).then(res => {
      this.customers = res.docs;
    });
  }

  updateCategory(_form: NgForm) {
    return false;
  }

  removeCategory(_id: string) {
    return false;
  }

  fillData() {
    this.mainService.getAllBy('customers', {}).then(result => {
      this.customers = result.docs;
    });
    this.mainService.getAllBy('credits', {}).then(res => {
      this.credits = res.docs;
      this.creditsView = this.credits.sort((a, b) => a.timestamp - b.timestamp);

      // Resolve customer names for credits
      const customerIds = this.credits.map(c => c.table_id).filter(id => id);
      this.entityStoreService.resolveEntities('customers', customerIds).then(resolved => {
        this.tableNames = resolved;
      });
    });
  }
}
