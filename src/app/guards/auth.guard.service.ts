import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { environment } from '../../environments/index';
import { AuthService } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';
import { Subscription } from 'rxjs/Subscription';

@Injectable()
export class CanActivateViaAuthGuard implements CanActivate {
    constructor(private authService: AuthService) { }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.authService.isAuthed(state.url);
    }
}

@Injectable()
export class AnonymousCanActivate implements CanActivate {
    constructor(private authService: AuthService) { }
    canActivate() {
        return !this.authService.isAnonymous();
    }
}

@Injectable()
export class SetupFinished implements CanActivate {
    constructor(private settings: SettingsService) { }
    canActivate() {
        return true;
    }
}

@Injectable()
export class DayStarted implements CanActivate {
    constructor(private settings: SettingsService) { }
    canActivate() {
        let Status = JSON.parse(localStorage.getItem('DayStatus'));
        let isStarted: boolean = Status.started;
        if(isStarted == false){
            alert('Gün Başlangıcı Yapınız.');
        }
        return isStarted;
    }
}

