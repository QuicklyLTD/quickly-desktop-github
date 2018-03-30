import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Table } from '../mocks/table.mock';
import { Check } from '../mocks/check.mock';
import { Product } from '../mocks/product.mock';
import { Log } from '../mocks/log.mock';

@Injectable()
export class ReactiveDataService {
  tables: Subject<Table[]>;
  checks: Subject<Check[]>;
  products: Subject<Product[]>;
  logs: Subject<Log[]>;

  constructor() {
    this.tables = new Subject<Table[]>();
    this.checks = new Subject<Check[]>();
    this.products = new Subject<Product[]>();
  }

  getTables() {
    return this.tables.asObservable();
  }
  getProducts() {
    return this.products.asObservable();
  }
  getCheck() {
    return this.checks.asObservable();
  }
  getLogs() {
    return this.logs.asObservable();
  }

}