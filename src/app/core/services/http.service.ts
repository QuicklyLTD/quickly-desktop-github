import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MainService } from '../services/main.service';

@Injectable()
export class HttpService {
  baseUrl: string;
  store_id: string;

  constructor(private http: HttpClient, private mainService: MainService) {
    // this.baseUrl = 'http://localhost:3000'; // 'https://hq.quickly.com.tr';
    this.baseUrl = 'https://hq.quickly.com.tr';
    // this.baseUrl = 'http://192.168.0.29:3000'

    this.mainService.getAllBy('settings', { key: 'RestaurantInfo' }).then(res => {
      if (res && res.docs.length > 0) {
        this.store_id = res.docs[0].value._id;
      }
    });
  }

  private getHeaders(token?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'charset': 'UTF-8'
    });

    if (token) {
      headers = headers.set('Authorization', token);
    }
    if (this.store_id) {
      headers = headers.set('Store', this.store_id);
    }
    return headers;
  }

  get(url: string, token?: string) {
    return this.http.get(this.baseUrl + url, {
      headers: this.getHeaders(token)
    });
  }

  post(url: string, data: any, token?: string) {
    return this.http.post(this.baseUrl + url, data, {
      headers: this.getHeaders(token)
    });
  }

  put(url: string, data: any, token?: string) {
    return this.http.put(this.baseUrl + url, data, {
      headers: this.getHeaders(token)
    });
  }

  delete(url: string, token?: string) {
    return this.http.delete(this.baseUrl + url, {
      headers: this.getHeaders(token)
    });
  }
}
