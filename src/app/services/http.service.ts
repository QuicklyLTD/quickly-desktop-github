import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

const AUTH_PREFIX = "JWT";

@Injectable()
export class HttpClient {

  constructor(private http: Http) { }

  private _createAuthorizationHeader(headers: Headers) {
    headers.append('Authorization', AUTH_PREFIX +
      btoa('username:password'));
  }

  get(url) {
    let headers = new Headers();
    this._createAuthorizationHeader(headers);
    return this.http.get(url, {
      headers: headers
    });
  }

  post(url, data) {
    let headers = new Headers();
    this._createAuthorizationHeader(headers);
    return this.http.post(url, data, {
      headers: headers
    });
  }

  put(url, data) {
    let headers = new Headers();
    this._createAuthorizationHeader(headers);
    return this.http.post(url, data, {
      headers: headers
    });
  }

  delete(url) {
    let headers = new Headers();
    this._createAuthorizationHeader(headers);
    return this.http.get(url, {
      headers: headers
    });
  }
}