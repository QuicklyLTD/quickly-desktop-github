import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

const AUTH_PREFIX = "JWT ";

@Injectable()
export class HttpService {
  headers: Headers;
  options: RequestOptions;
  baseUrl: string;
  apiVersion: string;

  constructor(private http: Http) {
    this.headers = new Headers({ 'Content-Type': 'application/json', 'charset': 'UTF-8' });
    this.options = new RequestOptions({ headers: this.headers });
    this.baseUrl = 'https://api.quickly.com.tr/';
    this.apiVersion = 'v1';
  }

  private _createAuthorizationHeader(headers: Headers, token?: string) {
    headers.set('Authorization', AUTH_PREFIX + token);
  }

  get(url, token?) {
    this._createAuthorizationHeader(this.headers, token);
    return this.http.get(this.baseUrl + url, {
      headers: this.headers
    });
  }

  post(url, data, token?) {
    this._createAuthorizationHeader(this.headers, token);
    return this.http.post(this.baseUrl + url, data, {
      headers: this.headers
    });
  }

  put(url, data, token?) {
    this._createAuthorizationHeader(this.headers, token);
    return this.http.post(this.baseUrl + url, data, {
      headers: this.headers
    });
  }

  delete(url, token?) {
    this._createAuthorizationHeader(this.headers, token);
    return this.http.get(this.baseUrl + url, {
      headers: this.headers
    });
  }
}