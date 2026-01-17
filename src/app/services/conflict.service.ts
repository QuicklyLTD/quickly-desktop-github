import { Injectable } from '@angular/core';
import { MainService } from './main.service';

@Injectable()
export class ConflictService {

  constructor(private mainService: MainService) { }

  conflictListener() {
    return setInterval(() => {
      this.getConflicts().then(conflicts => {
        if (conflicts.length > 0) {
          conflicts.forEach(conflicted_document => {
            this.getPreRevision(conflicted_document).then(older_document => {
              this.conflictResolver(conflicted_document, older_document);
            }).catch(err => {
              this.conflictResolver(conflicted_document);
            });
          });
        }
      })
    }, 60000)
  }

  conflictResolver(conflicted_document: any, older_document?: any) {
    this.mainService.ServerDB.resolveConflicts(conflicted_document, (a, b) => {
      return this.diffResolver(a, b, older_document);
    }).catch(err => { });
  }

  getConflicts() {
    return this.mainService.ServerDB.allDocs({ include_docs: true, conflicts: true, revs: true }).then(res => {
      return res.rows.map(obj => { return obj.doc }).filter(obj => obj.hasOwnProperty('_conflicts'));
    });
  }

  getPreRevision(conflicted_document: any) {
    return this.mainService.ServerDB.get(conflicted_document._id, { revs: true }).then(res => {
      const revToGet = `${res._revisions.start - 1}-${res._revisions.ids[1]}`;
      return this.mainService.ServerDB.get(res._id, { rev: revToGet });
    });
  }

  diffResolver(a: any, b: any, older_document?: any) {
    if (older_document !== undefined) {
      if (older_document.db_name === 'reports') {
        const aDiff = this.diffReduce(a, older_document);
        const bDiff = this.diffReduce(b, older_document);
        const resolvedDoc = JSON.parse(JSON.stringify(older_document));
        const olderACopy = JSON.parse(JSON.stringify(older_document));
        const olderBCopy = JSON.parse(JSON.stringify(older_document));
        aDiff.forEach(diff => {
          if (diff.hasOwnProperty('secondProp')) {
            resolvedDoc[diff.firsProp][diff.secondProp] += Math.abs(olderACopy[diff.firsProp][diff.secondProp] - diff.data);
          } else {
            resolvedDoc[diff.firsProp] += Math.abs(olderACopy[diff.firsProp] - diff.data);
          }
        });
        bDiff.forEach(diff => {
          if (diff.hasOwnProperty('secondProp')) {
            resolvedDoc[diff.firsProp][diff.secondProp] += Math.abs(olderBCopy[diff.firsProp][diff.secondProp] - diff.data);
          } else {
            resolvedDoc[diff.firsProp] += Math.abs(olderBCopy[diff.firsProp] - diff.data);
          }
        });
        console.log('OLDER', older_document);
        console.log('A_REV', a);
        console.log('B_REV', b);
        console.log('RESOLVED', resolvedDoc);
        this.mainService.ServerDB.remove(a).then((res) => {
          if (res.ok) {
            this.mainService.ServerDB.remove(b).then((removeRes) => {
              if (removeRes.ok) {
                delete resolvedDoc._rev;
                this.mainService.ServerDB.put(resolvedDoc).then(putRes => {
                  console.log(putRes);
                });
              }
            });
          }
        });
      } else {
        console.log('Have OlderDoc Out Of Reports!', a, b);
        if (a.timestamp > b.timestamp) {
          this.diffRecreate(a, b);
        }
        if (b.timestamp > a.timestamp) {
          this.diffRecreate(b, a);
        }
        if (b.timestamp === a.timestamp) {
          this.diffRevision(a, b);
        }
      }
    } else {
      console.log('No OlderDoc', a);
      this.diffRecreate(a, b);
    }
  }

  diffRevision(a, b) {
    const aRev = a._rev.split('-')[0];
    const bRev = b._rev.split('-')[0];
    if (aRev > bRev) {
      this.diffRecreate(a, b);
    }
    if (bRev > aRev) {
      this.diffRecreate(b, a);
    }
  }

  diffRecreate(first, second) {
    console.log('Creating Diff', first);
    this.mainService.ServerDB.remove(first).then(res1 => {
      if (res1.ok) {
        this.mainService.ServerDB.remove(second).then(res2 => {
          if (res2.ok) {
            delete first._rev;
            this.mainService.ServerDB.put(first).then(res3 => {
              console.log(res3);
            }).catch(err => {
              console.log(err);
              console.log('First Put Error', first);
            });
          }
        }).catch(err => {
          console.log(err);
          console.log('Second Remove Error', first);
        });
      }
    }).catch(err => {
      console.log(err);
      console.log('First Remove Error', first);
    });
  }

  diffReduce(reduce_element, older_element) {
    const objDiff: any = this.deepDiffMapper().map(reduce_element, older_element);
    const parsedDiff: Array<any> = this.diffParser('updated', objDiff);
    return parsedDiff;
  }

  diffParser(diffType: string, objDiff: any) {
    delete objDiff._id;
    delete objDiff._rev;
    delete objDiff._conflicts;
    const diffObjArr: Array<object> = [];
    for (const prop in objDiff) {
      if (Object.keys(objDiff[prop]).length > 2) {
        for (const innerProp in objDiff[prop]) {
          if (objDiff[prop][innerProp].type === diffType) {
            const diffObj = {
              firsProp: prop,
              secondProp: innerProp,
              data: objDiff[prop][innerProp].data
            };
            diffObjArr.push(diffObj);
          }
        }
      } else {
        if (objDiff[prop].type === diffType) {
          const diffObj = {
            firsProp: prop,
            data: objDiff[prop].data
          };
          diffObjArr.push(diffObj);
        }
      }
    }
    return diffObjArr;
  }

  deepDiffMapper() {
    return {
      VALUE_CREATED: 'created',
      VALUE_UPDATED: 'updated',
      VALUE_DELETED: 'deleted',
      VALUE_UNCHANGED: 'unchanged',
      map: function (obj1, obj2) {
        if (this.isFunction(obj1) || this.isFunction(obj2)) {
          throw new Error('Invalid argument. Function given, object expected.');
        }
        if (this.isValue(obj1) || this.isValue(obj2)) {
          return {
            type: this.compareValues(obj1, obj2),
            data: (obj1 === undefined) ? obj2 : obj1
          };
        }
        const diff = {};
        for (const key1 in obj1) {
          if (this.isFunction(obj1[key1])) {
            continue;
          }
          let value2 = undefined;
          if ('undefined' !== typeof (obj2[key1])) {
            value2 = obj2[key1];
          }
          diff[key1] = this.map(obj1[key1], value2);
        }
        for (const key2 in obj2) {
          if (this.isFunction(obj2[key2]) || ('undefined' !== typeof (diff[key2]))) {
            continue;
          }
          diff[key2] = this.map(undefined, obj2[key2]);
        }
        return diff;
      },
      compareValues: function (value1, value2) {
        if (value1 === value2) {
          return this.VALUE_UNCHANGED;
        }
        if (this.isDate(value1) && this.isDate(value2) && value1.getTime() === value2.getTime()) {
          return this.VALUE_UNCHANGED;
        }
        if ('undefined' === typeof (value1)) {
          return this.VALUE_CREATED;
        }
        if ('undefined' === typeof (value2)) {
          return this.VALUE_DELETED;
        }
        return this.VALUE_UPDATED;
      },
      isFunction: function (obj) {
        return {}.toString.apply(obj) === '[object Function]';
      },
      isArray: function (obj) {
        return {}.toString.apply(obj) === '[object Array]';
      },
      isDate: function (obj) {
        return {}.toString.apply(obj) === '[object Date]';
      },
      isObject: function (obj) {
        return {}.toString.apply(obj) === '[object Object]';
      },
      isValue: function (obj) {
        return !this.isObject(obj) && !this.isArray(obj);
      }
    }
  }
}
