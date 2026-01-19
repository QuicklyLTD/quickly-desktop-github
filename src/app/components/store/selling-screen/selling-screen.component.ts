import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, NgZone, OnDestroy } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Order, OrderItem, OrderStatus, OrderType } from '../../../models/order';
import { Check, CheckProduct, ClosedCheck, PaymentStatus, CheckStatus, CheckType, CheckNo, Occupation } from '../../../models/check';
import { Category, Ingredient, Product, ProductSpecs, SubCategory, ProductType, ProductStatus } from '../../../models/product';
import { PaymentMethod, Printer } from '../../../models/settings';
import { Floor, Table, TableStatus } from '../../../models/table';
import { ElectronService } from '../../../core/services/electron/electron.service';
import { MessageService } from '../../../core/providers/message.service';
import { PrinterService } from '../../../core/providers/printer.service';
import { LogService, logType } from '../../../core/services/log.service';
import { MainService } from '../../../core/services/main.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ScalerService } from '../../../core/providers/scaler.service';
import { KeyboardService } from '../../../core/providers/keyboard.service';
import { EntityStoreService } from '../../../core/services/entity-store.service';
import { Subscription } from 'rxjs'; // tslint:disable-line:import-blacklist
import { PricePipe } from '../../../pipes/price.pipe';
import { TimeAgoPipe } from '../../../pipes/timeago.pipe';
import { ButtonDirective } from '../../../directives/button.directive';

@Component({
  selector: 'app-selling-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PricePipe, TimeAgoPipe, ButtonDirective],
  templateUrl: './selling-screen.component.html',
  styleUrls: ['./selling-screen.component.scss'],
  providers: [SettingsService]
})
export class SellingScreenComponent implements OnInit, OnDestroy {
  id: string;
  type: string;
  categories: Array<Category>;
  sub_categories: Array<SubCategory>;
  subCatsView: Array<SubCategory>;
  products: Array<Product>;
  productsView: Array<Product>;
  checks: Array<any>;
  floors: Array<Floor>;
  selectedFloor: string;
  table: Table;
  tables: Array<Table>;
  selectedTable: any;
  tablesView: Array<any>;
  check: Check;
  check_id: string;
  selectedCat: string;
  selectedProduct: CheckProduct;
  selectedIndex: number;
  noteForm: NgForm;
  owner: string;
  ownerRole: string;
  ownerId: string;
  newOrders: Array<CheckProduct> = [];
  countData: Array<any> = [];
  payedShow = false;
  payedTitle = 'Alınan Ödemeleri Görüntüle';
  printers: Array<Printer>;
  cancelReasons: Array<string>;
  onProductChange = false;
  productWithSpecs: Product;
  productStock: any;
  numpad: any;
  numboard: Array<any>;
  isFirstTime: boolean;
  askForPrint: boolean;
  askForCheckPrint: boolean;
  productSpecs: Array<ProductSpecs>;
  permissions: any;
  day: number;
  paymentMethods: Array<PaymentMethod>;
  changes: any;
  discounts: Array<number>;
  selectedQuantity: number;
  takeaway: boolean;
  readyNotes: string[] = [];
  scalerListener: Subscription;
  tareNumber: number;

  // Lookup maps for resolved entity names
  tableName: string;
  userNames: Map<string, string> = new Map();
  stockUnit: string;
  isCollapsedView = false;

  @ViewChild('productName', { static: false }) productFilterInput: ElementRef;
  @ViewChild('specsUnit', { static: false }) productUnit: ElementRef;
  @ViewChild('noteInput', { static: false }) noteInput: ElementRef;
  @ViewChild('checkNoteInput', { static: false }) checkNoteInput: ElementRef;

  constructor(
    private mainService: MainService,
    private printerService: PrinterService,
    private route: ActivatedRoute,
    private router: Router,
    private electron: ElectronService,
    private message: MessageService,
    private settingsService: SettingsService,
    private scalerService: ScalerService,
    private logService: LogService,
    private zone: NgZone,
    public entityStoreService: EntityStoreService,
    private keyboardService: KeyboardService
  ) {
    this.owner = this.settingsService.getUser('name');
    this.ownerRole = this.settingsService.getUser('type');
    this.ownerId = this.settingsService.getUser('id');
    this.discounts = [5, 10, 15, 20, 25, 40];
    this.selectedQuantity = 1;
    this.paymentMethods = [
      new PaymentMethod('Nakit', 'Nakit Ödeme', '#5cb85c', 'fa-money', 1, 1),
      new PaymentMethod('Kart', 'Kredi veya Banka Kartı', '#f0ad4e', 'fa-credit-card', 2, 1),
      new PaymentMethod('Kupon', 'İndirim Kuponu veya Yemek Çeki', '#5bc0de', 'fa-bookmark', 3, 1),
      new PaymentMethod('İkram', 'İkram Hesap', '#c9302c', 'fa-handshake-o', 4, 1)
    ];
    this.cancelReasons = [
      'Zayi',
      'Stokta Yok',
      'Yanlış Sipariş',
      'Müşteri İstemedi',
    ];
    this.numboard = [[1, 2, 3], [4, 5, 6], [7, 8, 9], ['.', 0, '◂']];
    this.route.params.subscribe(params => {
      this.id = params['id'];
      this.type = params['type'];
      switch (this.type) {
        case 'Normal':
          this.check = new Check(this.id, 0, 0, this.owner, '', CheckStatus.PASSIVE, [], Date.now(), CheckType.NORMAL, CheckNo());
          this.getCheck({ table_id: this.id }).finally(() => {
            if (this.check.status === CheckStatus.PASSIVE) {
              $('#occupationModal').modal({ backdrop: 'static', keyboard: false });
            }
          })
          break;
        case 'Fast':
          if (this.id === 'New') {
            this.check = new Check('Hızlı Satış', 0, 0, this.owner, '', CheckStatus.PASSIVE, [], Date.now(), CheckType.FAST, CheckNo());
          } else {
            this.check = new Check('Hızlı Satış', 0, 0, this.owner, '', CheckStatus.PASSIVE, [], Date.now(), CheckType.FAST, CheckNo());
            this.getCheck({ _id: this.id }).finally(() => {
              if (this.check.status === CheckStatus.PASSIVE) {
                $('#occupationModal').modal({ backdrop: 'static', keyboard: false });
              }
            })
          }
          break;
        case 'Order':
          this.check = new Check('Paket Servis', 0, 0, this.owner, '', CheckStatus.PASSIVE, [], Date.now(), CheckType.ORDER, CheckNo());
          this.getCheck({ _id: this.id }).finally(() => {
            if (this.check.status === CheckStatus.PASSIVE) {
              $('#occupationModal').modal({ backdrop: 'static', keyboard: false });
            }
          })
          break;
        default:
          break;
      }
    });
    this.settingsService.DateSettings.subscribe(res => {
      if (res) {
        this.day = res.value.day;
      }
    });
    this.settingsService.AppSettings.subscribe(res => {
      if (res) {
        const takeaway = res.value.takeaway;
        if (takeaway === 'Kapalı') {
          this.takeaway = false;
        } else {
          this.takeaway = true;
        }
      }
    });
    this.permissions = JSON.parse(localStorage['userPermissions'] || '{}');
    this.settingsService.getPrinters().subscribe(res => {
      if (res) {
        this.printers = res.value;
      }
    });
    if (localStorage.getItem('selectedFloor')) {
      this.selectedFloor = JSON.parse(localStorage['selectedFloor']);
    }
    this.tareNumber = 0;
  }

  public toggleModal(id: string, isOpen: boolean): void {
    const modal = document.getElementById(id);
    if (!modal) {
      return;
    }
    const jq = (window as any).$;
    const isE2E = localStorage.getItem('E2E_TEST') === '1';
    if (!isE2E && jq && typeof jq.fn?.modal === 'function') {
      jq(modal).modal(isOpen ? 'show' : 'hide');
      return;
    }
    if (isOpen) {
      modal.classList.add('show');
      modal.classList.add('in');
      modal.classList.add('d-block');
      modal.style.setProperty('display', 'block', 'important');
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
      modal.removeAttribute('aria-hidden');
      document.body.classList.add('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (!backdrop) {
        const backdropEl = document.createElement('div');
        backdropEl.className = 'modal-backdrop show';
        document.body.appendChild(backdropEl);
      }
    } else {
      modal.classList.remove('show');
      modal.classList.remove('in');
      modal.classList.remove('d-block');
      modal.style.setProperty('display', 'none', 'important');
      modal.style.visibility = 'hidden';
      modal.style.opacity = '0';
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    }
  }

  openSplitTable(isProductChange: boolean): void {
    this.onProductChange = isProductChange;
    this.toggleModal('splitTable', true);
  }

  closeSplitTable(): void {
    this.toggleModal('splitTable', false);
  }

  ngOnInit() {
    this.fillData();
    this.changes = this.mainService.LocalDB['checks'].changes({ since: 'now', live: true }).on('change', (change) => {
      if (change.id === this.check_id) {
        if (!change.deleted) {
          this.mainService.getData('checks', change.id).then(res => {
            if (res) {
              this.check = res;
              this.id = res.table_id;
              this.resolveCheckDetails();
              if (this.check.status === CheckStatus.PROCESSING) {
                this.router.navigate(['/store']);
              }
            }
          });
        } else {
          this.router.navigate(['/store']);
        }
      }
    });
    // setTimeout(() => {
    //   if (this.check.status == CheckStatus.PASSIVE) {
    //     $('#occupationModal').modal({backdrop:'static',keyboard:false});
    //   }
    // }, 500)

    this.zone.run(() => {
      if (typeof $ !== 'undefined') {
        const unsub = () => this.scalerListener.unsubscribe();
        $('#productSpecs').on('hide.bs.modal', function (event) {
          unsub();
        });
        const setdefquntity = () => this.selectedQuantity = 1;
        $('#specsModal').on('hide.bs.modal', function (event) {
          setdefquntity();
        });
        const blurActiveElement = () => {
          const active = document.activeElement as HTMLElement | null;
          if (active && typeof active.blur === 'function') {
            active.blur();
          }
        };
        $('#checkNote').on('hide.bs.modal', function () {
          blurActiveElement();
        });
        $('#checkNote').on('hidden.bs.modal', () => {
          blurActiveElement();
          this.keyboardService.triggerKeyboard('Close', this.checkNoteInput);
        });
        $('#noteModal').on('hide.bs.modal', function () {
          blurActiveElement();
        });
        $('#noteModal').on('hidden.bs.modal', () => {
          blurActiveElement();
          this.keyboardService.triggerKeyboard('Close', this.noteInput);
        });
        $('#checkNote').on('shown.bs.modal', () => {
          if (!this.checkNoteInput || !this.checkNoteInput.nativeElement) return;
          const input = this.checkNoteInput.nativeElement as HTMLElement;
          input.focus();
          this.keyboardService.triggerKeyboard('Open', this.checkNoteInput);
        });
      } else {
        console.warn('jQuery ($) is not defined. Modal events not attached.');
      }
    });

  }

  ngOnDestroy() {
    this.changes.cancel();
    if (this.check && this.check.type === CheckType.ORDER && this.check.status === CheckStatus.PASSIVE) {
      if (this.check.products.length === 0 && !Object.prototype.hasOwnProperty.call(this.check, 'payment_flow')) {
        this.mainService.removeData('checks', this.check._id);
      }
    }
  }

  checkTotal(): number {
    return this.check.products
      .filter((obj) => obj.status !== 3)
      .map((obj) => obj.price)
      .reduce((a, b) => a + b, 0);
  }

  goPayment() {
    if (this.check.type === CheckType.FAST) {
      if (this.check.status === CheckStatus.PASSIVE || !this.check_id) {
        this.updateUserReport();
        this.updateProductReport(this.countData);
        this.check.products.map(obj => obj.status = 2);
        this.check.status = CheckStatus.OCCUPIED;
        this.mainService.addData('checks', this.check).then(res => {
          if (res.ok) {
            this.check_id = res.id;
            this.router.navigate(['/payment', res.id]);
          }
        });
      } else {
        this.router.navigate(['/payment', this.check_id]);
      }
    } else {
      this.router.navigate(['/payment', this.check_id]);
    }
  }

  getCheck(filter: any) {
    if (this.type !== 'Order') {
      return this.mainService.getAllBy('checks', filter).then((result) => {
        if (result.docs.length > 0) {
          this.check = result.docs[0];
          this.check_id = result.docs[0]._id;
          this.resolveCheckDetails();
        }
      });
    } else {
      return this.mainService.getAllBy('checks', filter).then((result) => {
        if (result.docs.length > 0) {
          this.check = result.docs[0];
          this.check_id = result.docs[0]._id;
          this.resolveCheckDetails();
        }
      }).catch(err => {
        console.log('Checks', err);
      });

      // setTimeout(() => {
      //   if (this.check.status == CheckStatus.PASSIVE) {
      //     $('#occupationModal').modal({backdrop:'static',keyboard:false});
      //   }
      // }, 500)
      // this.mainService.getAllBy('closed_checks', filter).then((result) => {
      //   if (result.docs.length > 0) {
      //     this.check = result.docs[0];
      //     this.check_id = result.docs[0]._id;
      //     this.check.occupation = { male: 0, female: 0 };
      //   }
      // }).catch(err => {
      //   console.log('Closed Checks', err);
      // });
    }
  }


  tareScaler() {
    this.tareNumber = this.numpad;
  }

  addToCheck(product: Product) {
    if (localStorage.getItem('E2E_TEST') === '1' && this.check?.status === CheckStatus.PASSIVE) {
      this.check.status = CheckStatus.OCCUPIED;
      $('#occupationModal').modal('hide');
    }
    if (product.type === ProductType.MANUEL) {
      this.isFirstTime = true;
      this.productWithSpecs = product;
      this.mainService.getAllBy('recipes', { product_id: product._id }).then(res => {
        this.productStock = res.docs[0].recipe[0];
        this.resolveStockUnit(this.productStock.stock_id);
        this.numpad = this.productStock.amount;
        this.scalerListener = this.scalerService.listenScalerEvent().subscribe((weight: number) => {
          if (weight && weight !== 0) {
            this.numpad = weight * this.productStock.amount;
            if (this.tareNumber !== 0) {
              this.numpad = this.numpad - this.tareNumber;
            }

          }
        })
      });
      $('#productSpecs').modal('show');
    } else {
      this.productFilterInput.nativeElement.value = '';
      const newProduct = new CheckProduct(product._id, product.cat_id, product.name, product.price, '', 1,
        this.ownerId, Date.now(), product.tax_value, product.barcode);
      if (![0.5, 1.5].includes(this.selectedQuantity)) {
        for (let index = 0; index < this.selectedQuantity; index++) {
          this.countProductsData(product._id, product.price);
          this.check.total_price = this.check.total_price + product.price;
          this.check.products.push(newProduct);
          this.newOrders.push(newProduct);
        }
      } else {
        this.countProductsData(product._id, (product.price * this.selectedQuantity), this.selectedQuantity);
        this.check.total_price = this.check.total_price + (product.price * this.selectedQuantity);
        newProduct.price = (product.price * this.selectedQuantity);
        newProduct.name = newProduct.name + ' ' + this.selectedQuantity + ' Porsiyon'
        this.check.products.push(newProduct);
        this.newOrders.push(newProduct);
      }

      this.selectedIndex = this.check.products.length - 1;
      this.selectedProduct = this.check.products[this.selectedIndex];
      if (localStorage.getItem('E2E_TEST') === '1') {
        this.check.products = [...this.check.products];
      }
      try {
        this.readyNotes = product.notes.split(',');
      } catch (error) {
        this.readyNotes = [];
      }
      if (product.specifies.length > 0) {
        // this.selectedIndex = this.check.products.length - 1;
        // this.selectedProduct = this.check.products[this.selectedIndex];
        this.getSpecies(newProduct);
        $('#specsModal').modal({ backdrop: 'static', keyboard: false });
      } else {
        this.selectedQuantity = 1;
      }
    }
    setTimeout(() => {
      $('#check-products').scrollTop(999999);
    }, 200)
    // this.selectedQuantity = 1;
  }

  numpadToCheck() {
    const newAmount = (this.numpad * this.productWithSpecs.price) / this.productStock.amount;
    const newNote = `${this.numpad} ${this.productUnit.nativeElement.innerHTML}`;
    const newProduct = new CheckProduct(this.productWithSpecs._id, this.productWithSpecs.cat_id,
      this.productWithSpecs.name, newAmount, newNote, 1, this.owner, Date.now(),
      this.productWithSpecs.tax_value, this.productWithSpecs.barcode);
    this.check.total_price = this.check.total_price + newProduct.price;
    const countFor = newAmount / this.productWithSpecs.price;
    if (this.productUnit.nativeElement.innerHTML === 'Adet') {
      for (let index = 0; index < countFor; index++) {
        const repeatingProducts = new CheckProduct(this.productWithSpecs._id, this.productWithSpecs.cat_id,
          this.productWithSpecs.name, this.productWithSpecs.price, '', 1, this.owner,
          Date.now(), this.productWithSpecs.tax_value, this.productWithSpecs.barcode);
        this.check.products.push(repeatingProducts);
        this.newOrders.push(repeatingProducts);
      }
    } else {
      this.check.products.push(newProduct);
      this.newOrders.push(newProduct);
    }
    this.countProductsData(this.productWithSpecs._id, newAmount, countFor);
    this.tareNumber = 0;
    this.numpad = 0;
    $('#productSpecs').modal('hide');
  }

  pushKey(key: any) {
    if (key === '◂') {
      this.numpad = '';
    } else {
      if (this.isFirstTime) {
        this.numpad = '';
        this.isFirstTime = false;
      }
      this.numpad += key;
    }
  }

  confirmCheck() {
    this.router.navigate(['/store']);
    const timestamp = Date.now();
    this.check.products.map(element => {
      if (element.status === 1) {
        element.status = 2;
        element.timestamp = timestamp;
      }
    });
    if (this.check.status !== CheckStatus.PASSIVE) {
      if (this.check.type === CheckType.NORMAL) {
        this.mainService.updateData('tables', this.id, { status: 2 });
      }
      this.mainService.updateData('checks', this.check_id, this.check).then(resUpdate => {
        if (resUpdate.ok) {
          const newOrder = new Order(this.check._id, { id: this.ownerId, name: this.owner + ' ( Personel )' }, [],
            OrderStatus.APPROVED, OrderType.EMPLOOYEE, timestamp);
          this.newOrders.forEach(order => {
            const orderItem: OrderItem = {
              name: order.name,
              price: order.price,
              note: order.note,
              product_id: order.id
            };
            newOrder.items.push(orderItem);
          });
          this.mainService.addData('orders', newOrder).then(resAddOrder => {
            const pricesTotal = this.newOrders.map(obj => obj.price).reduce((a, b) => a + b);
            if (this.check.type === CheckType.NORMAL) {
              this.logService.createLog(logType.CHECK_UPDATED, this.check._id,
                `${this.table.name} hesabına ${pricesTotal} TL tutarında sipariş eklendi.`);
            } else {
              this.logService.createLog(logType.CHECK_UPDATED, this.check._id,
                `${this.check.note} hesabına ${pricesTotal} TL tutarında sipariş eklendi.`);
            }
          }).catch(err => {
            console.log(err);
          });
        }
      });
    } else {
      this.check.status = CheckStatus.READY;
      if (this.check.type === CheckType.NORMAL) {
        this.mainService.updateData('tables', this.id, { status: 2, timestamp: Date.now() });
      }
      this.mainService.addData('checks', this.check).then(resAdd => {
        if (resAdd.ok) {
          const newOrder = new Order(resAdd.id, { id: this.ownerId, name: this.owner + ' ( Personel )' }, [],
            OrderStatus.APPROVED, OrderType.EMPLOOYEE, timestamp);
          this.newOrders.forEach(order => {
            const orderItem: OrderItem = {
              name: order.name,
              price: order.price,
              note: order.note,
              product_id: order.id
            };
            newOrder.items.push(orderItem);
          });
          this.mainService.addData('orders', newOrder).then(resAddOrder => {
            if (this.check.type === CheckType.NORMAL) {
              this.logService.createLog(logType.CHECK_CREATED, resAdd.id,
                `${this.table.name} Masasına '${this.owner}' tarafından hesap açıldı`);
            } else {
              this.logService.createLog(logType.CHECK_CREATED, resAdd.id,
                `${this.check.note} Notlu Hızlı Hesap '${this.owner}' tarafından açıldı`);
            }
          }).catch(err => {
            console.log(err);
          });
        }
      });
    }
    this.updateUserReport();
    this.updateProductReport(this.countData);
  }

  sendCheck() {
    switch (this.check.type) {
      case CheckType.NORMAL:
        if (this.askForPrint) {
          this.message.sendConfirm('Fiş Yazdırılsın mı ?').then(isOk => {
            if (isOk) {
              this.printOrder();
              this.confirmCheck();
            } else {
              this.confirmCheck();
            }
          });
        } else {
          this.printOrder();
          this.confirmCheck();
        }
        break;
      case CheckType.FAST:
        if (this.check.note === '' || this.check.note === undefined) {
          this.message.sendConfirm('Hızlı Hesap oluşturmanız için hesaba not eklemek zorundasınız.').then(isOk => {
            if (isOk) {
              $('#checkNote').modal('show');
              return false;
            } else {
              return false;
            }
          })
        } else {
          if (this.askForPrint) {
            this.message.sendConfirm('Fiş Yazdırılsın mı ?').then(isOk => {
              if (isOk) {
                this.printOrder();
                this.confirmCheck();
              } else {
                this.confirmCheck();
              }
            });
          } else {
            this.printOrder();
            this.confirmCheck();
          }
        }
        break;
      case CheckType.ORDER:
        this.check.products.map(element => {
          if (element.status === 1) {
            element.status = 2;
          }
        });
        if (this.check.status === CheckStatus.PASSIVE) {
          this.check.status = CheckStatus.READY;
          this.mainService.updateData('checks', this.check._id, this.check).then(resUpdate => {
            if (resUpdate.ok) {
              const pricesTotal = this.newOrders.map(obj => obj.price).reduce((a, b) => a + b);
              this.logService.createLog(logType.CHECK_UPDATED, this.check._id,
                `${this.check.note} hesabına ${pricesTotal} TL tutarında sipariş eklendi.`);
            }
          });
        } else {
          this.mainService.updateData('closed_checks', this.check_id, this.check).then(res => {
            if (res.ok) {
              this.logService.createLog(logType.CHECK_UPDATED, this.check._id, `${this.check.note} hesabı ${this.owner} tarafından güncellendi.`);
            }
          });
        }
        this.router.navigate(['/store']);
        this.updateUserReport();
        this.updateProductReport(this.countData);
        break;
    }
  }

  endCheck() {
    this.message.sendConfirm('Dikkat! Hesap Kapatılacak.').then(isOK => {
      if (isOK) {
    const checkWillClose = new ClosedCheck(this.check.table_id, (this.check.total_price + this.check.discount) - 0, 0,
      this.check.owner, this.check.note, CheckStatus.OCCUPIED, this.check.products, this.check.timestamp,
      this.check.type, 'Parçalı', this.check.payment_flow, null, this.check.occupation);
    this.mainService.addData('closed_checks', checkWillClose).then(res => {
      this.updateSellingReport('Parçalı');
    });
    if (this.check._id !== undefined) {
      this.mainService.removeData('checks', this.check._id);
      this.mainService.updateData('tables', this.check.table_id, { status: 1 });
      this.updateTableReport(this.check);
    }
    this.router.navigate(['/store']);
  }
});
}

closeCheck(method: string) {
if (method === 'Nakit') {
  this.printerService.kickCashdraw(this.printers[0]);
}
let total_discounts = 0;
let general_discount = 0;
if (this.check.payment_flow) {
  let lastAmount = 0;
  const lastProducts = this.check.products.filter(obj => obj.status === 2);
  lastProducts.forEach(product => {
    lastAmount += product.price;
  });
  if (this.check.discountPercent) {
    general_discount = (this.check.total_price * this.check.discountPercent) / 100;
  }
  const lastPayment = new PaymentStatus(this.owner, method, lastAmount - general_discount, general_discount, Date.now(), lastProducts);
  this.check.payment_flow.push(lastPayment);
  this.check.products = [];
  method = 'Parçalı';
  total_discounts = this.check.payment_flow.map(obj => obj.discount).reduce((a, b) => a + b);
} else {
  if (this.check.discountPercent) {
    general_discount = (this.check.total_price * this.check.discountPercent) / 100;
    total_discounts += general_discount;
  }
}
$('#closeCheck').modal('hide');
const checkWillClose = new ClosedCheck(this.check.table_id, (this.check.total_price + this.check.discount) - general_discount,
  total_discounts, this.check.owner, this.check.note, CheckStatus.OCCUPIED, this.check.products, this.check.timestamp,
  this.check.type, method, this.check.payment_flow, null, this.check.occupation);
if (this.check.type === CheckType.ORDER) {
  checkWillClose.products.map(obj => obj.status = 2);
  checkWillClose.status = 2;
}
this.mainService.addData('closed_checks', checkWillClose).then(res => {
  this.updateSellingReport(method);
});
    if (this.check._id !== undefined) {
      this.mainService.removeData('checks', this.check._id);
    }
    if (this.check.type === CheckType.NORMAL || this.check.type === CheckType.ORDER) {
      if (this.check.type === CheckType.ORDER) {
        this.updateProductReport(this.countData);
      } else {
        this.mainService.updateData('tables', this.check.table_id, { status: 1 });
        this.updateTableReport(this.check);
      }
      this.router.navigate(['/store']);
    } else {
      this.updateUserReport();
      this.updateProductReport(this.countData);
      if (this.takeaway) {
        this.router.navigate(['/store']);
      } else {
        this.router.navigate(['/store']);
      }
    }
    if (this.check.type === CheckType.FAST) {
      this.logService.createLog(logType.CHECK_CLOSED, this.ownerId,
        `${this.owner} tarafından ${this.check.table_id} Hesabı ${this.check.total_price} TL ${method} ödeme alınarak kapatıldı.`);
    } else if (this.check.type === CheckType.NORMAL) {
      this.logService.createLog(logType.CHECK_CLOSED, this.check._id,
        `${this.owner} tarafından ${this.table.name} Masası ${this.check.total_price} TL '${method}' ödeme alınarak kapatıldı.`);
    } else {
      this.logService.createLog(logType.CHECK_CLOSED, this.check._id,
        `${this.owner} tarafından Paket Servis- ${this.check.note} hesabı ${this.check.total_price} TL '${method}' ödeme alınarak kapatıldı.`);
    }
    if (this.askForCheckPrint) {
      this.message.sendConfirm('Fiş Yazdırılsın mı ?').then(isOK => {
        if (isOK) {
          if (this.check.type === CheckType.NORMAL) {
            this.printerService.printCheck(this.printers[0], this.table.name, checkWillClose);
          } else {
            this.printerService.printCheck(this.printers[0], this.check.table_id, checkWillClose);
          }
        }
      });
    } else {
      if (this.check.type === CheckType.NORMAL) {
        this.printerService.printCheck(this.printers[0], this.table.name, checkWillClose);
      } else {
        this.printerService.printCheck(this.printers[0], this.check.table_id, checkWillClose);
      }
    }
    this.message.sendMessage(`Hesap ${this.check.total_price} TL tutarında ödeme alınarak kapatıldı`);
  }

  updateSellingReport(method: string) {
    let general_discount = 0;
    if (this.check.discountPercent) {
      general_discount = (this.check.total_price * this.check.discountPercent) / 100;
    }
    if (method !== 'Parçalı') {
      this.mainService.getAllBy('reports', { connection_id: method }).then(res => {
        if (res.docs.length > 0) {
          const doc = res.docs[0];
          doc.count++;
          doc.amount += (this.check.total_price + this.check.discount) - general_discount;
          doc.weekly[this.day] += (this.check.total_price + this.check.discount) - general_discount;
          doc.weekly_count[this.day]++;
          doc.monthly[new Date().getMonth()] += (this.check.total_price + this.check.discount) - general_discount;
          doc.monthly_count[new Date().getMonth()]++;
          doc.timestamp = Date.now();
          this.mainService.updateData('reports', doc._id, doc);
        }
      });
    } else {
      this.mainService.getAllBy('reports', { type: 'Store' }).then(res => {
        const sellingReports = res.docs;
        this.check.payment_flow.forEach((obj, index) => {
          const reportWillChange = sellingReports.find(report => report.connection_id === obj.method);
          reportWillChange.count++;
          reportWillChange.amount += obj.amount;
          reportWillChange.weekly[this.day] += obj.amount;
          reportWillChange.weekly_count[this.day]++;
          reportWillChange.monthly[new Date().getMonth()] += obj.amount;
          reportWillChange.monthly_count[new Date().getMonth()]++;
          reportWillChange.timestamp = Date.now();
          if (this.check.payment_flow.length === index + 1) {
            sellingReports.forEach((report) => {
              if (this.check.payment_flow.some(pObj => pObj.method === report.connection_id)) {
                this.mainService.updateData('reports', report._id, report);
              }
            });
          }
        });
      });
    }
  }

  updateTableReport(check: Check) {
    this.mainService.getAllBy('reports', { connection_id: check.table_id }).then(res => {
      const report = res.docs[0];
      report.count++;
      report.amount += this.check.total_price + this.check.discount;
      report.timestamp = Date.now();
      report.weekly[this.day] += this.check.total_price + this.check.discount;
      report.weekly_count[this.day]++;
      report.monthly[new Date().getMonth()] += this.check.total_price + this.check.discount;
      report.monthly_count[new Date().getMonth()]++;
      this.mainService.updateData('reports', report._id, report);
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

  checkItems(): Array<any> {
    if (this.check.products.length > 0) {
      const viewArray: Array<any> = [];
      this.check.products.forEach((item) => {
        const existingIndex = viewArray.findIndex(
          (obj) =>
            obj.name === item.name &&
            obj.id === item.id &&
            obj.status === item.status &&
            obj.note === item.note &&
            obj.timeout === item.timeout
        );

        if (existingIndex !== -1) {
          viewArray[existingIndex].quantity++;
        } else {
          const viewItem: any = {
            id: item.id,
            name: item.name,
            note: item.note,
            quantity: 1,
            price: item.price,
            status: item.status,
          };
          if (item.timeout) {
            viewItem.timeout = item.timeout;
          }
          viewArray.push(viewItem);
        }
      });
      return viewArray.sort((a, b) => {
        if (a.status > b.status) {
          return -1;
        } else if (a.status < b.status) {
          return 1;
        } else {
          return b.quantity - a.quantity;
        }
      });
    } else {
      return [];
    }
  }

  toggleProduct(): void {
    this.isCollapsedView = !this.isCollapsedView;
  }

  selectProduct(index) {
    if (this.selectedIndex === index) {
      this.selectedIndex = undefined;
      this.selectedProduct = undefined;
    } else {
      this.selectedProduct = this.check.products[index];
      this.selectedIndex = index;
      try {
        this.readyNotes = this.products.find(obj => obj._id === this.selectedProduct.id).notes.split(',');
      } catch (error) {
        this.readyNotes = [];
      }
    }
  }

  getSpecies(product) {
    this.productSpecs = this.products.find(obj => obj._id === product.id).specifies;
  }


  recalculateTotal() {
    this.check.total_price = this.check.products.filter(obj => obj.status !== 3).map(obj => obj.price).reduce((a, b) => a + b, 0);
  }

  changeSpecs(spec) {
    const oldPrice = this.selectedProduct.price;
    if (![0.5, 1.5].includes(this.selectedQuantity)) {
      this.selectedProduct.name = this.selectedProduct.name + ' ' + spec.spec_name;
      this.selectedProduct.price = spec.spec_price;
    } else {
      this.selectedProduct.name = this.selectedProduct.name + ' ' + spec.spec_name;
      this.selectedProduct.price = (spec.spec_price * this.selectedQuantity);
    }
    this.recalculateTotal();
    $('#specsModal').modal('hide');
  }

  addNote(form: NgForm) {
    if (this.selectedProduct !== undefined) {
      const note = form.value.description;
      if (note === '' || note === null || note === ' ') {
        this.message.sendMessage('Not Alanı Boş Bırakılamaz');
      } else {
        this.check.products[this.selectedIndex].note = note;
        form.reset();
        $('#noteModal').modal('hide');
      }
    }
  }

  addReadyNotes(note: string) {
    // this.check.products[this.selectedIndex].note += note + ', ';
    this.noteInput.nativeElement.value += note + ', ';
    this.noteInput.nativeElement.dispatchEvent(new Event('input'));
  }

  makeGift() {
    if (this.selectedProduct !== undefined) {
      this.check.products[this.selectedIndex].name += ' (İkram)';
      this.check.total_price -= this.check.products[this.selectedIndex].price;
      this.check.products[this.selectedIndex].price = 0;
      $('#noteModal').modal('hide');
    }
  }

  dontGive() {
    if (this.selectedProduct !== undefined) {
      this.check.products[this.selectedIndex].note = 'Verme';
      $('#noteModal').modal('hide');
    }
  }

  addCheckNote(form: NgForm) {
    const note = form.value.description;
    if (note === '' || note === null || note === ' ') {
      this.message.sendMessage('Not Alanı Boş Bırakılamaz!');
    } else {
      this.check.note = note;
      if (this.check.status !== CheckStatus.PASSIVE) {
        this.mainService.updateData('checks', this.check_id, { note: note }).then(res => {
          this.check._rev = res.rev;
        });
      }
      form.reset();
      $('#checkNote').modal('hide');
    }
  }

  cancelProduct(reason: string) {
    if (this.selectedProduct !== undefined) {
      const tableDisplayName = (this.table && this.table.name) ? this.table.name : (this.tableName || this.check.table_id || '');
      this.check.products[this.selectedIndex].status = 3;
      this.check.products[this.selectedIndex].note = reason;
      this.check.products[this.selectedIndex].owner = this.owner;
      this.check.products[this.selectedIndex].timestamp = Date.now();
      this.check.total_price -= this.selectedProduct.price;
      const productAfterCancel = this.check.products.filter(obj => obj.status === 1);
      this.check.products = this.check.products.filter(obj => obj.status !== 1);
      const analizeCheck = this.check.products.some(obj => obj.status !== 3);
      if (analizeCheck) {
        this.mainService.updateData(this.check.type === CheckType.ORDER ? 'closed_checks' : 'checks', this.check_id, this.check)
          .then((resUpdate) => {
            if (resUpdate.ok) {
              if (this.check.type === CheckType.NORMAL) {
                const pCat = this.categories.find(obj => obj._id === this.check.products[this.selectedIndex].cat_id);
                const device = this.printers.find(pObj => pObj.name === pCat.printer);
                this.printerService.printCancel(device, this.check.products[this.selectedIndex], reason, tableDisplayName, this.owner);
                this.logService.createLog(logType.ORDER_CANCELED, this.check._id,
                  `${tableDisplayName} Masasından ${this.selectedProduct.name} adlı ürün iptal edildi Açıklama:'${reason}'`);
              } else {
                this.logService.createLog(logType.ORDER_CANCELED, this.check._id,
                  `${this.check.note} Hesabından ${this.selectedProduct.name} adlı ürün iptal edildi Açıklama:'${reason}'`);
              }
              this.check._rev = resUpdate.rev;
              this.message.sendMessage('Ürün İptal Edildi');
              this.selectedProduct = undefined;
              this.selectedIndex = undefined;
              $('#cancelProduct').modal('hide');
              productAfterCancel.forEach(element => {
                this.check.products.push(element);
              });
            }
          });
      } else {
        $('#cancelProduct').modal('hide');
        const canceledTotalPrice = this.check.products.map(obj => obj.price).reduce((a, b) => a + b);
        const checkToCancel = new ClosedCheck(this.check.table_id, canceledTotalPrice, 0, this.owner,
          this.check.note, 3, this.check.products, Date.now(), 3, 'İkram', [], null, this.check.occupation);
        checkToCancel.description = 'Bütün Ürünler İptal Edildi';
        this.mainService.addData('closed_checks', checkToCancel).then(resAdd => {
          this.message.sendMessage('Hesap İptal Edildi');
          this.logService.createLog(logType.CHECK_CANCELED, this.check._id,
            `${tableDisplayName}'de kalan bütün ürünler iptal edildi. Hesap Kapatıldı.`);
        });
      if (this.check.payment_flow) {
        let payedDiscounts = 0;
        this.mainService.getAllBy('reports', { type: 'Store' }).then(resReports => {
          const sellingReports = resReports.docs;
          this.check.payment_flow.forEach((objFlow, indexFlow) => {
            payedDiscounts += objFlow.discount;
            const reportWillChange = sellingReports.find(report => report.connection_id === objFlow.method);
            reportWillChange.count++;
            reportWillChange.amount += objFlow.amount;
            reportWillChange.weekly[this.day] += objFlow.amount;
            reportWillChange.weekly_count[this.day]++;
            reportWillChange.monthly[new Date().getMonth()] += objFlow.amount;
            reportWillChange.monthly_count[new Date().getMonth()]++;
            reportWillChange.timestamp = Date.now();
            if (this.check.payment_flow.length === indexFlow + 1) {
              sellingReports.forEach((reportSync) => {
                if (this.check.payment_flow.some(objSync => objSync.method === reportSync.connection_id)) {
                  this.mainService.updateData('reports', reportSync._id, reportSync);
                }
              });
            }
          });
        });
        const checksForPayed = new ClosedCheck(this.check.table_id, this.check.discount, payedDiscounts,
          this.owner, this.check.note, this.check.status, [], Date.now(), this.check.type, 'Parçalı',
          this.check.payment_flow, null, this.check.occupation);
        this.mainService.addData('closed_checks', checksForPayed);
      }
      this.mainService.removeData('checks', this.check._id);
      if (this.check.type === CheckType.NORMAL) {
        this.mainService.updateData('tables', this.check.table_id, { status: 1 });
      }
      this.router.navigate(['/store']);
    }
  }
} // End cancelProduct

  //// 28900848 Protocol DAD
  //// CODENAME:BELALIM

  undoChanges() {
    if (this.selectedProduct) {
      if (this.selectedProduct.status === ProductStatus.ACTIVE) {
        const newIndex = this.newOrders.indexOf(this.check.products[this.selectedIndex]);
        this.decountProductsData(this.check.products[this.selectedIndex]);
        this.check.total_price = this.check.total_price - this.check.products[this.selectedIndex].price;
        this.check.products.splice(this.selectedIndex, 1);
        this.newOrders.splice(newIndex, 1);
        this.selectedIndex = undefined;
        this.selectedProduct = undefined;
      } else {
        return false;
      }
    } else {
      this.newOrders.pop();
      const count = this.check.products.length;
      if (count > 0) {
        if (this.check.products[count - 1].status !== 2) {
          this.selectedIndex = undefined;
          this.selectedProduct = undefined;
          const lastItem = this.check.products.pop();
          this.decountProductsData(lastItem);
          this.check.total_price = this.check.total_price - lastItem.price;
        } else {
          return false;
        }
      }
    }
  }

  decountProductsData(deProduct: CheckProduct) {
    const contains = this.countData.some(obj => obj.product === deProduct.id);
    if (contains) {
      const index = this.countData.findIndex(p_id => p_id.product === deProduct.id);
      this.countData[index].count--;
      this.countData[index].total -= deProduct.price;
      if (this.countData[index].count === 0) {
        this.countData = this.countData.filter(obj => obj.product !== deProduct.id);
      }
    }
  }

  countProductsData(id: string, price: number, manuelCount?: number) {
    let countObj;
    if (manuelCount) {
      countObj = { product: id, count: manuelCount, total: price };
    } else {
      countObj = { product: id, count: 1, total: price };
    }
    const contains = this.countData.some(obj => obj.product === id);
    if (contains) {
      const index = this.countData.findIndex(p_id => p_id.product === id);
      if (manuelCount) {
        this.countData[index].count += manuelCount;
      } else {
        this.countData[index].count++;
      }
      this.countData[index].total += price;
    } else {
      this.countData.push(countObj);
    }
  }

  updateUserReport() {
    if (this.newOrders.length > 0) {
      const pricesTotal = this.newOrders.map(obj => obj.price).reduce((a, b) => a + b);
      if (this.check.type === CheckType.NORMAL) {
        this.logService.createLog(logType.ORDER_CREATED, this.check._id,
          `'${this.owner}' ${this.table.name} masasına ${pricesTotal} TL tutarında sipariş girdi.`);
      } else {
        this.logService.createLog(logType.ORDER_CREATED, this.check._id,
          `'${this.owner}' Hızlı Satış - ${this.check.note} hesabına ${pricesTotal} TL tutarında sipariş girdi.`);
      }
      this.mainService.getAllBy('reports', { connection_id: this.ownerId }).then(async (resUser) => {
        const monthIndex = new Date().getMonth();
        if (!resUser.docs || resUser.docs.length === 0) {
          const userDoc = await this.mainService.getData('users', this.ownerId);
          const reportName = userDoc?.name || this.owner;
          const template = await this.getReportTemplate('User');
          this.ensureReportArrays(template, this.day, monthIndex);
          template.amount = pricesTotal;
          template.count = 1;
          template.weekly[this.day] += pricesTotal;
          template.weekly_count[this.day] += 1;
          template.monthly[monthIndex] += pricesTotal;
          template.monthly_count[monthIndex] += 1;
          template.description = reportName;
          template.connection_id = this.ownerId;
          template.timestamp = Date.now();
          await this.mainService.addData('reports', template);
          return;
        }
        const docUser = resUser.docs[0];
        this.ensureReportArrays(docUser, this.day, monthIndex);
        docUser.amount += pricesTotal;
        docUser.count++;
        docUser.weekly[this.day] += pricesTotal;
        docUser.weekly_count[this.day]++;
        docUser.monthly[monthIndex] += pricesTotal;
        docUser.monthly_count[monthIndex]++;
        if (docUser.weekly_count[this.day] === 100) {
          this.logService.createLog(logType.USER_CHECKPOINT, this.ownerId, `'${this.owner}' günün 100. siparişini girdi.`);
        }
        docUser.timestamp = Date.now();
        this.mainService.updateData('reports', docUser._id, docUser).then();
      });
    }
  }

  updateProductReport(data) {
    data.forEach((obj, index) => {
      this.mainService.getAllBy('reports', { connection_id: obj.product }).then(async (resProd) => {
        const monthIndex = new Date().getMonth();
        if (!resProd.docs || resProd.docs.length === 0) {
          const productDoc = await this.mainService.getData('products', obj.product);
          const reportName = productDoc?.name || obj.product;
          const template = await this.getReportTemplate('Product');
          this.ensureReportArrays(template, this.day, monthIndex);
          template.amount = obj.total;
          template.count = obj.count;
          template.weekly[this.day] += obj.total;
          template.weekly_count[this.day] += obj.count;
          template.monthly[monthIndex] += obj.total;
          template.monthly_count[monthIndex] += 1;
          template.description = reportName;
          template.connection_id = obj.product;
          template.timestamp = Date.now();
          await this.mainService.addData('reports', template);
          return;
        }
        const reportProd = resProd.docs[0];
        this.mainService.changeData('reports', reportProd._id, (docProd) => {
          this.ensureReportArrays(docProd, this.day, monthIndex);
          docProd.count += obj.count;
          docProd.amount += obj.total;
          docProd.timestamp = Date.now();
          docProd.weekly[this.day] += obj.total;
          docProd.weekly_count[this.day] += obj.count;
          docProd.monthly[monthIndex] += obj.total;
          docProd.monthly_count[monthIndex] += 1;
          return docProd;
        });
      });
      this.mainService.getAllBy('recipes', { product_id: obj.product }).then(result => {
        if (result.docs.length > 0) {
          const pRecipe: Array<Ingredient> = result.docs[0].recipe;
          pRecipe.forEach(stock => {
            const downStock = stock.amount * obj.count;
            this.mainService.changeData('stocks', stock.stock_id, (docStock) => {
              docStock.left_total -= downStock;
              docStock.quantity = docStock.left_total / docStock.total;
              if (docStock.left_total < docStock.warning_limit) {
                if (docStock.db_name) {
                  if (docStock.left_total <= 0) {
                    this.logService.createLog(logType.STOCK_CHECKPOINT, docStock._id, `${docStock.name} adlı stok tükendi!`);
                  } else {
                    this.logService.createLog(logType.STOCK_CHECKPOINT, docStock._id,
                      `${docStock.name} adlı stok bitmek üzere! - Kalan: '${docStock.left_total + ' ' + docStock.unit}'`);
                  }
                }
              }
              return docStock;
            });
          });
        }
      });
    });
  }

  private async getReportTemplate(type: 'User' | 'Product'): Promise<any> {
    const res = await this.mainService.getAllBy('reports', { type });
    const sample = res.docs && res.docs.length > 0 ? res.docs[0] : null;
    const weeklyLen = Array.isArray(sample?.weekly) ? sample.weekly.length : 7;
    const weeklyCountLen = Array.isArray(sample?.weekly_count) ? sample.weekly_count.length : weeklyLen;
    const monthlyLen = Array.isArray(sample?.monthly) ? sample.monthly.length : 12;
    const monthlyCountLen = Array.isArray(sample?.monthly_count) ? sample.monthly_count.length : monthlyLen;
    return {
      type,
      connection_id: '',
      count: 0,
      amount: 0,
      profit: 0,
      weekly: new Array(weeklyLen).fill(0),
      weekly_count: new Array(weeklyCountLen).fill(0),
      monthly: new Array(monthlyLen).fill(0),
      monthly_count: new Array(monthlyCountLen).fill(0),
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      description: '',
      timestamp: Date.now()
    };
  }

  private ensureReportArrays(report: any, dayIndex: number, monthIndex: number): void {
    const ensureLength = (arr: Array<number>, index: number) => {
      while (arr.length <= index) {
        arr.push(0);
      }
    };
    report.weekly = Array.isArray(report.weekly) ? report.weekly : [];
    report.weekly_count = Array.isArray(report.weekly_count) ? report.weekly_count : [];
    report.monthly = Array.isArray(report.monthly) ? report.monthly : [];
    report.monthly_count = Array.isArray(report.monthly_count) ? report.monthly_count : [];
    ensureLength(report.weekly, dayIndex);
    ensureLength(report.weekly_count, dayIndex);
    ensureLength(report.monthly, monthIndex);
    ensureLength(report.monthly_count, monthIndex);
  }

  blurActiveElement(): void {
    const active = document.activeElement as HTMLElement | null;
    if (active && typeof active.blur === 'function') {
      active.blur();
    }
  }

  qrCode(printer) {
    $('#qrPrintersModal').modal('hide');
    if (!printer) {
      printer = this.printers[0];
    }
    const slug = localStorage.getItem('Slug');
    console.log(this.check);
    if (this.check._id !== undefined) {
      const qrdata = `https://quickly.cafe/${slug}/${this.check._id}`;
      this.printerService.printQRCode(printer, qrdata, this.table.name, this.owner);
    } else {
      this.check.status = CheckStatus.OCCUPIED;
      // this.check.type = CheckType.SELF;
      if (this.check.products.some(obj => obj.status === 1)) {
        this.check.products = this.check.products.filter(obj => obj.status !== 1);
        this.mainService.addData('checks', this.check).then(resAddCheck => {
          this.mainService.updateData('tables', this.table._id, { status: 2, timestamp: Date.now() }).then(() => {
            console.log(this.check._id);
            setTimeout(() => {
              const qrdata = `https://quickly.cafe/${slug}/${this.check._id}`;
              this.printerService.printQRCode(printer, qrdata, this.table.name, this.owner);
            }, 100);
          });
        });
      } else {
        this.mainService.addData('checks', this.check).then(resAddCheckFinal => {
          this.mainService.updateData('tables', this.table._id, { status: 2, timestamp: Date.now() }).then(() => {
            console.log(this.check._id);
            setTimeout(() => {
              const qrdata = `https://quickly.cafe//${slug}/${this.check._id}`;
              this.printerService.printQRCode(printer, qrdata, this.table.name, this.owner);
            }, 100);
          });
        });
      }
    }
    this.router.navigate(['/store']);
  }

  printOrder() {
    if (this.printers.length > 0) {
      const orders = this.check.products.filter(obj => obj.status === 1);
      if (orders.length > 0) {
        const splitPrintArray = [];
        orders.forEach((objOrder, indexOrder) => {
          const catPrinter = this.categories.filter(cat => cat._id === objOrder.cat_id)[0].printer || this.printers[0].name;
          const contains = splitPrintArray.some(element => element.printer.name === catPrinter);
          if (contains) {
            const indexFound = splitPrintArray.findIndex(p_name => p_name.printer.name === catPrinter);
            splitPrintArray[indexFound].products.push(objOrder);
          } else {
            const thePrinter = this.printers.filter(pObj => pObj.name === catPrinter)[0];
            const splitPrintOrder = { printer: thePrinter, products: [objOrder] };
            splitPrintArray.push(splitPrintOrder);
          }
          if (indexOrder === orders.length - 1) {
            let table_name;
            if (this.check.type === CheckType.FAST) {
              table_name = this.check.note;
            } else {
              table_name = this.table.name;
            }
            splitPrintArray.forEach(order => {
              this.printerService.printOrder(order.printer, table_name, order.products, this.owner);
            });
          }
        });
      }
    }
  }

  printCheck(selectedPrinter) {
    $('#printersModal').modal('hide');
    if (this.check.type === CheckType.NORMAL) {
      this.check.products = this.check.products.filter(obj => obj.status === 2);
      this.check.total_price = this.check.products.map(obj => obj.price).reduce((a, b) => a + b);
      if (this.table.status !== TableStatus.WILL_READY) {
        this.printerService.printCheck(selectedPrinter, this.table.name, this.check);
        if (this.check.status !== CheckStatus.PASSIVE) {
          if (this.check.type === CheckType.NORMAL) {
            this.mainService.updateData('tables', this.id, { status: 3 }).then(res => {
              this.router.navigate(['store']);
            });
            this.message.sendMessage('Hesap Yazdırıldı..');
          }
        }
      } else {
        this.message.sendConfirm('Adisyon Tekrar Yazdırılsın mı?').then(isOk => {
          if (isOk) {
            this.printerService.printCheck(selectedPrinter, this.table.name, this.check);
          }
        });
      }
    } else if (this.check.type === CheckType.FAST) {
      this.check.total_price = this.check.products.map(obj => obj.price).reduce((a, b) => a + b);
      this.printerService.printCheck(selectedPrinter, this.check.note, this.check);
    }
  }

  getProductsBy(id) {
    this.selectedCat = id;
    this.subCatsView = this.sub_categories.filter(obj => obj.cat_id === id);
    this.productsView = this.products.filter(obj => obj.cat_id === id);
  }

  getProductsBySubCat(id) {
    this.productsView = this.products.filter(obj => obj.subcat_id === id);
  }

  selectTable(id) {
    this.selectedTable = id;
  }

  setProductTimeout(minutes: number): void {
    if (this.selectedProduct) {
      if (minutes === 0) {
        this.selectedProduct.timeout = undefined;
      } else {
        this.selectedProduct.timeout = minutes;
      }
      this.mainService.updateData('checks', this.check_id, this.check).then(res => {
        if (res.updated) {
          this.check._rev = res.rev;
        }
      });
    }
    this.toggleModal('timeoutModal', false);
  }

  setKuver(count: number): void {
    this.mainService.getAllBy('products', { name: 'Kuver' }).then(res => {
      if (res.docs.length > 0) {
        const product = res.docs[0];
        for (let i = 0; i < count; i++) {
          this.addToCheck(product);
        }
        this.toggleModal('kuverModal', false);
      }
    });
  }

  addServiceCharge(percent: number): void {
    const serviceCharge = (this.check.total_price * percent) / 100;
    this.mainService.getAllBy('products', { name: 'Servis Ücreti' }).then(res => {
      if (res.docs.length > 0) {
        const product = res.docs[0];
        product.price = serviceCharge;
        this.addToCheck(product);
        this.toggleModal('serviceChargeModal', false);
      }
    });
  }

  changeUser(user: any): void {
    this.owner = user.name;
    this.ownerId = user._id;
    this.check.owner = user.name;
    if (this.check.status !== CheckStatus.PASSIVE) {
      this.mainService.changeData('checks', this.check_id, (doc) => {
        doc.owner = user.name;
        return doc;
      });
    }
    this.toggleModal('userModal', false);
  }

  pushKeyForPrice(key: any): void {
    if (key === '◂') {
      this.numpad = '';
    } else {
      if (this.isFirstTime) {
        this.numpad = '';
        this.isFirstTime = false;
      }
      this.numpad += key;
    }
  }

  setProductPrice(): void {
    const newPrice = parseFloat(this.numpad);
    this.selectedProduct.price = newPrice;
    this.check.total_price = this.checkTotal();
    if (this.selectedProduct.status === 2) {
      this.mainService.updateData('checks', this.check_id, this.check).catch((err) => {
        console.log(err);
      });
    }
    this.toggleModal('checkPrice', false);
  }

  splitProduct() {
    if (!this.selectedTable || !this.selectedProduct) {
      return;
    }
    if (this.selectedTable.status === TableStatus.ACTIVE) {
      this.message.sendConfirm(`${this.selectedProduct.name}, ${this.selectedTable.name} Masasına Aktarılacak ve Yeni Hesap Açılacak.`)
        .then(isOk => {
          if (isOk) {
            const newCheck = new Check(this.selectedTable._id, this.selectedProduct.price, 0, this.owner,
              '', 1, [this.selectedProduct], Date.now(), CheckType.NORMAL, CheckNo());
            this.mainService.addData('checks', newCheck).then(resAdd => {
              if (resAdd.ok) {
                this.check.products.splice(this.selectedIndex, 1);
                this.check.total_price -= this.selectedProduct.price;
                this.mainService.updateData('tables', this.selectedTable._id, { status: 2, timestamp: Date.now() }).then(resTable => {
                  if (resTable.ok) {
                    if (this.check.products.length === 0) {
                      if (this.check.payment_flow) {
                        let payedDiscounts = 0;
                        this.check.payment_flow.forEach((objFlow, indexFlow) => {
                          payedDiscounts += objFlow.discount;
                          this.mainService.getAllBy('reports', { connection_id: objFlow.method }).then(resReport => {
                            this.mainService.changeData('reports', resReport.docs[0]._id, (docReport) => {
                              docReport.count++;
                              docReport.weekly_count[this.day]++;
                              docReport.amount += objFlow.amount;
                              docReport.weekly[this.day] += objFlow.amount;
                              docReport.monthly[new Date().getMonth()] += objFlow.amount;
                              docReport.monthly_count[new Date().getMonth()]++;
                              docReport.timestamp = Date.now();
                              return docReport;
                            });
                          });
                        });
                        const checksForPayed = new ClosedCheck(this.check.table_id, this.check.discount, payedDiscounts,
                          this.owner, this.check.note, this.check.status, [], Date.now(), this.check.type,
                          'Parçalı', this.check.payment_flow, null, this.check.occupation);
                        this.mainService.addData('closed_checks', checksForPayed);
                      }
                      this.mainService.removeData('checks', this.check._id).then(resRemove => {
                        if (resRemove.ok) {
                          this.closeSplitTable();
                          this.mainService.updateData('tables', this.check.table_id, { status: 1 }).then(resUpdateTable => {
                            this.message.sendMessage(`Ürün ${this.selectedTable.name} Masasına Aktarıldı`);
                          });
                          this.router.navigate(['/store']);
                        }
                      });
                    } else {
                      this.mainService.updateData('checks', this.check._id, this.check).then(resUpdateCheck => {
                        if (resUpdateCheck.ok) {
                          this.message.sendMessage(`Ürün ${this.selectedTable.name} Masasına Aktarıldı`);
                          this.check._rev = resUpdateCheck.rev;
                          this.setDefault();
                          this.closeSplitTable();
                        }
                      });
                    }
                  }
                });
              }
            });
          }
        });
    } else {
      this.mainService.getAllBy('checks', { table_id: this.selectedTable._id }).then(resChecks => {
        const otherCheck: Check = resChecks.docs[0];
        otherCheck.products.push(this.selectedProduct);
        otherCheck.total_price += this.selectedProduct.price;
        this.check.total_price -= this.selectedProduct.price;
        this.check.products.splice(this.selectedIndex, 1);
        this.mainService.updateData('checks', otherCheck._id, otherCheck).then(resUpdateOther => {
          if (resUpdateOther.ok) {
            if (this.check.products.length === 0) {
              if (this.check.payment_flow) {
                let payedDiscounts = 0;
                this.check.payment_flow.forEach((objFlow, indexFlow) => {
                  payedDiscounts += objFlow.discount;
                  this.mainService.getAllBy('reports', { connection_id: objFlow.method }).then(resReport => {
                    this.mainService.changeData('reports', resReport.docs[0]._id, (docReport) => {
                      docReport.count++;
                      docReport.weekly_count[this.day]++;
                      docReport.amount += objFlow.amount;
                      docReport.weekly[this.day] += objFlow.amount;
                      docReport.monthly[new Date().getMonth()] += objFlow.amount;
                      docReport.monthly_count[new Date().getMonth()]++;
                      docReport.timestamp = Date.now();
                      return docReport;
                    });
                  });
                });
                const checksForPayed = new ClosedCheck(this.check.table_id, this.check.discount, payedDiscounts,
                  this.owner, this.check.note, this.check.status, [], Date.now(), this.check.type,
                  'Parçalı', this.check.payment_flow, null, this.check.occupation);
                this.mainService.addData('closed_checks', checksForPayed);
              }
              this.mainService.removeData('checks', this.check._id).then(resRemove => {
                if (resRemove.ok) {
                          this.closeSplitTable();
                  this.mainService.updateData('tables', this.check.table_id, { status: 1 }).then(resUpdateTable => {
                    this.message.sendMessage(`Ürün ${this.selectedTable.name} Masasına Aktarıldı`);
                  });
                  this.router.navigate(['/store']);
                }
              });
            } else {
              this.mainService.updateData('checks', this.check._id, this.check).then(resUpdateCheck => {
                if (resUpdateCheck.ok) {
                  this.message.sendMessage(`Ürün ${this.selectedTable.name} Masasına Aktarıldı`);
                  this.check._rev = resUpdateCheck.rev;
                  this.setDefault();
                  this.closeSplitTable();
                }
              });
            }
          }
        });
      });
    }
    this.logService.createLog(logType.ORDER_MOVED, this.selectedProduct.id, `${this.selectedProduct.name} siparişi ${this.table.name} masasından ${this.selectedTable.name} masasına aktarıldı`)
  }

  splitTable() {
    if (this.selectedTable.status === TableStatus.ACTIVE) {
      if (this.check.status !== CheckStatus.PASSIVE) {
        if (this.check.type === CheckType.NORMAL) {
          this.mainService.updateData('tables', this.check.table_id, { status: 1, timestamp: Date.now() });
        }
        this.mainService.updateData('tables', this.selectedTable._id, { status: 2, timestamp: Date.now() });
        this.mainService.updateData('checks', this.check_id, { table_id: this.selectedTable._id, type: 1 }).then(resSplit => {
          if (resSplit.ok) {
            this.message.sendMessage(`Hesap ${this.selectedTable.name} Masasına Aktarıldı.`);
            if (this.check.type === CheckType.NORMAL) {
              this.logService.createLog(logType.CHECK_MOVED, this.check._id, `${this.table.name} Hesabı ${this.selectedTable.name} masasına taşındı.`);
            } else {
              this.logService.createLog(logType.CHECK_MOVED, this.check._id, `${this.check.note} Hesabı ${this.selectedTable.name} masasına taşındı.`);
            }
            this.closeSplitTable();
            this.router.navigate(['/store']);
          }
        })
      }
    } else {
      this.message.sendConfirm(`Bütün Ürünler, ${this.selectedTable.name} Masasına Aktarılacak.`).then(isOk => {
        if (isOk) {
          this.mainService.getAllBy('checks', { table_id: this.selectedTable._id }).then(res => {
            const otherCheck: Check = res.docs[0];
            otherCheck.products = otherCheck.products.concat(this.check.products);
            otherCheck.total_price += this.check.total_price;
            if (this.check.type === CheckType.NORMAL) {
              otherCheck.note = `${this.table.name} Masası İle Birleştirildi`;
              this.logService.createLog(logType.CHECK_MOVED, this.check._id, `${this.table.name} Masası ${this.selectedTable.name} ile Birleştirildi.`);
            } else {
              otherCheck.note = `${this.check.note} Hesabı İle Birleştirildi`;
              this.logService.createLog(logType.CHECK_MOVED, this.check._id, `${this.check.note} Hesabı ${this.selectedTable.name} Masasına Aktarıldı.`);
            }
            if (this.check.payment_flow) {
              if (otherCheck.payment_flow) {
                otherCheck.payment_flow = otherCheck.payment_flow.concat(this.check.payment_flow);
              } else {
                otherCheck.payment_flow = this.check.payment_flow;
              }
              otherCheck.discount += this.check.discount;
              otherCheck.timestamp = Date.now();
            }
            this.mainService.updateData('checks', otherCheck._id, otherCheck).then(resUpdate => {
              if (resUpdate.ok) {
                if (this.check.type === CheckType.NORMAL) {
                  this.mainService.updateData('tables', this.check.table_id, { status: 1 });
                }
                this.mainService.removeData('checks', this.check._id).then(resRemove => {
                  if (resRemove.ok) {
                    this.message.sendMessage(`Hesap ${this.selectedTable.name} Masası ile Birleştirildi.`)
                    this.closeSplitTable();
                    this.router.navigate(['/store']);
                  }
                });
              }
            })
          });
        }
      })
    }
  }

  setDiscount(value) {
    this.check.discountPercent = value;
    $('#checkDiscount').modal('hide');
    if (this.check.type === CheckType.NORMAL) {
      if (this.check.status !== CheckStatus.PASSIVE) {
        this.mainService.changeData('checks', this.check._id, (doc) => {
          doc.discountPercent = value;
          return doc;
        });
      }
    }
  }

  catName(cat_id: string) {
    try {
      return this.categories.find(obj => obj._id === cat_id).name;
    } catch (error) {
      return '';
    }
  }

  filterProducts(value: string) {
    if (value !== '') {
      const regexp = new RegExp(value, 'i');
      this.productsView = this.products.filter(({ name }) => name.match(regexp));
      this.selectedCat = 'OnSearch';
    } else {
      this.selectedCat = undefined;
    }

  }

  filterTables(id) {
    this.selectedFloor = id;
    this.selectedTable = undefined;
    this.tablesView = this.tables.filter(obj => obj.floor_id === id);
  }

  setDefault() {
    this.selectedIndex = undefined;
    this.selectedTable = undefined;
    this.selectedProduct = undefined;
    this.selectedFloor = undefined;
    this.onProductChange = false;
    this.fillData()
  }

  fillData() {
    this.selectedCat = undefined;
    this.mainService.getAllBy('categories', {}).then(result => {
      this.categories = result.docs;
      this.categories = this.categories.sort((a, b) => a.order - b.order);
      if (localStorage.getItem('E2E_TEST') === '1' && this.categories.length > 0 && !this.selectedCat) {
        this.selectedCat = this.categories[0]._id;
        if (this.products && this.products.length > 0) {
          this.productsView = this.products.filter(obj => obj.cat_id === this.selectedCat);
        }
      }
    });
    this.mainService.getAllBy('sub_categories', {}).then(result => {
      this.sub_categories = result.docs;
    });
    this.mainService.getAllBy('products', {}).then(result => {
      this.products = result.docs;
      this.products = this.products.sort((a, b) => a.price - b.price);
      this.productsView = this.products;
      if (localStorage.getItem('E2E_TEST') === '1' && this.categories?.length > 0 && !this.selectedCat) {
        this.selectedCat = this.categories[0]._id;
        this.productsView = this.products.filter(obj => obj.cat_id === this.selectedCat);
      }
    });
    this.mainService.getAllBy('tables', {}).then(res => {
      this.tables = res.docs;
      this.table = this.tables.filter(obj => obj._id === this.id)[0];
      this.tables = this.tables.filter(obj => obj._id !== this.id)
        .filter(obj => obj.status !== 3)
        .sort((a, b) => a.name.localeCompare(b.name));
      if (this.selectedFloor) {
        this.tablesView = this.tables.filter(obj => obj.floor_id === this.selectedFloor);
      } else {
        this.tablesView = this.tables;
      }
    });
    this.mainService.getAllBy('floors', {}).then(res => {
      this.floors = res.docs;
    });
    this.settingsService.getAppSettings().subscribe((res: any) => {
      if (res && res.value) {
        if (res.value.ask_print_order === 'Sor') {
          this.askForPrint = true;
        } else {
          this.askForPrint = false;
        }

        if (res.value.ask_print_check === 'Sor') {
          this.askForCheckPrint = true;
        } else {
          this.askForCheckPrint = false;
        }
      }
    });
  }

  /**
   * Resolve check related entity details (tableName and userNames)
   */
  async resolveCheckDetails() {
    if (!this.check) {
      return;
    }

    // Resolve table name
    if (this.check.type === CheckType.NORMAL) {
      this.tableName = '';
      this.tableName = await this.entityStoreService.resolveEntity('tables', this.check.table_id);
    } else {
      this.tableName = this.check.note || (this.check.type === CheckType.FAST ? 'Hızlı Satış' : 'Paket Servis');
    }

    // Resolve user names for products
    if (this.check.products && this.check.products.length > 0) {
      const userIds = this.check.products.map(p => p.owner).filter(id => id);
      const resolvedUsers = await this.entityStoreService.resolveEntities('users', userIds);
      this.userNames = resolvedUsers;
    }
  }

  /**
   * Resolve stock unit for manual products
   */
  async resolveStockUnit(stockId: string) {
    if (!stockId) {
      return;
    }
    this.stockUnit = await this.entityStoreService.resolveEntity('stocks', stockId, 'unit');
  }
}
