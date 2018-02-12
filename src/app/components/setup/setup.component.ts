import { Component, OnInit } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { NgForm } from '@angular/forms'
import { Router } from '@angular/router'
import { MainService } from '../../services/main.service';
import { SettingsService } from '../../services/settings.service';
import { ElectronService } from '../../providers/electron.service';
import { MessageService } from '../../providers/message.service';
import { Settings, AuthInfo } from '../../mocks/settings.mock';
import { Report, Activity } from '../../mocks/report.mock';
import { UserGroup, User, UserAuth, ComponentsAuth } from '../../mocks/user.mock';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})

export class SetupComponent implements OnInit {
  progress: string;
  stores: Array<any>;
  status: number = 0;
  statusMessage: string;
  showMessage: boolean = false;
  setupStep: number = 1;
  headers: Headers;
  options: RequestOptions;

  constructor(private mainService: MainService, private settings: SettingsService, private http: Http, private electron: ElectronService, private message: MessageService, private router: Router) {
    this.headers = new Headers({ 'Content-Type': 'application/json', 'charset': 'UTF-8' });
    this.options = new RequestOptions({ headers: this.headers });
  }

  ngOnInit() {
    if (navigator.onLine) {
      if (localStorage['ActivationStatus'] !== undefined) {
        this.router.navigate(['']);
      }
    } else {
      alert('İnternet Bağlantınızı Kontol Edin...');
      setTimeout(() => {
        this.electron.reloadProgram();
      }, 5000)
    }
  }

  makeLogin(loginForm: NgForm) {
    let Form = loginForm.value;
    this.http.post('https://api.quickly.com.tr/token/', { username: Form.username, password: Form.password }, this.options).subscribe((res: Response) => {
      this.headers.append('Authorization', 'JWT ' + res.json().token);
      this.http.get('https://api.quickly.com.tr/restaurants/', new RequestOptions({ headers: this.headers })).subscribe((body: Response) => {
        this.message.sendMessage('Giriş Başarılı!');
        if (body.json().results.length > 1) {
          this.stores = body.json().results;
          this.setupStep = 2;
        } else {
          this.makeAuth(body.json().results[0]);
        }
      }, (err) => {
        this.message.sendMessage('Giriş Başarısız!');
      });
    }, (err) => {
      let response = err._body
      response = JSON.parse(response)
      if (response.non_field_errors) {
        this.message.sendMessage(response.non_field_errors)
      }
      else {
        this.message.sendMessage("Geçerli bir kullanıcı adı ve şifre giriniz.");
      }
    });
  }

  makeAuth(Data) {
    this.electron.saveLogo(Data.logo);
    let activation = new Settings('ActivationStatus', true, Data.auth.database_name, Date.now());
    let authValue = new AuthInfo(Data.remote.host, Data.remote.port, Data.auth.database_name, Data.auth.app_id, Data.auth.app_token);
    let auth = new Settings('AuthInfo', authValue, 'Giriş Bilgileri Oluşturuldu', Date.now());
    let restaurantInfo = new Settings('RestaurantInfo', Data, 'Restoran Bilgileri', Date.now());
    let appSettings = new Settings('AppSettings', { timeout: 120, keyboard: 'Kapalı', takeaway: 'Açık' }, 'Uygulama Ayarları', Date.now());
    let printerSettings = new Settings('Printers', [], 'Yazıcılar', Date.now());
    this.mainService.addData('settings', restaurantInfo);
    this.mainService.addData('settings', auth);
    this.mainService.addData('settings', appSettings);
    this.mainService.addData('settings', printerSettings);
    this.mainService.addData('settings', activation).then((result) => {
      localStorage.setItem('AuthInfo', JSON.stringify(authValue));
      localStorage.setItem('ActivationStatus', 'true');
      localStorage.setItem('WeekStatus', '{"started": true, "time": ' + Date.now() + '}');
      localStorage.setItem('DayStatus', '{"started": true, "day":' + new Date().getDay() + ', "time": ' + Date.now() + '}');
      localStorage.setItem('RestaurantInfo', JSON.stringify(Data));
      this.progressBar(3);
    });
  }

  makeAdmin(adminForm: NgForm) {
    let Form = adminForm.value;
    let userAuth = new UserAuth(new ComponentsAuth(true, true, true, true, true), true, true, true);
    this.mainService.addData('users_group', new UserGroup('Yönetici', 'Yönetici Grubu', userAuth, 1, Date.now())).then(res => {
      this.mainService.addData('users', new User(Form.admin_name, 'Yönetici', res.id, parseInt(Form.admin_pass), 1, Date.now())).then((user) => {
        this.mainService.addData('reports', new Report('User', user.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], user.name, Date.now()));
        localStorage.setItem('userName', Form.admin_name);
        localStorage.setItem('userType', 'Yönetici');
        localStorage.setItem('userAuth', res.id);
      });
    }).then(() => {
      this.mainService.addData('reports', new Report('Store', 'Genel', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], 'Genel Satış Raporu', Date.now()));
      this.mainService.addData('reports', new Report('Store', 'Nakit', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], 'Nakit Satış Raporu', Date.now()));
      this.mainService.addData('reports', new Report('Store', 'Kart', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], 'Kart Satış Raporu', Date.now()));
      this.mainService.addData('reports', new Report('Store', 'Kupon', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], 'Kupon Satış Raporu', Date.now()));
      this.mainService.addData('reports', new Report('Store', 'İkram', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], 'İkram Satış Raporu', Date.now()));
      this.mainService.addData('reports', new Activity('Activity', 'Selling', [], [], []));
      this.message.sendMessage('Program Yeniden Başlatıyor..');
      setTimeout(() => {
        this.electron.reloadProgram();
      }, 3000)
    });
  }

  progressBar(step) {
    this.statusMessage = 'Program Ayarlanıyor...';
    this.setupStep = 0;
    let stat = setInterval(() => {
      this.progress = this.status + '%';
      this.status++;
      this.showMessage = true;
      if (this.status == 25) {
        this.statusMessage = 'Bilgiler Kontrol Ediliyor...';
        this.showMessage = false;
      }
      if (this.status == 50) {
        this.statusMessage = 'Yapılandırma Yapılıyor...';
        this.showMessage = true;
      }
      if (this.status == 75) {
        this.statusMessage = 'Yapılandırma Kontrol Ediliyor...';
        this.showMessage = true;
      }
      if (this.status == 101) {
        clearInterval(stat);
        this.statusMessage = 'Kurulum Tamamlandı...';
        this.showMessage = true;
        this.setupStep = step;
        this.progress = '0%';
      }
    }, 200);
  }
}