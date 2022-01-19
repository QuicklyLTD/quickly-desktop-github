import { Injectable } from '@angular/core';
import * as PouchDB from 'pouchdb-browser';
import * as PouchDBFind from 'pouchdb-find';
import * as PouchDBUpsert from 'pouchdb-upsert';
import * as PouchDBResolve from 'pouch-resolve-conflicts';
import * as PouchDBInMemory from 'pouchdb-adapter-memory';
import * as PouchDBReplicationStream from 'pouchdb-replication-stream';

import { AuthInfo, ServerInfo } from '../mocks/settings';

@Injectable()
export class MainService {
  LocalDB: Object;
  RemoteDB: PouchDB.Database | any;
  ServerDB: PouchDB.Database | any;

  authInfo: AuthInfo;
  serverInfo: ServerInfo;
  hostname: string;
  db_prefix: string;
  ajax_opts: object;

  constructor() {
    PouchDB.plugin(PouchDBFind);
    PouchDB.plugin(PouchDBUpsert);
    PouchDB.plugin(PouchDBResolve);
    PouchDB.plugin(PouchDBInMemory);
    PouchDB.plugin(PouchDBReplicationStream.plugin);
    

    const db_opts = { revs_limit: 1, auto_compaction: true, adapter: 'memory' };

    this.LocalDB = {
      users: new PouchDB('local_users', db_opts),
      users_group: new PouchDB('local_users_group', db_opts),
      checks: new PouchDB('local_checks', db_opts),
      closed_checks: new PouchDB('local_closed_checks', db_opts),
      credits: new PouchDB('local_credits', db_opts),
      customers: new PouchDB('local_customers', db_opts),
      orders: new PouchDB('local_orders', db_opts),
      receipts: new PouchDB('local_receipts', db_opts),
      calls: new PouchDB('local_calls', db_opts),
      cashbox: new PouchDB('local_cashbox', db_opts),
      categories: new PouchDB('local_categories', db_opts),
      sub_categories: new PouchDB('local_sub_cats', db_opts),
      occations: new PouchDB('local_occations', db_opts),
      products: new PouchDB('local_products', db_opts),
      recipes: new PouchDB('local_recipes', db_opts),
      floors: new PouchDB('local_floors', db_opts),
      tables: new PouchDB('local_tables', db_opts),
      stocks: new PouchDB('local_stocks', db_opts),
      stocks_cat: new PouchDB('local_stocks_cat', db_opts),
      endday: new PouchDB('local_endday', db_opts),
      reports: new PouchDB('local_reports', db_opts),
      logs: new PouchDB('local_logs', db_opts),
      commands: new PouchDB('local_commands', db_opts),
      comments: new PouchDB('local_comments', db_opts),
      prints: new PouchDB('local_prints', db_opts),
      settings: new PouchDB('local_settings', { revs_limit: 3, auto_compaction: true }),
      allData: new PouchDB('local_alldata', { revs_limit: 3, auto_compaction: false })
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
        let appType = localStorage.getItem('AppType');
        switch (appType) {
          case 'Primary':
            this.serverInfo = res.docs.find(obj => obj.key == 'ServerSettings' && obj.value.type == 0).value;
            break;
          case 'Secondary':
            this.serverInfo = res.docs.find(obj => obj.key == 'ServerSettings' && obj.value.type == 1).value;
          default:
            break;
        }
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

  getAllData(db: string): Promise<any> {
    return this.LocalDB[db].allDocs({ include_docs: true });
  }

  getAllBy(db: string, $schema): Promise<any> {
    return this.LocalDB[db].find({
      selector: $schema,
      limit:10000
    });
  }

  getData(db: string, id: string): Promise<any> {
    return this.LocalDB[db].get(id);
  }

  getBulk(db: string, docs: Array<string>): Promise<any> {
    return this.LocalDB[db].bulkGet(docs);
  }

  addData(db, schema): Promise<any> {
    return this.LocalDB[db].post(schema).then(res => {
      let doc = Object.assign(schema, { db_name: db, db_seq: 0 });
      delete doc._rev;
      delete doc._rev_tree;
      return this.LocalDB['allData'].put(doc).catch(err => {
        console.log('addData-All', err);
      });
    }).catch(err => {
      console.log('addData-Local', err);
    });;
  }

  changeData(db, id, schema: any): Promise<any> {
    this.LocalDB['allData'].upsert(id, schema).catch(err => {
      console.log('changeData-Local', err);
    });
    return this.LocalDB[db].upsert(id, schema).catch(err => {
      console.log('changeData-All', err);
    });;
  }

  updateData(db: string, id, schema) {
    return this.LocalDB[db].get(id).then((doc) => {
      this.LocalDB['allData'].upsert(id, function (doc) {
        return Object.assign(doc, schema);
      }).catch(err => {
        console.log('updateData-Local', err);
      });
      return this.LocalDB[db].put(Object.assign(doc, schema)).catch(err => {
        console.log('updateData-All', err);
      });
    });
  }

  removeData(db: string, id: string): Promise<any> {
    this.LocalDB['allData'].get(id).then((doc) => {
      this.LocalDB['allData'].remove(doc).catch(err => {
        console.log('removeData-All', err);
      });
    });
    return this.LocalDB[db].get(id).then((doc) => {
      return this.LocalDB[db].remove(doc).catch(err => {
        console.log('removeData-Local', err);
      });
    });
  }

  putDoc(db: string, doc: any): Promise<any> {
    return this.LocalDB[db].put(doc);
  }

  removeDoc(db: string, doc: any): Promise<any> {
    return this.LocalDB[db].remove(doc);
  }

  putAll(db: string, docs: Array<any>): Promise<any> {
    return this.LocalDB[db].bulkDocs(docs);
  }

  removeAll(db: string, $schema: any): Promise<any> {
    return this.getAllBy(db, $schema).then(res => {
      return res.docs.map(obj => {
        return { _id: obj._id, _rev: obj._rev, _deleted: true };
      });
    }).then(deleteDocs => {
      return this.LocalDB[db].bulkDocs(deleteDocs);
    });
  }

  createIndex(db: string, fields: Array<string>): Promise<any> {
    return this.LocalDB[db].createIndex({
      index: {
        fields: fields
      }
    });
  }

  destroyDB(db: string | Array<string>) {
    if (Array.isArray(db)) {
      return new Promise((resolve, reject) => {
        db.forEach((db_name, index) => {
          this.LocalDB[db_name].destroy().then(res => {
            if (res.ok) {
              console.log(db_name, 'DB destroyed.');
              if (db.length == index + 1) {
                resolve({ ok: true });
              }
            } else {
              console.error(db_name, 'DB not destroyed!');
              reject({ ok: false })
            }
          })
        })
      });
    } else {
      return this.LocalDB[db].destroy();
    }
  }

  compactDB(db: string) {
    return this.LocalDB[db].compact();
  }

  initDatabases() {
    const db_opts = { revs_limit: 1, auto_compaction: true, adapter: 'memory' };
    this.LocalDB = {
      users: new PouchDB('local_users', db_opts),
      users_group: new PouchDB('local_users_group', db_opts),
      checks: new PouchDB('local_checks', db_opts),
      closed_checks: new PouchDB('local_closed_checks', db_opts),
      credits: new PouchDB('local_credits', db_opts),
      customers: new PouchDB('local_customers', db_opts),
      orders: new PouchDB('local_orders', db_opts),
      receipts: new PouchDB('local_receipts', db_opts),
      calls: new PouchDB('local_calls', db_opts),
      cashbox: new PouchDB('local_cashbox', db_opts),
      categories: new PouchDB('local_categories', db_opts),
      sub_categories: new PouchDB('local_sub_cats', db_opts),
      occations: new PouchDB('local_occations', db_opts),
      products: new PouchDB('local_products', db_opts),
      recipes: new PouchDB('local_recipes', db_opts),
      floors: new PouchDB('local_floors', db_opts),
      tables: new PouchDB('local_tables', db_opts),
      stocks: new PouchDB('local_stocks', db_opts),
      stocks_cat: new PouchDB('local_stocks_cat', db_opts),
      endday: new PouchDB('local_endday', db_opts),
      reports: new PouchDB('local_reports', db_opts),
      logs: new PouchDB('local_logs', db_opts),
      commands: new PouchDB('local_commands', db_opts),
      comments: new PouchDB('local_comments', db_opts),
      prints: new PouchDB('local_prints', db_opts),
      settings: new PouchDB('local_settings', { revs_limit: 3, auto_compaction: true }),
      allData: new PouchDB('local_alldata', { revs_limit: 3, auto_compaction: false })
    };
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
    });
  }

  handleChanges(sync) {
    const changes = sync.change.docs;
    if (sync.direction === 'pull') {
      changes.forEach((element) => {
        if (!element._deleted) {
          let db = element.db_name;
          if (element.key !== 'ServerSettings' || element.key !== 'ActivationStatus') {
            delete element._rev;
            delete element._revisions;
            delete element.db_seq;
            delete element.db_name;
            this.LocalDB[db].upsert(element._id, (doc) => {
              return Object.assign(doc, element);
            }).catch(err => {
              console.log(err);
            });
          }
        } else {
          for (let db in this.LocalDB) {
            if (db !== 'allData') {
              this.LocalDB[db].get(element._id).then((doc) => {
                if (doc) return this.LocalDB[db].remove(doc);
              }).catch(err => { });
            }
          }
        }
      });
    }
  }

  loadAppData() {
    return new Promise((resolve, reject) => {
      this.getAllBy('allData', {}).then(res => {
        let docs = res.docs;
        let docsWillPut = docs.filter(obj => obj.db_name !== 'settings');
        docsWillPut.map(obj => {
          delete obj.db_seq;
          delete obj._rev;
          return obj;
        });
        let promisesAll = [];
        docsWillPut.forEach(element => {
          const db = element.db_name;
          delete element.db_name;
          if (db !== undefined) {
            let promise = this.LocalDB[db].put(element)
            promisesAll.push(promise);
          }
        });
        Promise.all(promisesAll).then(res => {
          resolve(true)
        }).catch(err => {
          console.log(err);
          //// Should Be False Reject
          resolve(true)
        })
      }).catch(err => {
        console.log(err);
        reject(false);
      })
    });
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
                this.LocalDB[db].put(element).then(res => {
                  if (docs.length == index + 1) {
                    resolve(true);
                  }
                }).catch(err => {
                  console.log(db, element)
                });
              }
            }
          });
        } else {
          reject(false);
        }
      });
    });
  }

  replicateDB(db_configrations) {
    let db = new PouchDB(`http://${db_configrations.ip_address}:${db_configrations.ip_port}/${db_configrations.key}/appServer`);
    return db.replicate.to(this.LocalDB['allData'], { batch_size: 500, batches_limit: 50, timeout:60000 });
  }

  replicateFrom() {
    return this.RemoteDB.replicate.to(this.LocalDB['allData']);
  }

  syncToServer() {
    return PouchDB.sync(this.LocalDB['allData'], this.ServerDB, {
      live: true, retry: true, heartbeat: 2500, back_off_function: (delay) => {
        delay = 1000;
        return delay;
      }
    })
      .on('change', (sync) => { this.handleChanges(sync) })
    // .on('active', () => { console.log('Server Active') })
    // .on('paused', (err) => { console.log('Server Paused', err) })
    // .on('error', (err) => { console.error('Server Error', err) });
  }

  syncToRemote() {
    let rOpts: PouchDB.Replication.ReplicateOptions = { live: true, retry: true };
    if (this.serverInfo.type == 1) {
      rOpts = {
        live: true, retry: true, heartbeat: 2500, back_off_function: (delay) => {
          delay = 1000;
          return delay;
        }
      };
    }
    return PouchDB.sync(this.LocalDB['allData'], this.RemoteDB, rOpts)
      .on('change', (sync) => { this.handleChanges(sync) })
    // .on('active', () => { console.log('Remote Active') })
    // .on('paused', (err) => { console.log('Remote Paused', err) })
    // .on('error', (err) => { console.error('Remote Error', err) });
  }
}