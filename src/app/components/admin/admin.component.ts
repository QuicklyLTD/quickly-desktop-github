import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MainService } from 'app/services/main.service';

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

  constructor(private mainService: MainService) {
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
}
