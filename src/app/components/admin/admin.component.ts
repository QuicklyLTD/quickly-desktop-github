import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { MainService } from '../../services/main.service';
import { Report } from '../../mocks/report';

import * as fs from 'fs';
import { ServerInfo, Settings } from '../../mocks/settings';
import { Product } from '../../mocks/product';
import { Table } from '../../mocks/table';

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
  onCreate: boolean;
  @ViewChild('editArea') editArea: ElementRef;

  constructor(private mainService: MainService, private httpService: HttpService) {
    this.databases = Object.keys(this.mainService.LocalDB);
  }

  ngOnInit() {

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
    // this.editArea.nativeElement.value == '';
    this.selectedDoc = doc;
    $('#docModal').modal('show');
  }

  editDocument(document) {
    let newDocument = JSON.parse(document);
    let db_name;
    if (this.selectedDB == 'allData') {
      db_name = document.db_name;
    } else {
      db_name = this.selectedDB;
    }
    this.mainService.updateData(db_name, newDocument._id, newDocument).then(res => {
      $('#docModal').modal('hide');
      console.log('Döküman Güncellendi');
      this.editArea.nativeElement.value = '';
      this.selectedDoc = undefined;
      this.showDatabase(this.selectedDB);
    });
  }


  createDocument(document) {
    let newDocument = JSON.parse(document);
    this.mainService.addData(this.selectedDB, newDocument).then(res => {
      if (res.ok) {
        $('#docModal').modal('hide');
        console.log('Döküman Güncellendi');
        this.editArea.nativeElement.value = '';
        this.selectedDoc = undefined;
        this.showDatabase(this.selectedDB);
      }
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
          doc.amount = 0;
          doc.count = 0;
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
    // let username = prompt('username');
    // let password = prompt('password');

    let oldToken = localStorage['AccessToken'];
    this.httpService.post('/store/refresh', null, oldToken).toPromise().then(res => {
        if (res.ok) {
          const token = res.json().token;
          localStorage.setItem('AccessToken', token);
          alert('İşlem Başarılı');
        }
      }).catch(err => {
        this.httpService.post('/store/login',{ username:'quickly', password:'asdtd155+1' }).toPromise().then(res => {
          if (res.ok) {
            const token = res.json().token;
            localStorage.setItem('AccessToken', token);
            alert('İşlem Başarılı');
          } else {
            alert('Başarısız');
          }
        })
      })
  }

  resolveDB() {
    this.mainService.LocalDB[this.selectedDB].allDocs({ include_docs: true, conflicts: true }).then(res => {
      let test = res.rows.map(obj => { return obj.doc });
      test.forEach(element => {
        if (element.hasOwnProperty('_conflicts')) {
          console.log(element);
          this.mainService.LocalDB[this.selectedDB].resolveConflicts(element, (a, b) => {
            if (element.hasOwnProperty('timestamp')) {
              if (a.timestamp > b.timestamp) return a;
              if (b.timestamp > a.timestamp) return b;
            } else if (element.hasOwnProperty('timestamp')) {
              if (a.timestamp > b.timestamp) return a;
              if (b.timestamp > a.timestamp) return b;
            } else if (element.hasOwnProperty('time')) {
              if (a.time > b.time) return a;
              if (b.time > a.time) return b;
            }
            return a;
          }).then(res => {
            console.log(res);
          }).catch(err => {
            console.log(err);
          })
        }
      });
    })
  }

  updateProgram() {

    // this.mainService.getAllBy('floors',{}).then(res => {
    //   console.log(res);
    // })
    // let tablesArr = [];
    // this.mainService.getAllBy('tables', {}).then(res => {
    //   for (let index = 0; index < res.docs.length; index++) {
    //     let connection_id = res.docs[index]._id;
    //     let reports = new Report('Table', connection_id, 0, 0, 0, [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], '', Date.now());
    //     this.mainService.addData('reports', reports).then(res => {
    //       console.log(res);
    //     })

    //   }
    // })

    // for (let index = 1; index < 16; index++) {
    //     let table = new Table(`S${index}`,'05800961-4aaa-4add-baa8-9f8fbfb3f2fb',4,'',1,Date.now(),[]);
    //     this.mainService.addData('tables',table).then(res => {
    //       console.log(res);
    //     }); 
    // }



    // localStorage.setItem('CheckNo', "1");
    // let specifies = [
    //   {
    //     spec_name: "Sek",
    //     spec_price: 70
    //   },
    //   {
    //     spec_name: "Soda",
    //     spec_price: 70
    //   },
    //   {
    //     spec_name: "Kola",
    //     spec_price: 70
    //   },
    //   {
    //     spec_name: "Redbull",
    //     spec_price: 75
    //   }
    // ];
    // this.mainService.getAllBy('products', {cat_id :"ebb230e3-c297-4822-8c2b-6b11b0f9ca68"}).then(res => {
    //   let products = res.docs;
    //   products.forEach(element => {
    //     this.mainService.changeData('products', element._id, (doc: Product) => {
    //       doc.specifies = specifies;
    //       doc.specifies.map(obj => {
    //         if(obj.spec_name == 'Redbull'){
    //           obj.spec_price = doc.price + 5;
    //         }else{
    //           obj.spec_price = doc.price;
    //         }
    //       });
    //       console.log(doc);
    //       return doc;
    //     }).then(res => {
    //       console.log(res);
    //     });
    //   });
    // })

    // this.mainService.getAllBy('stocks', {}).then(res => {
    //   let stocks = res.docs;
    //   stocks.forEach(element => {
    //     this.mainService.changeData('stocks', element._id, (doc) => {
    //       doc.warning_value = 25;
    //       return doc;
    //     }).then(res => {
    //       console.log(res);
    //     });
    //   });
    // })

    // this.mainService.getAllBy('endday', {}).then(res => {
    //   let endday = res.docs;
    //   endday.forEach(element => {
    //     this.mainService.changeData('endday', element._id, (doc) => {
    //       let time = doc.time;
    //       delete doc.time;
    //       doc.timestamp = time;
    //       return doc;
    //     }).then(res => {
    //       console.log(res);
    //     });
    //   });
    // })

    // this.mainService.getAllBy('reports', { type: 'Product' }).then(res => {
    //   let reports = res.docs;
    //   console.log(res);
    //   reports.forEach(element => {
    //     this.mainService.changeData('reports', element._id, (doc) => {
    //       doc.weekly[0] = 0;
    //       doc.weekly_count[0] = 0;
    //       return doc;
    //     }).then(res => {
    //       console.log(res);
    //     });
    //   });
    // })

    // let value = new ServerInfo(0, 1, '192.168.1.1', 3000, 'kosmos2018');

    // this.mainService.addData('settings', new Settings('ServerSettings', value, 'Sunucu Ayarları', Date.now()));

    // this.mainService.syncToRemote().cancel();
    // this.mainService.syncToServer().cancel();
    // this.mainService.getAllBy('settings', { key: 'RestaurantInfo' }).then(res => {
    //   let restaurantID = res.docs[0].value.id;
    //   this.mainService.getAllBy('allData', {}).then(res => {
    //     let token = localStorage.getItem("AccessToken");
    //     this.httpService.post(`v1/management/restaurants/${restaurantID}/reset_database/`, { docs: [] }, token).subscribe(res => {
    //       console.log(res.json());
    //       Object.keys(this.mainService.LocalDB).forEach(db_name => {
    //         if (db_name !== 'settings') {
    //           this.mainService.destroyDB(db_name).then(res => {
    //             console.log(db_name, res);
    //           });
    //         }
    //       });
    //     });
    //   })
    // });

    // this.mainService.getAllBy('allData', {}).then(res => {
    //   return res.docs.map((obj) => {
    //     delete obj._rev;
    //     return obj;
    //   })
    // }).then((cleanDocs: Array<any>) => {
    //   console.log(cleanDocs.length);
    //   fs.writeFile('./data/all.txt', JSON.stringify(cleanDocs), err => {
    //     console.log(err);
    //   })
    // });;

    // fs.readFile('./data/all.txt', (err, data) => {
    //   let realData = JSON.parse(data.toString('utf-8'));
    //   let filteredData = realData
    //     .filter(obj => obj.db_name !== "settings")
    //     .filter(obj => obj.db_name !== "users")
    //     .filter(obj => obj.db_name !== "users_group")
    //     .filter(obj => obj.type !== "Store")
    //     .filter(obj => obj.type !== "User")
    //     .filter(obj => obj.type !== "Activity");
    //   this.mainService.putAll('allData', filteredData).then(res => {
    //     this.mainService.syncToLocal().then(res => {
    //       console.log(res);
    //     })
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
