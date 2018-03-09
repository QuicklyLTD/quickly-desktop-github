import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MainService } from '../../services/main.service';
import { HttpClient } from '../../services/http.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  databases: Array<string>;
  documents: any;
  selectedDoc: object;
  selectedDB: string;
  storeReports: Array<any>;
  @ViewChild('editArea') editArea: ElementRef;

  constructor(private mainService: MainService, private httpService: HttpClient) {
    this.databases = [
      'users',
      'users_group',
      'checks',
      'closed_checks',
      'cashbox',
      'categories',
      'sub_categories',
      'occations',
      'products',
      'recipes',
      'floors',
      'tables',
      'stocks',
      'stocks_cat',
      'endday',
      'reports',
      'settings',
      'logs',
      'allData'
    ];

  }

  ngOnInit() {
    this.mainService.getAllBy('reports', { type: 'Store' }).then(res => {
      this.storeReports = res.docs;
    })
  }

  syncData() {
    this.mainService.syncToLocal(this.selectedDB).then(message => {
      alert(message);
    });
  }

  showDatabase(db_name) {
    this.selectedDB = db_name;
    this.mainService.getAllBy(db_name, {}).then(res => {
      this.documents = res.docs;
    });
  }

  showDocument(doc) {
    this.editArea.nativeElement.value == '';
    this.selectedDoc = doc;
    $('#docModal').modal('show');
  }

  editDocument(document) {
    let newDocument = JSON.parse(document);
    this.mainService.updateData(this.selectedDB, newDocument._id, newDocument).then(res => {
      $('#docModal').modal('hide');
      console.log('Döküman Güncellendi');
      this.editArea.nativeElement.value == '';
      this.selectedDoc = undefined;
      this.showDatabase(this.selectedDB);
    });
  }

  getByFilter(key, value) {
    let filter = new Object();
    filter[key] = value;
    if (this.selectedDB) {
      this.mainService.getAllBy(this.selectedDB, filter).then(res => {
        this.documents = res.docs;
      });
    }
  }

  removeDocument(id) {
    this.mainService.removeData(this.selectedDB, id).then(res => {
      $('#docModal').modal('hide');
      console.log('Döküman Silindi');
      this.selectedDoc = undefined;
      this.showDatabase(this.selectedDB);
    });
  }

  resetReports() {
    this.mainService.getAllBy('reports', {}).then(res => {
      console.warn(res.docs.length);
      let reports = res.docs.filter(obj => obj.type !== 'Activity');
      reports.forEach((element, index) => {
        this.mainService.changeData('reports', element._id, (doc) => {
          doc.weekly = [0, 0, 0, 0, 0, 0, 0];
          doc.weekly_count = [0, 0, 0, 0, 0, 0, 0];
          return doc;
        });
      });
      this.mainService.compactBeforeSync('reports');
    });
  }

  refreshToken() {
    let oldToken = localStorage['AccessToken'];
    this.httpService.post('token/refresh/', { token: oldToken })
      .subscribe(res => {
        if (res.ok) {
          const token = res.json().token; 
          localStorage.setItem('AccessToken', token);
          alert('İşlem Başarılı');
        } else {
          alert('Başarısız');
        }
      });
  }

  testEndDay() {
    let token = localStorage.getItem("AccessToken");
    let restaurantID = JSON.parse(localStorage['RestaurantInfo']).id;
    this.httpService.post(`v1/management/restaurants/${restaurantID}/report_generator/`, { timestamp: Date.now(), data: { hello: 'test' } }, token).subscribe(res => {
      console.log(res);
    });
  }
}
