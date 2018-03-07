import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { SettingsService } from '../../../services/settings.service';
import { MessageService } from '../../../providers/message.service';
import { ElectronService } from '../../../providers/electron.service';
import { PrinterService } from '../../../providers/printer.service';
import { Printer, Settings } from '../../../mocks/settings.mock';

@Component({
  selector: 'app-application-settings',
  templateUrl: './application-settings.component.html',
  styleUrls: ['./application-settings.component.scss'],
  providers: [SettingsService]
})
export class ApplicationSettingsComponent implements OnInit {
  restInfo: any;
  appSettings: any;
  appLogo: string;
  printers: Array<any>;
  printerProcess: string;
  printersFound: Array<any>;
  selectedPrinter: any;
  choosenPrinter: any;
  @ViewChild('settingsForm') settingsForm: NgForm;
  @ViewChild('restaurantForm') restaurantForm: NgForm;
  @ViewChild('printerForm') printerForm: NgForm;
  @ViewChild('printerDetailForm') printerDetailForm: NgForm;

  constructor(private settings: SettingsService, private router: Router, private printerService: PrinterService, private electronService: ElectronService, private message: MessageService, ) {
    this.appLogo = "";
    this.fillData();
  }

  ngOnInit() {
    this.settings.AppSettings.subscribe(res => {
      this.appSettings = res.value
      this.settingsForm.setValue(this.appSettings);
    });
    this.settings.RestaurantInfo.subscribe(res => {
      delete res.value.auth;
      delete res.value.remote;
      this.restInfo = res.value
      this.appLogo = this.restInfo.logo;
      //this.restaurantForm.setValue(this.restInfo);
    });
  }

  saveSettings(Form: NgForm) {
    this.settings.setAppSettings('AppSettings', Form.value);
    this.message.sendMessage('Ayarlar Kaydediliyor.. Program Yeniden Başlatılıyor.');
    setTimeout(() => {
      this.electronService.reloadProgram();
    }, 1500)
  }

  saveRestSettings(Form: NgForm) {
    this.settings.setAppSettings('RestaurantInfo', Form.value);
    this.message.sendMessage('Ayarlar Kaydediliyor.. Program Yeniden Başlatılıyor.');
    setTimeout(() => {
      this.electronService.reloadProgram();
    }, 1500)
  }

  getPrinterDetail(printer: Printer) {
    this.choosenPrinter = printer;
    this.printerDetailForm.setValue(printer);
  }

  addPrinter(Form: NgForm) {
    let form = Form.value;
    let address;
    if (form.port_number == undefined) {
      address = this.selectedPrinter.portNumbers[0];
    }
    if (form.name) {
      if (this.printerProcess == 'LAN') {
        if (form.port_number) {
          address = form.port_number;
        } else {
          this.message.sendMessage('IP Adresi Girmek Zorundasınız.');
          return false;
        }
      }
      let printer = new Printer(form.name, this.printerProcess, form.note, address);
      let printersData = this.printers.filter(obj => obj.name == form.name);
      if (printersData.length == 0) {
        this.settings.addPrinter(printer);
        $('#printerModal').modal('hide');
        this.message.sendMessage('Yazıcı Oluşturuldu.');
        this.fillData();
      } else {
        this.message.sendMessage('Farklı Bir İsim Girmek Zorundasınız');
      }
    } else {
      this.message.sendMessage('Yazıcı Adı Girmek Zorundasınız.');
      return false;
    }
  }

  updatePrinter(Form: NgForm) {
    let form = Form.value;
    this.settings.updatePrinter(form, this.choosenPrinter);
    this.choosenPrinter = undefined;
    this.message.sendMessage('Yazıcı Düzenlendi.');
    this.fillData();
  }

  removePrinter(Printer) {
    this.settings.removePrinter(Printer);
    this.message.sendMessage('Yazıcı Kaldırıldı..');
    this.choosenPrinter = undefined;
    this.fillData();
  }

  getPrinters(Type: string) {
    switch (Type) {
      case 'USB':
        if (this.printerService.getUSBPrinters().length > 0) {
          this.printerProcess = 'USB';
          this.printersFound = this.printerService.getUSBPrinters();
        } else {
          this.message.sendMessage('USB portlarında takılı yazıcı bulunamadı..');
          return false;
        }
        break;
      case 'LAN':
        this.printerProcess = 'LAN';
        this.printersFound = [];
        this.selectedPrinter = {};
        break;
      default:
        break;
    }
  }

  printTest(Device: any) {
    this.printerService.printTest(Device);
  }

  makeAdmin(pass) {
    if (pass === 'asdtd155+1') {
      this.router.navigate(['/admin']);
      this.electronService.openDevTools();
    } else {
      alert('Yanlış Şifre');
    }
    $('#adminModal').modal('hide');
  }

  setDefault() {
    this.printerForm.reset();
    this.choosenPrinter = undefined;
    this.printerProcess = undefined;
    this.selectedPrinter = undefined;
  }

  fillData() {
    this.settings.getPrinters().subscribe(res => this.printers = res.value);
  }
}
