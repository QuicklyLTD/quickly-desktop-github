import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { MainService } from '../../services/main.service';
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

  constructor(private mainService: MainService, private httpService: HttpService) {
    this.databases = Object.keys(this.mainService.LocalDB);
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
      this.mainService.localSyncBeforeRemote('reports');
    });
  }

  compactDB() {
    this.mainService.compactDB(this.selectedDB).then(res => {
      console.log(res);
    }).catch(err => {
      console.log(err);
    });
  }

  clearDB() {
    this.mainService.getAllBy(this.selectedDB, {}).then(res => {
      res.docs.forEach((element, index) => {
        this.mainService.removeData(this.selectedDB, element._id);
        console.log(index);
      });
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

  updateProgram() {
    this.mainService.syncToRemote().cancel();
    this.mainService.getAllBy('settings', { key: 'RestaurantInfo' }).then(res => {
      let restaurantID = res.docs[0].value.id;
      this.mainService.getAllBy('allData', {}).then(res => {
        let token = localStorage.getItem("AccessToken");
        this.httpService.post(`v1/management/restaurants/${restaurantID}/reset_database/`, { docs: res.docs }, token).subscribe(res => {
          console.log(res.json());
          Object.keys(this.mainService.LocalDB).forEach(db_name => {
            if (db_name !== 'settings') {
              this.mainService.destroyDB(db_name).then(res => {
                console.log(db_name, res);
              });
            }
          });
        });
      })
    });

    // this.mainService.getAllBy('allData', {}).then(res => {
    //   return res.docs.map((obj) => {
    //     delete obj._rev;
    //     return obj;
    //   })
    // }).then((cleanDocs: Array<any>) => {
    //   fs.writeFile('./data/all.txt', JSON.stringify(cleanDocs), err => {
    //     console.log(err);
    //   })
    // });;

    // let db_names = Object.keys(this.mainService.LocalDB);
    // fs.readFile('./data/all.txt', (err, data) => {
    //   const realData = JSON.parse(data.toString('utf-8'));
    //   this.mainService.putAll('allData', realData).then(res => {
    //     db_names.forEach(element => {
    //       if (element !== 'allData') {
    //         let db_data = realData.filter(obj => obj.db_name == element);
    //         db_data.map(obj => {
    //           delete obj['db_name'];
    //           delete obj['db_seq'];
    //           return obj;
    //         });
    //         if (element !== 'settings') {
    //           console.log(element, db_data)
    //           this.mainService.putAll(element, db_data).then(res => {
    //             console.log(element, res)
    //           });
    //         }
    //       }
    //     });
    //   });
    // })

    // Object.keys(this.mainService.LocalDB).forEach(db_name => {
    //   this.mainService.destroyDB(db_name);
    // });

    // this.mainService.createIndex('allData', ['db_name']).then(res => {
    //   console.log(res);
    // });


    // let t1 = performance.now();
    // this.mainService.getAllData('closed_checks').then(res => {
    //   console.log(res.rows.map(obj => { return obj.doc }));
    //   let t2 = performance.now();
    //   console.log('Bulk', t2 - t1);
    // })
    // this.mainService.getAllBy('closed_checks', {}).then(res => {
    //   console.log('Pro', res.docs);
    //   let t2 = performance.now();
    //   console.log('Normal', t2 - t1);
    // });


    // fs.readFile('./data/all.txt', (err, data) => {
    //   const rdata = JSON.parse(data.toString('utf-8'));
    //   let products = rdata.filter(obj => obj.db_name == 'products');
    //   console.log('File', products);
    //   let t2 = performance.now();
    //   console.log(t2 - t1);
    // })

    // this.mainService.getAllBy('allData', { db_name: 'products' }).then(res => {
    //   console.log('All', res.docs);
    //   let t2 = performance.now();
    //   console.log(t2 - t1);
    // });
  }

  testEndDay() {
    let token = localStorage.getItem("AccessToken");
    let restaurantID = JSON.parse(localStorage['RestaurantInfo']).id;
    this.httpService.post(`v1/management/restaurants/${restaurantID}/report_generator/`, { timestamp: Date.now(), data: { hello: 'test' } }, token).subscribe(res => {
      console.log(res);
    });
  }
}
