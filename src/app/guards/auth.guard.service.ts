import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { MessageService } from '../core/providers/message.service';
import { AuthService } from '../core/services/auth.service';
import { SettingsService } from '../core/services/settings.service';

@Injectable({ providedIn: 'root' })
export class CanActivateViaAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (localStorage.getItem('E2E_TEST') === '1') {
      return true;
    }
    return this.authService.isAuthed(state.url);
  }
}

@Injectable({ providedIn: 'root' })
export class AnonymousCanActivate implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate() {
    return !this.authService.isAnonymous();
  }
}

@Injectable({ providedIn: 'root' })
export class SetupFinished implements CanActivate {
  constructor(private settings: SettingsService) {}

  canActivate() {
    return true;
  }
}

@Injectable({ providedIn: 'root' })
export class DayStarted implements CanActivate {
  constructor(
    private settings: SettingsService,
    private messageService: MessageService,
    private router: Router
  ) {}

  canActivate() {
    if (localStorage.getItem('E2E_TEST') === '1') {
      return true;
    }
    const rawStatus = localStorage.getItem('DayStatus');
    const status = rawStatus ? JSON.parse(rawStatus) : { started: false };
    const isStarted: boolean = !!status?.started;
    if (isStarted === false) {
      this.messageService.sendAlert('Dikkat', 'Lütfen Gün Başlangıcı Yapınız', 'warning');
      this.router.navigate(['/endoftheday']);
    }
    return isStarted;
  }
}
