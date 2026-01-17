import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AnonymousCanActivate, CanActivateViaAuthGuard, DayStarted } from './guards/auth.guard.service';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
    canActivate: [AnonymousCanActivate]
  },
  {
    path: 'activation',
    loadComponent: () =>
      import('./components/activation/activation.component').then((m) => m.ActivationComponent)
  },
  {
    path: 'setup',
    loadComponent: () =>
      import('./components/setup/setup.component').then((m) => m.SetupComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'store',
    loadComponent: () =>
      import('./components/store/store.component').then((m) => m.StoreComponent)
  },
  {
    path: 'cashbox',
    loadComponent: () =>
      import('./components/cashbox/cashbox.component').then((m) => m.CashboxComponent),
    canActivate: [CanActivateViaAuthGuard, DayStarted]
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./components/reports/reports.component').then((m) => m.ReportsComponent),
    canActivate: [CanActivateViaAuthGuard, DayStarted]
  },
  {
    path: 'endoftheday',
    loadComponent: () =>
      import('./components/endoftheday/endoftheday.component').then((m) => m.EndofthedayComponent),
    canActivate: [CanActivateViaAuthGuard]
  },
  {
    path: 'endoftheday_no_guard',
    loadComponent: () =>
      import('./components/endoftheday/endoftheday.component').then((m) => m.EndofthedayComponent)
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./components/settings/settings.component').then((m) => m.SettingsComponent),
    canActivate: [CanActivateViaAuthGuard]
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin/admin.component').then((m) => m.AdminComponent)
  },
  {
    path: 'selling-screen/:type/:id',
    loadComponent: () =>
      import('./components/store/selling-screen/selling-screen.component').then((m) => m.SellingScreenComponent),
    canActivate: [CanActivateViaAuthGuard, DayStarted]
  },
  {
    path: 'payment/:id',
    loadComponent: () =>
      import('./components/store/payment-screen/payment-screen.component').then((m) => m.PaymentScreenComponent)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy', useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
