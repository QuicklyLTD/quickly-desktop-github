import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { MainService } from './main.service';

@Injectable()
export class HttpService {
  headers: Headers;
  options: RequestOptions;
  baseUrl: string;
  store_id: string;

  constructor(private http: Http, private mainService: MainService) {
    this.headers = new Headers({ 'Content-Type': 'application/json', 'charset': 'UTF-8' });
    this.options = new RequestOptions({ headers: this.headers });
    // this.baseUrl = 'http://localhost:3000'; // 'https://hq.quickly.com.tr';
    this.baseUrl = 'https://hq.quickly.com.tr';

    // this.baseUrl = 'http://192.168.0.29:3000'

    this.mainService.getAllBy('settings', { key: 'RestaurantInfo' }).then(res => {
      this.store_id = res.docs[0].value._id;
    })
  }

  private _createAuthorizationHeader(headers: Headers, token?: string) {
    headers.set('Authorization', token);
    headers.set('Store', this.store_id);
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