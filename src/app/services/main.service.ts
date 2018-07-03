import { Injectable } from '@angular/core';
import * as PouchDB from 'pouchdb-browser';
import * as PouchDBFind from 'pouchdb-find';
import * as PouchDBUpsert from 'pouchdb-upsert';
import { AuthInfo, ServerInfo } from '../mocks/settings.mock';
import { ElectronService } from '../providers/electron.service';
import { MessageService } from '../providers/message.service';
import { TerminalService } from '../providers/terminal.service';

@Injectable()
export class MainService {
  LocalDB: object;
  RemoteDB: PouchDB.Database;
  ServerDB: PouchDB.Database;
  /////////////////////////////////
  hostname: string;
  db_prefix: string;
  ajax_opts: object;
  /////////////////////////////////
  authInfo: AuthInfo;
  serverInfo: ServerInfo;

  constructor(private messageService: MessageService, private terminal: TerminalService, private electron: ElectronService) {
    PouchDB.plugin(PouchDBFind);
    PouchDB.plugin(PouchDBUpsert);

    this.LocalDB = {
      users: new PouchDB('local_users'),
      users_group: new PouchDB('local_users_group'),
      checks: new PouchDB('local_checks'),
      closed_checks: new PouchDB('local_closed_checks'),
      credits: new PouchDB('local_credits'),
      customers: new PouchDB('local_customers'),
      orders: new PouchDB('local_orders'),
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

    this.getAllBy('settings', { key: 'AuthInfo' }).then(res => {
      if (res.docs.length > 0) {
        this.authInfo = res.docs[0].value;
        this.hostname = 'http://' + this.authInfo.app_remote + ':' + this.authInfo.app_port;
        this.ajax_opts = { ajax: { headers: { Authorization: 'Basic ' + Buffer.from(this.authInfo.app_id + ':' + this.authInfo.app_token).toString('base64') } } };
        this.db_prefix = this.authInfo.app_db;
        this.RemoteDB = new PouchDB(this.hostname + this.db_prefix, this.ajax_opts);
      }
    });

    this.getAllBy('settings', { key: 'ServerSettings' }).then(res => {
      if (res.docs.length > 0) {
        this.serverInfo = res.docs[0].value;
        if (this.serverInfo.type == 0) {
          if (this.serverInfo.status == 1) {
            this.ServerDB = new PouchDB(`http://${this.serverInfo.ip_address}:${this.serverInfo.ip_port}/${this.serverInfo.key}/appServer`);
          }
        } else if (this.serverInfo.type == 1) {
          this.RemoteDB = new PouchDB(`http://${this.serverInfo.ip_address}:${this.serverInfo.ip_port}/${this.serverInfo.key}/appServer`);
        }
      }
    });
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

  clearAll(db: string, $schema: any) {
    return this.getAllBy(db, $schema).then(res => {
      return res.docs.map(obj => {
        return { _id: obj._id, _rev: obj._rev, _deleted: true };
      });
    }).then(deleteDocs => {
      return this.LocalDB[db].bulkDocs(deleteDocs);
    });
  }

  createIndex(db: string) {
    this.LocalDB[db].createIndex({
      index: {
        fields: ['description', 'time', 'cash', 'card', 'coupon']
      }
    });
  }

  compactDB(db) {
    return this.LocalDB[db].compact();
  }

  localSyncBeforeRemote(local_db) {
    return this.LocalDB[local_db].changes({ since: 'now', include_docs: true }).on('change', (change) => {
      if (change.deleted) {
        this.LocalDB['allData'].get(change.id).then((doc) => {
          this.LocalDB['allData'].remove(doc);
        });
      } else {
        let cData = Object.assign({ db_name: local_db, db_seq: change.seq }, change.doc);
        this.LocalDB['allData'].putIfNotExists(cData).then((res: any) => {
          if (!res.updated) {
            this.LocalDB['allData'].upsert(res.id, function () {
              return cData;
            });
          }
        });
      }
    }).on('error', (err) => {
      console.error('Change Error', err);
    });
  }

  handleChanges(sync) {
    const changes = sync.change.docs;
    if (sync.direction === 'pull') {
      changes.forEach((element) => {
        if (!element._deleted) {
          let db = element.db_name;
          if (element.key !== 'ServerSettings') {
            delete element._rev;
            delete element._revisions;
            delete element.db_seq;
            delete element.db_name;
            this.LocalDB[db].upsert(element._id, (doc) => {
              return Object.assign(doc, element);
            });
          }
        } else {
          Object.keys(this.LocalDB).forEach(db => {
            this.LocalDB[db].get(element._id).then((doc) => {
              if (doc) {
                this.LocalDB[db].remove(doc);
              }
            }).catch(err => { });
          });
        }
      });
    }
  }

  replicateDB(db_configrations) {
    let db = new PouchDB(`http://${db_configrations.ip_address}:${db_configrations.ip_port}/${db_configrations.key}/appServer`);
    return db.replicate.to(this.LocalDB['allData']);
  }

  syncToLocal(database?: string) {
    let selector;
    if (database) {
      selector = { db_name: database };
    } else {
      selector = {}
    }
    return new Promise((resolve, reject) => {
      this.getAllBy('allData', selector).then(res => {
        const docs = res.docs;
        if (docs.length > 0) {
          docs.forEach((element, index) => {
            let db = element.db_name;
            if (db !== undefined) {
              if (element.key !== 'ServerSettings') {
                delete element.db_name;
                delete element.db_seq;
                delete element._rev;
                this.LocalDB[db].put(element);
              }
              if (docs.length == index + 1) {
                resolve(true);
              }
            }
          });
        } else {
          reject({ ok: false });
        }
      });
    });
  }

  syncToServer() {
    return PouchDB.sync(this.LocalDB['allData'], this.ServerDB, { live: true, retry: true }).on('change', (sync) => { this.handleChanges(sync) });
  }

  syncToRemote() {
    return PouchDB.sync(this.LocalDB['allData'], this.RemoteDB, { live: true, retry: true }).on('change', (sync) => { this.handleChanges(sync) });
  }
}