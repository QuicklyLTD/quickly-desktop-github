import { Component, OnInit } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { NgForm } from '@angular/forms'
import { Router } from '@angular/router'
import { MainService } from '../../services/main.service';
import { SettingsService } from '../../services/settings.service';
import { ElectronService } from '../../providers/electron.service';
import { MessageService } from '../../providers/message.service';
import { Settings, AuthInfo } from '../../mocks/settings';
import { Report, Activity } from '../../mocks/report';
import { UserGroup, User, UserAuth, ComponentsAuth } from '../../mocks/user';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss'],
  providers: [SettingsService]
})

export class SetupComponent implements OnInit {
  progress: string;
  stores: Array<any>;
  status: number = 0;
  statusMessage: string;
  showMessage: boolean = false;
  setupStep: number = 0;
  headers: Headers;
  options: RequestOptions;
  baseUrl: string;

  constructor(private mainService: MainService, private settingsService: SettingsService, private http: Http, private electron: ElectronService, private message: MessageService, private router: Router) {
    this.headers = new Headers({ 'Content-Type': 'application/json', 'charset': 'UTF-8' });
    this.options = new RequestOptions({ headers: this.headers });
    this.baseUrl = 'https://hq.quickly.com.tr';
  }

  ngOnInit() {
    if (!navigator.onLine) {
      alert('İnternet Bağlantınızı Kontol Edin...');
      setTimeout(() => {
        this.electron.reloadProgram();
      }, 5000)
    }
    this.settingsService.ActivationStatus.subscribe(res => {
      if (res) {
        this.router.navigate(['']);
      }
    })
  }

  getConfigrations(connectionForm: NgForm) {
    let Form = connectionForm.value;
    let serverSettings = new Settings('ServerSettings', { type: 1, status: 1, ip_address: Form.address, ip_port: parseInt(Form.port), key: Form.key }, 'Sunucu Ayarları', Date.now());
    localStorage.setItem('AppType', 'Secondary');
    this.electron.openDevTools();
    this.mainService.replicateDB(serverSettings.value)

      .on('active', () => {
        this.progressBar(5);
      })
      .on('denied', (ass) => {
        console.log(ass, 'denied')
      })
      .on('error', (err) => {
        console.log(err)
        this.mainService.syncToLocal().then(res => {
          this.getConfigrations(connectionForm);
        });
      })
      .on('change', (sync) => {
        this.statusMessage = `${sync.docs_written} - Senkronize Ediliyor `;
      })
      .on('complete', info => {
        this.mainService.addData('settings', serverSettings);
        this.mainService.syncToLocal().then(res => {
          if (res) {
            this.statusMessage = 'Kurulum Tamamlandı !'
            setTimeout(() => {
              this.electron.relaunchProgram();
            }, 30000)
          }
        });
      }).catch(err => {
        // connectionForm.reset();
        // this.message.sendMessage('Sunucuya Bağlanılamıyor.');
        console.log(err)
        this.mainService.syncToLocal().then(res => {
          this.getConfigrations(connectionForm);
        });
      });
  }

  makeLogin(loginForm: NgForm) {
    let Form = loginForm.value;
    this.http.post(this.baseUrl + '/store/login/', { username: Form.username, password: Form.password }, this.options).subscribe((res: Response) => {
      localStorage.setItem('AccessToken', res.json().token);
      this.headers.append('Authorization', res.json().token);
      this.http.get(this.baseUrl + '/store/list/', new RequestOptions({ headers: this.headers })).subscribe((body: Response) => {
        this.message.sendMessage('Giriş Başarılı!');
        if (body.json().length > 1) {
          this.stores = body.json();
          this.setupStep = 2;
        } else {
          this.makeAuth(body.json()[0]);
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
    let activationStatus = new Settings('ActivationStatus', true, Data.auth.database_name, Date.now());
    let dateSettings = new Settings('DateSettings', { started: true, day: new Date().getDay(), time: Date.now() }, 'Tarih-Zaman Ayarları', Date.now());
    let authInfo = new Settings('AuthInfo', new AuthInfo('31.210.89.218', '5984', Data.auth.database_name, Data.auth.database_user, Data.auth.database_password), 'Giriş Bilgileri Oluşturuldu', Date.now());
    let restaurantInfo = new Settings('RestaurantInfo', Data, 'Restoran Bilgileri', Date.now());
    let appSettings = new Settings('AppSettings', { timeout: 120, keyboard: 'Kapalı', takeaway: 'Açık', ask_print_order: 'Sor', ask_print_check: 'Sor', last_day: 0 }, 'Uygulama Ayarları', Date.now());
    let serverSettings = new Settings('ServerSettings', { type: 0, status: 0, ip_address: this.electron.getLocalIP(), ip_port: 3000, key: Data.auth.database_id }, 'Sunucu Ayarları', Date.now());
    let printerSettings = new Settings('Printers', [], 'Yazıcılar', Date.now());
    // let lastSeenSettings = new Settings('LastSeen', { last_seen: new Date().toLocaleString('tr-TR'), user: 'Setup' }, 'Son Görülme', Date.now());
    localStorage.setItem('AppType', 'Primary');
    this.mainService.addData('settings', restaurantInfo);
    this.mainService.addData('settings', authInfo);
    this.mainService.addData('settings', appSettings);
    this.mainService.addData('settings', printerSettings);
    this.mainService.addData('settings', serverSettings);
    // this.mainService.addData('settings', Object.assign({ _id: 'lastseen' }, lastSeenSettings));
    this.mainService.addData('settings', dateSettings);
    this.mainService.addData('settings', activationStatus).then((result) => {
      this.progressBar(3);
    });
    this.progressBar(3);
  }

  makeAdmin(adminForm: NgForm) {
    let Form = adminForm.value;
    let userAuth = new UserAuth(new ComponentsAuth(true, true, true, true, true), true, true, true, true, true);
    this.mainService.addData('users_group', new UserGroup('Yönetici', 'Yönetici Grubu', userAuth, 1, Date.now())).then(res => {
      this.mainService.addData('users', new User(Form.admin_name, 'Yönetici', res.id, parseInt(Form.admin_pass), 1, Date.now())).then((user) => {
        this.mainService.addData('reports', new Report('User', user.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), user.name, Date.now()));
        localStorage.setItem('userName', Form.admin_name);
        localStorage.setItem('userType', 'Yönetici');
        localStorage.setItem('userAuth', res.id);
      });
    }).then(() => {
      this.mainService.addData('reports', new Report('Store', 'Nakit', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), 'Nakit Satış Raporu', Date.now()));
      this.mainService.addData('reports', new Report('Store', 'Kart', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), 'Kart Satış Raporu', Date.now()));
      this.mainService.addData('reports', new Report('Store', 'Kupon', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), 'Kupon Satış Raporu', Date.now()));
      this.mainService.addData('reports', new Report('Store', 'İkram', 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), 'İkram Satış Raporu', Date.now()));
      this.mainService.addData('reports', new Activity('Activity', 'Selling', [0], ['GB'], [0]));
      this.message.sendMessage('Program Yeniden Başlatıyor..');
      setTimeout(() => {
        this.electron.reloadProgram();
      }, 3000)
    });
  }

  progressBar(step) {
    this.statusMessage = 'Program Ayarlanıyor...';
    this.setupStep = 5;
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
        this.statusMessage = 'Kurulum Tamamlanıyor...';
        this.showMessage = true;
        this.setupStep = step;
        this.progress = '100%';
      }
    }, 200);
  }
}