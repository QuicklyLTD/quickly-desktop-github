import { Injectable, inject } from '@angular/core';
import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
import PouchDBUpsert from 'pouchdb-upsert';
import PouchDBResolve from 'pouch-resolve-conflicts';
import PouchDBInMemory from 'pouchdb-adapter-memory';
import PouchDBReplicationStream from 'pouchdb-replication-stream';
import { Buffer } from 'buffer';

import { AuthInfo, ServerInfo } from '../../models/settings';
import { FileLogService } from '../services/file-log.service';

@Injectable()
export class MainService {
  LocalDB: any;
  RemoteDB: any;
  ServerDB: any;

  private fileLogService = inject(FileLogService);

  authInfo: AuthInfo;
  serverInfo: ServerInfo;
  hostname: string;
  db_prefix: string;
  ajax_opts: object;
  private readonly legacyDbNameMap: Record<string, string> = {
    report: 'reports',
    user: 'users',
    user_group: 'users_group'
  };

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
    this.checkIndexedDbHealth();
    this.seedE2EDatabase();

    this.getAllBy('settings', { key: 'AuthInfo' }).then(res => {
      if (res.docs.length > 0) {
        this.authInfo = res.docs[0].value;
        this.hostname = 'http://' + this.authInfo.app_remote + ':' + this.authInfo.app_port;
        const authToken = Buffer.from(`${this.authInfo.app_id}:${this.authInfo.app_token}`).toString('base64');
        const authHeader = `Basic ${authToken}`;
        this.ajax_opts = {
          auth: {
            username: this.authInfo.app_id,
            password: this.authInfo.app_token
          },
          fetch: (url, opts) => {
            const options = opts || {};
            const headers = options.headers || {};
            const merged = typeof Headers !== 'undefined' ? new Headers(headers) : headers;
            if (merged instanceof Headers) {
              merged.set('Authorization', authHeader);
            } else {
              merged['Authorization'] = authHeader;
            }
            options.headers = merged;
            return PouchDB.fetch(url, options);
          }
        };
        this.db_prefix = this.authInfo.app_db;
        this.RemoteDB = new PouchDB(this.hostname + this.db_prefix, this.ajax_opts);
      }
    });

    this.getAllBy('settings', { key: 'ServerSettings' }).then(res => {
      if (res.docs.length > 0) {
        const appType = localStorage.getItem('AppType');
        switch (appType) {
          case 'Primary':
            this.serverInfo = res.docs.find(obj => obj.key === 'ServerSettings' && obj.value.type === 0).value;
            break;
          case 'Secondary':
            this.serverInfo = res.docs.find(obj => obj.key === 'ServerSettings' && obj.value.type === 1).value;
            break;
          default:
            break;
        }
        if (this.serverInfo.type === 0) {
          if (this.serverInfo.status === 1) {
            this.ServerDB = new PouchDB(`http://${this.serverInfo.ip_address}:${this.serverInfo.ip_port}/${this.serverInfo.key}/appServer`);
          }
        } else if (this.serverInfo.type === 1) {
          this.RemoteDB = new PouchDB(`http://${this.serverInfo.ip_address}:${this.serverInfo.ip_port}/${this.serverInfo.key}/appServer`);
        }
      }
    });
  }

  private seedE2EDatabase() {
    if (localStorage.getItem('E2E_TEST') !== '1') {
      return;
    }
    try {
      const raw = localStorage.getItem('appData');
      if (!raw) {
        return;
      }
      const data = JSON.parse(raw);
      const now = Date.now();
      const categories = new Map<string, { id: string; name: string }>();
      const subCategories = new Map<string, { id: string; name: string; cat_id: string }>();
      const products = (data.products || []).map((product: any) => {
        const category = product.category || 'Genel';
        const subCategory = product.subcategory || 'Genel';
        if (!categories.has(category)) {
          categories.set(category, { id: `category-${categories.size + 1}`, name: category });
        }
        const cat = categories.get(category);
        const subKey = `${category}:${subCategory}`;
        if (!subCategories.has(subKey)) {
          subCategories.set(subKey, { id: `subcat-${subCategories.size + 1}`, name: subCategory, cat_id: cat.id });
        }
        const sub = subCategories.get(subKey);
        return {
          _id: `product-${product.id}`,
          name: product.name,
          category,
          subcategory: subCategory,
          cat_id: cat.id,
          subcat_id: sub.id,
          price: product.price,
          cost: product.cost,
          stock: product.stock,
          barcode: product.barcode,
          notes: '',
          specifies: [],
          tax_value: 0,
          type: 0,
          status: 1,
          timestamp: now
        };
      });

      const categoryDocs = Array.from(categories.values()).map((entry, idx) => ({
        _id: entry.id,
        name: entry.name,
        order: idx,
        timestamp: now
      }));

      const subCategoryDocs = Array.from(subCategories.values()).map((entry, idx) => ({
        _id: entry.id,
        name: entry.name,
        cat_id: entry.cat_id,
        order: idx,
        timestamp: now
      }));

      const tables = (data.tables || []).map((table: any) => {
        const statusMap: Record<string, number> = { available: 1, occupied: 2, reserved: 3 };
        const status =
          typeof table.status === 'number' ? table.status : (statusMap[table.status] ?? 1);
        return {
          _id: table._id ?? `table-${table.id}`,
          name: table.name,
          capacity: table.capacity,
          status,
          floor_id: table.floor_id ?? table.floor ?? '',
          position: table.position,
          timestamp: now
        };
      });

      const floors = (data.floors || []).map((floor: any, idx: number) => ({
        _id: floor._id ?? `floor-${floor.id ?? idx + 1}`,
        name: floor.name ?? `Kat ${idx + 1}`,
        description: floor.description ?? '',
        status: floor.status ?? 1,
        timestamp: now,
        special: floor.special ?? 0,
        conditions: floor.conditions ?? {}
      }));

      const productIdMap = new Map<string, any>();
      products.forEach((product: any) => {
        const rawId = String(product._id).replace(/^product-/, '');
        productIdMap.set(rawId, product);
      });

      const normalizeCheckProducts = (items: any[] = []) => items.map((item: any) => {
        const product = productIdMap.get(String(item.id)) || {};
        return {
          id: product._id ?? item.id,
          cat_id: product.cat_id ?? item.cat_id,
          name: item.name ?? product.name,
          price: item.price ?? product.price,
          note: item.note ?? '',
          status: item.status ?? 2,
          owner: item.owner ?? '',
          timestamp: item.timestamp ?? now,
          tax_value: item.tax_value ?? product.tax_value ?? 0,
          barcode: item.barcode ?? product.barcode ?? 0
        };
      });

      const openChecks = (data.openChecks || []).map((check: any) => {
        const normalizedProducts = normalizeCheckProducts(check.products);
        const computedTotal = normalizedProducts.reduce((sum, item) => sum + (item.price || 0), 0);
        const totalPrice =
          Number.isFinite(check.total_price) && check.total_price > 0 ? check.total_price : computedTotal;
        return {
          _id: check._id ?? `check-${Math.random().toString(36).slice(2, 8)}`,
          table_id: check.table_id,
          total_price: totalPrice,
          discount: check.discount ?? 0,
          discountPercent: check.discountPercent,
          owner: check.owner ?? '',
          note: check.note ?? '',
          status: check.status ?? 2,
          type: check.type ?? 1,
          check_no: check.check_no ?? Math.floor(Math.random() * 500),
          timestamp: check.timestamp ?? now,
          products: normalizedProducts,
          payment_flow: check.payment_flow ?? [],
          occupation: check.occupation ?? { male: 0, female: 0 }
        };
      });

      const fastChecks = (data.fastChecks || []).map((check: any) => {
        const normalizedProducts = normalizeCheckProducts(check.products);
        const computedTotal = normalizedProducts.reduce((sum, item) => sum + (item.price || 0), 0);
        const totalPrice =
          Number.isFinite(check.total_price) && check.total_price > 0 ? check.total_price : computedTotal;
        return {
          _id: check._id ?? `fast-${Math.random().toString(36).slice(2, 8)}`,
          table_id: check.table_id ?? 'FAST',
          total_price: totalPrice,
          discount: check.discount ?? 0,
          discountPercent: check.discountPercent,
          owner: check.owner ?? '',
          note: check.note ?? '',
          status: check.status ?? 2,
          type: check.type ?? 2,
          check_no: check.check_no ?? Math.floor(Math.random() * 500),
          timestamp: check.timestamp ?? now,
          products: normalizedProducts,
          payment_flow: check.payment_flow ?? [],
          occupation: check.occupation ?? { male: 0, female: 0 }
        };
      });

      const users = (data.users || []).map((user: any) => ({
        _id: `user-${user.id}`,
        name: user.name,
        role: user.role,
        role_id: `e2e-group-${user.role}`,
        pin: user.pin,
        timestamp: now
      }));

      const usersGroup = [
        {
          _id: 'e2e-group-admin',
          name: 'Admin',
          auth: {
            components: {
              store: true,
              cashbox: true,
              endoftheday: true,
              reports: true,
              settings: true
            },
            cancelCheck: true,
            cancelProduct: true,
            discount: true,
            payment: true,
            end: true
          }
        }
      ];

      const settingsDocs = [
        { _id: 'settings-date', key: 'DateSettings', value: { day: new Date().getDay(), started: true, time: now } },
        { _id: 'settings-activation', key: 'ActivationStatus', value: true }
      ];

      const tasks = [
        this.LocalDB.categories.bulkDocs(categoryDocs),
        this.LocalDB.sub_categories.bulkDocs(subCategoryDocs),
        this.LocalDB.products.bulkDocs(products),
        this.LocalDB.floors.bulkDocs(floors),
        this.LocalDB.tables.bulkDocs(tables),
        this.LocalDB.checks.bulkDocs([...openChecks, ...fastChecks]),
        this.LocalDB.users.bulkDocs(users),
        this.LocalDB.users_group.bulkDocs(usersGroup),
        this.LocalDB.settings.bulkDocs(settingsDocs)
      ];

      Promise.all(tasks).catch(() => {});
    } catch (err) {
      console.log(err);
    }
  }

  private checkIndexedDbHealth(): void {
    const attemptedKey = 'indexeddb_reset_attempted';
    const hasAttempted = sessionStorage.getItem(attemptedKey) === '1';
    if (hasAttempted || !this.LocalDB?.allData?.info) {
      return;
    }
    this.LocalDB.allData.info().catch((err: any) => {
      const reason = String(err?.message || err?.reason || '');
      const isBad =
        err?.name === 'indexed_db_went_bad' ||
        reason.toLowerCase().includes('backing store');
      if (!isBad) {
        return;
      }
      const indexedDb =
        window.indexedDB ||
        (window as any).mozIndexedDB ||
        (window as any).webkitIndexedDB ||
        (window as any).msIndexedDB;
      if (!indexedDb) {
        return;
      }
      sessionStorage.setItem(attemptedKey, '1');
      indexedDb.deleteDatabase('local_alldata');
      indexedDb.deleteDatabase('local_settings');
      setTimeout(() => {
        window.location.reload();
      }, 300);
    });
  }

  /**
   * Standardized error logging helper
   * @param context Operation context for better debugging
   * @param err Error object
   */
  private logError(context: string, err: any): void {
    console.log(`[MainService] ${context}:`, err);
    this.fileLogService.logToFile(`Error in ${context}`, err);
  }

  private normalizeDbName(dbName?: string): string | undefined {
    if (!dbName) {
      return dbName;
    }
    return this.legacyDbNameMap[dbName] || dbName;
  }

  private getDbNameCandidates(dbName: string): string[] {
    const normalized = this.normalizeDbName(dbName);
    const legacy = Object.entries(this.legacyDbNameMap)
      .filter(([, value]) => value === normalized)
      .map(([key]) => key);
    return Array.from(new Set([normalized, ...legacy].filter(Boolean) as string[]));
  }

  getAllData(db: string): Promise<any> {
    return this.LocalDB[db].allDocs({ include_docs: true });
  }

  getAllBy(db: string, $schema): Promise<any> {
    return this.LocalDB[db].find({
      selector: $schema,
      limit: 10000
    });
  }

  async cleanupMissingTableRefs(): Promise<void> {
    const tables = await this.getAllBy('tables', {});
    const tableIds = new Set((tables?.docs || []).map((t: any) => t._id));
    const targets = ['checks', 'closed_checks', 'credits'];
    for (const db of targets) {
      const res = await this.getAllBy(db, {});
      for (const doc of res.docs || []) {
        if (doc.type !== undefined && doc.type !== 1) {
          continue;
        }
        if (doc.table_id && !tableIds.has(doc.table_id)) {
          this.logError(`cleanupMissingTableRefs-${db}`, doc);
          await this.removeData(db, doc._id);
        }
      }
    }
    const reportRes = await this.getAllBy('reports', { type: 'Table' });
    for (const report of reportRes.docs || []) {
      if (report.connection_id && !tableIds.has(report.connection_id)) {
        this.logError('cleanupMissingTableRefs-reports', report);
        await this.removeData('reports', report._id);
      }
    }
  }

  getData(db: string, id: string): Promise<any> {
    return this.LocalDB[db].get(id).catch(err => {
      this.logError(`getData-${db}`, err);
      if (err && err.status === 404) {
        return null;
      }
      throw err;
    });
  }

  getBulk(db: string, docs: Array<string>): Promise<any> {
    return this.LocalDB[db].bulkGet(docs);
  }

  addData(db, schema): Promise<any> {
    if (schema && (schema._rev === undefined || schema._rev === null || schema._rev === '')) {
      delete schema._rev;
    }
    return this.LocalDB[db].post(schema).then(res => {
      const doc = Object.assign(schema, { db_name: db, db_seq: 0 });
      if (!doc._id) {
        doc._id = res.id;
      }
      delete doc._rev;
      delete doc._rev_tree;
      return this.LocalDB['allData'].put(doc).catch(err => {
        this.logError('addData-All', err);
      });
    }).catch(err => {
      this.logError('addData-Local', err);
      return { ok: false, error: err };
    });
  }

  changeData(db, id, schema: any): Promise<any> {
    this.LocalDB['allData'].upsert(id, schema).catch(err => {
      this.logError('changeData-Local', err);
    });
    return this.LocalDB[db].upsert(id, schema).catch(err => {
      this.logError('changeData-All', err);
    });
  }

  updateData(db: string, id, schema) {
    return this.LocalDB[db].get(id).then((doc) => {
      this.LocalDB['allData'].upsert(id, function (existingDoc) {
        return Object.assign(existingDoc, schema);
      }).catch(err => {
        this.logError('updateData-Local', err);
      });
      return this.LocalDB[db].put(Object.assign(doc, schema)).catch(err => {
        this.logError('updateData-All', err);
      });
    });
  }

  removeData(db: string, id: string): Promise<any> {
    this.LocalDB['allData'].get(id).then((doc) => {
      this.LocalDB['allData'].remove(doc).catch(err => {
        this.logError('removeData-All', err);
      });
    });
    return this.LocalDB[db].get(id).then((doc) => {
      return this.LocalDB[db].remove(doc).catch(err => {
        this.logError('removeData-Local', err);
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
              if (db.length === index + 1) {
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
          this.LocalDB['allData'].remove(doc).catch(err => {
            this.logError('localSyncBeforeRemote-remove', err);
            throw err;
          });
        }).catch(err => {
          this.logError('localSyncBeforeRemote-get', err);
          throw err;
        });
      } else {
        const cData = Object.assign({ db_name: local_db, db_seq: change.seq }, change.doc);
        this.LocalDB['allData'].putIfNotExists(cData).then((res: any) => {
          if (!res.updated) {
            this.LocalDB['allData'].upsert(res.id, function () {
              return cData;
            }).catch(err => {
              this.logError('localSyncBeforeRemote-upsert', err);
              throw err;
            });
          }
        }).catch(err => {
          this.logError('localSyncBeforeRemote-putIfNotExists', err);
          throw err;
        });
      }
    });
  }

  handleChanges(sync) {
    const changes = sync.change.docs;
    if (sync.direction === 'pull') {
      changes.forEach((element) => {
        if (!element._deleted) {
          const db = element.db_name;
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
          for (const dbName in this.LocalDB) {
            if (dbName !== 'allData') {
              this.LocalDB[dbName].get(element._id).then((doc) => {
                if (doc) {
                  return this.LocalDB[dbName].remove(doc).catch(err => {
                    this.logError(`handleChanges-remove-${dbName}`, err);
                  });
                }
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
        const docs = res.docs;
        const docsWillPut = docs.filter(obj => obj.db_name !== 'settings');
        docsWillPut.map(obj => {
          delete obj.db_seq;
          delete obj._rev;
          return obj;
        });
        const promisesAll = [];
        docsWillPut.forEach(element => {
          const db = this.normalizeDbName(element.db_name);
          delete element.db_name;
          if (db !== undefined) {
            if (!this.LocalDB[db]) {
              this.fileLogService.logToFile('loadAppData: unknown db', { db_name: db, doc_id: element._id });
              this.LocalDB['allData'].get(element._id).then(doc => {
                this.LocalDB['allData'].remove(doc).catch(err => {
                  this.logError('loadAppData: remove-unknown-db', err);
                });
              }).catch(err => {
                this.logError('loadAppData: get-unknown-db', err);
              });
              return;
            }
            const promise = this.LocalDB[db].put(element);
            promisesAll.push(promise);
          }
        });
        Promise.all(promisesAll).then(results => {
          resolve(true);
        }).catch(err => {
          console.log(err);
          //// Should Be False Reject
          resolve(true);
        });
      }).catch(err => {
        console.log(err);
        reject(false);
      });
    });
  }

  syncToLocal(database?: string) {
    let selector;
    if (database) {
      const candidates = this.getDbNameCandidates(database);
      selector = candidates.length > 1 ? { db_name: { $in: candidates } } : { db_name: candidates[0] };
    } else {
      selector = {};
    }
    return new Promise((resolve, reject) => {
      this.getAllBy('allData', selector).then(res => {
        const docs = res.docs;
        if (docs.length > 0) {
          docs.forEach((element, index) => {
            const db = this.normalizeDbName(element.db_name);
            if (db !== undefined) {
              if (element.key !== 'ServerSettings') {
                delete element.db_name;
                delete element.db_seq;
                delete element._rev;
                if (!this.LocalDB[db]) {
                  this.logError('syncToLocal: unknown db', { db_name: db, doc_id: element._id });
                  return;
                }
                this.LocalDB[db].put(element).then(putRes => {
                  if (docs.length === index + 1) {
                    resolve(true);
                  }
                }).catch(err => {
                  console.log(db, element);
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
    const db = new PouchDB(`http://${db_configrations.ip_address}:${db_configrations.ip_port}/${db_configrations.key}/appServer`);
    return db.replicate.to(this.LocalDB['allData'], {
      batch_size: 500,
      batches_limit: 50,
      timeout: 60000,
      selector: { _deleted: { $exists: false } }
    });
  }

  replicateFrom() {
    return this.RemoteDB.replicate.to(this.LocalDB['allData'], {
      selector: { _deleted: { $exists: false } }
    });
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
    if (this.serverInfo.type === 1) {
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
