import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import * as PouchDB from 'pouchdb-browser';
import * as PouchDBFind from 'pouchdb-find';
import * as PouchDBUpsert from 'pouchdb-upsert';
import { AuthInfo } from '../mocks/settings.mock';
import { MessageService } from 'app/providers/message.service';

@Injectable()
export class MainService {
  hostname: string;
  db_prefix: string;
  authInfo: AuthInfo;
  ajaxOpts: object;
  LocalDB: any;
  RemoteDB: any;

  constructor(private messageService: MessageService) {
    PouchDB.plugin(PouchDBFind);
    PouchDB.plugin(PouchDBUpsert);

    this.LocalDB = {
      users: new PouchDB('local_users'),
      users_group: new PouchDB('local_users_group'),
      checks: new PouchDB('local_checks'),
      closed_checks: new PouchDB('local_closed_checks'),
      cashbox: new PouchDB('local_cashbox'),
      categories: new PouchDB('local_categories'),
      sub_categories: new PouchDB('local_sub_cats'),
      occations: new PouchDB('local_occations'),
      products: new PouchDB('local_products'),
      recipes: new PouchDB('local_recipes'),
      floors: new PouchDB('local_floors'),
      tables: new PouchDB('local_tables'),
      stocks: new PouchDB('local_stocks'),
      stocks_cat: new PouchDB('local_stocks_cat'),
      endday: new PouchDB('local_endday'),
      reports: new PouchDB('local_reports'),
      settings: new PouchDB('local_settings'),
      logs: new PouchDB('local_logs'),
      allData: new PouchDB('local_alldata')
    };

    this.authInfo = JSON.parse(localStorage.getItem('AuthInfo'));
    if (this.authInfo) {
      this.hostname = 'http://' + this.authInfo.app_remote + ':' + this.authInfo.app_port;
      this.ajaxOpts = { ajax: { headers: { Authorization: 'Basic ' + Buffer.from(this.authInfo.app_id + ':' + this.authInfo.app_token).toString('base64') } } };
      this.db_prefix = this.authInfo.app_db;
      this.RemoteDB = new PouchDB(this.hostname + this.db_prefix, this.ajaxOpts);
    }
  }

  getAllData(db: string, $limit) {
    return this.LocalDB[db].allDocs({ include_docs: true, limit: $limit });
  }

  getData(db: string, id: string) {
    return this.LocalDB[db].get(id);
  }

  getAllBy(db: string, $schema) {
    return this.LocalDB[db].find({
      selector: $schema
    });
  }

  getByFilter(db: string, $schema: object, $index: object) {
    return this.LocalDB[db].createIndex({ index: $index }).then(function () {
      return this.LocalDB[db].find($schema);
    });
  }

  getInfo(db: string) {
    this.LocalDB[db].info().then((info) => {
      console.log(info);
    })
  }

  addData(db, schema) {
    this.LocalDB[db].post(schema);
    delete schema._rev;
    return this.LocalDB['allData'].put(Object.assign({ db_name: db, db_seq: 0 }, schema));
  }

  changeData(db, id, schema: any) {
    this.LocalDB['allData'].upsert(id, schema);
    return this.LocalDB[db].upsert(id, schema);
  }

  updateData(db: string, id, schema) {
    return this.LocalDB[db].get(id).then((doc) => {
      this.LocalDB['allData'].upsert(id, function (doc) {
        return Object.assign(doc, schema);
      });
      return this.LocalDB[db].put(Object.assign(doc, schema));
    });
  }

  removeData(db: string, id: string) {
    return this.LocalDB[db].get(id).then((doc) => {
      this.LocalDB['allData'].get(id).then((doc) => {
        this.LocalDB['allData'].remove(doc);
      });
      return this.LocalDB[db].remove(doc);
    });
  }

  removeDoc(db: string, doc: any) {
    return this.LocalDB[db].remove(doc);
  }

  putDoc(db: string, doc: any) {
    return this.LocalDB[db].put(doc);
  }

  removeDB(db: string) {
    return this.LocalDB[db].destroy(
      (err, response) => {
        if (err) {
          return console.log(err);
        } else {
          console.log(db + ' Silindi!');
        }
      });
  }

  createIndex(db: string) {
    this.LocalDB[db].createIndex({
      index: {
        fields: ['description', 'time', 'cash', 'card', 'coupon']
      }
    });
  }

  compactBeforeSync(local_db) {
    this.LocalDB[local_db].changes({ since: 'now', include_docs: true }).on('change', (change) => {
      if (change.deleted) {
        this.LocalDB['allData'].get(change.id).then((doc) => {
          this.LocalDB['allData'].remove(doc);
        });
      } else {
        let cData = Object.assign({ db_name: local_db, db_seq: change.seq }, change.doc);
        this.LocalDB['allData'].putIfNotExists(cData).then((res: any) => {
          if (!res.updated) {
            this.LocalDB['allData'].upsert(res.id, function (doc) {
              return cData;
            });
          }
        });
      }
    }).on('error', (err) => {
      console.error('Change Error', err);
    });
  }

  syncToLocal(db: string) {
    return new Promise((resolve, reject) => {
      this.getAllBy('allData', { db_name: db }).then(res => {
        const docs = res.docs;
        if (docs.length > 0) {
          docs.forEach((element, index) => {
            delete element.db_name;
            delete element.db_seq;
            delete element._rev;
            this.LocalDB[db].put(element);
            if (docs.length == index + 1) {
              resolve(`Dökümanlar '${db}' Veritabınına eklendi`);
            }
          });
        } else {
          reject('Sunucuda Döküman Bulunamadı');
        }
      });
    });
  }

  handleChanges(sync) {
    const changes = sync.change.docs;
    if (sync.direction === 'pull') {
      changes.forEach((element, index) => {
        if (!element._deleted) {
          let db = element.db_name;
          delete element._rev;
          delete element._revisions;
          delete element.db_seq;
          delete element.db_name;
          this.LocalDB[db].upsert(element._id, (doc) => {
            return Object.assign(doc, element);
          });
        }
      });
    }
  }

  syncData(db: string) {
    return PouchDB.sync(this.LocalDB[db], this.RemoteDB, { live: true, retry: true })
      .on('change', (sync) => { this.handleChanges(sync) })
      .on('paused', (err) => { console.log('Sync Paused..') })
      .on('denied', (err) => { console.log('Sync Denied..') })
      .on('active', () => { console.log('Syncing...') })
      .on('complete', (info) => { console.log('Sync Complete', info) })
      .on('error', (err) => { console.error(err) });
  }
}
