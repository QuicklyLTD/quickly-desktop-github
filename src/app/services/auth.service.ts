import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import { MessageService } from "../providers/message.service";
import { MainService } from './main.service';

@Injectable()
export class AuthService {
  private subject = new Subject<any>();
  constructor(private messageService: MessageService, private mainService: MainService) {
  }

  parseJWT(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(atob(base64));
  }

  saveToken(userType: string) {
    localStorage['userType'] = userType;
  }

  login(user: any) {
    localStorage['userName'] = user.name;
    localStorage['userType'] = user.role;
    localStorage['userAuth'] = user.role_id;
    localStorage['userID'] = user._id;
    this.subject.next({ name: user.name, type: user.role });
  }

  logout() {
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAuth');
    localStorage.removeItem('userID');
    localStorage.removeItem('userPermissions');
  }

  getToken() {
    return localStorage.getItem('userType');
  }

  isAnonymous() {
    let token = this.getToken()
    if (token) {
      return false;
    } else {
      this.messageService.sendMessage("Şifre girilmedi.");
      return true;
    }
  }

  getCurrentUser(): Observable<any> {
    return this.subject.asObservable();
  }

  setPermissions() {
    let auth = localStorage.getItem('userAuth');
    this.mainService.getData('users_group', auth).then(result => {
      delete result.auth.components;
      localStorage.setItem('userPermissions', JSON.stringify(result.auth));
    });
  }

  isAuthed(url) {
    let auth = localStorage.getItem('userAuth');
    if (auth) {
      url = url.replace('/', '').split('/');
      return this.mainService.getData('users_group', auth).then(result => {
        let guard = result.auth.components;
        switch (url[0]) {
          case 'settings':
            if (guard.settings) {
              return true;
            }
            this.messageService.sendMessage("Giriş Yetkiniz Yok!");
            break;
          case 'selling-screen':
            if (guard.store) {
              return true;
            }
            this.messageService.sendMessage("Giriş Yetkiniz Yok!");
            break;
          case 'fast-selling':
            if (guard.store) {
              return true;
            }
            this.messageService.sendMessage("Giriş Yetkiniz Yok!");
            break;
          case 'store':
            if (guard.store) {
              return true;
            }
            this.messageService.sendMessage("Giriş Yetkiniz Yok!");
            break;
          case 'reports':
            if (guard.reports) {
              return true;
            }
            this.messageService.sendMessage("Giriş Yetkiniz Yok!");
            break;
          case 'endoftheday':
            if (guard.endoftheday) {
              return true;
            }
            this.messageService.sendMessage("Giriş Yetkiniz Yok!");
            break;
          case 'cashbox':
            if (guard.cashbox) {
              return true;
            }
            this.messageService.sendMessage("Giriş Yetkiniz Yok!");
            break;
          default:
            break;
        }
      });
    } else {
      this.messageService.sendMessage("Şifre girilmedi.");
    }
  }

}
