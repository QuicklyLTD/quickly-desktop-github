import { Component, OnInit } from '@angular/core';
import { MainService } from 'app/services/main.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  databases: Array<string>;
  documents: object;
  selectedDoc: object;
  selectedDB: string;

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
      'allData'
    ];

  }

  ngOnInit() {
  }

  showDatabase(db_name) {
    this.selectedDB = db_name;
    this.mainService.getAllData(db_name, 250).then(res => {
      this.documents = res;
    });
  }

  showDocument(doc) {
    this.selectedDoc = doc;
    $('#docModal').modal('show');
  }

  editDocument(document){
    let newDocument = JSON.parse(document);
    this.mainService.updateData(this.selectedDB,newDocument._id,newDocument).then(res => {
      $('#docModal').modal('hide');
      console.log('Döküman Güncellendi');
    });
  }

  removeDocument(id){
    this.mainService.removeData(this.selectedDB,id).then(res => {
      $('#docModal').modal('hide');
      console.log('Döküman Silindi');
    });
  }

}
