import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, Router } from '@angular/router';
import { MessageService } from '../providers/message.service';
import { AuthService } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';

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
    constructor(private settings: SettingsService, private messageService: MessageService, private router: Router) { }
    canActivate() {
        let Status = JSON.parse(localStorage.getItem('DayStatus'));
        let isStarted: boolean = Status.started;
        if (isStarted == false) {
            this.messageService.sendAlert('Dikkat', 'Lütfen Gün Başlangıcı Yapınız', 'warning');
            this.router.navigate(['/endoftheday']);
        }
        return isStarted;
    }
}

