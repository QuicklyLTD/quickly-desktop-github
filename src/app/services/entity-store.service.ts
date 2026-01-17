import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { MainService } from './main.service';

import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/shareReplay';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class EntityStoreService {
  private readonly enableCache = true;
  private readonly cache = new Map<string, Observable<any>>();

  constructor(private mainService: MainService) {}

  clearCache(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    Array.from(this.cache.keys()).forEach((key) => {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    });
  }

  resolve$(db: string, id: any, property: string = 'name'): Observable<any> {
    if (id === null || id === undefined || id === '') {
      return Observable.of('');
    }
    const normalizedId = typeof id === 'object' && id && id._id ? id._id : String(id);
    if (!db) {
      return Observable.of(normalizedId);
    }

    const cacheKey = `${db}:${normalizedId}:${property || ''}`;
    if (this.enableCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const stream = Observable.defer(() =>
      Observable.fromPromise(this.mainService.getData(db, normalizedId))
    )
      .map((doc: any) => {
        if (!doc) {
          return normalizedId;
        }
        if (!property) {
          return doc;
        }
        const value = doc[property];
        if (value === null || value === undefined || value === '') {
          return doc.name || normalizedId;
        }
        return value;
      })
      .catch(() => Observable.of(normalizedId))
      .shareReplay(1);

    if (this.enableCache) {
      this.cache.set(cacheKey, stream);
    }
    return stream;
  }

  resolveEntity(db: string, id: any, property?: string): Promise<any> {
    return this.resolve$(db, id, property || 'name').toPromise();
  }

  resolveEntities(db: string, ids: string[], property?: string): Promise<Map<string, any>> {
    const result = new Map<string, any>();
    const uniqueIds = Array.from(new Set((ids || []).filter(Boolean)));
    return Promise.all(uniqueIds.map((id) =>
      this.resolveEntity(db, id, property).then((value) => {
        result.set(id, value);
      })
    )).then(() => result);
  }
}

