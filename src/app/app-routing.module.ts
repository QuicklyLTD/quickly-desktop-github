import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { SetupComponent } from './components/setup/setup.component';
import { SettingsComponent } from './components/settings/settings.component'
import { LoginComponent } from './components/login/login.component';
import { CashboxComponent } from './components/cashbox/cashbox.component';
import { ReportsComponent } from './components/reports/reports.component';
import { StoreComponent } from './components/store/store.component';
import { EndofthedayComponent } from './components/endoftheday/endoftheday.component';
import { SellingScreenComponent } from './components/store/selling-screen/selling-screen.component';
import { FastSellingComponent } from './components/store/fast-selling/fast-selling.component';
import { PaymentScreenComponent } from './components/store/payment-screen/payment-screen.component';
import { AdminComponent } from './components/admin/admin.component';
import { CanActivateViaAuthGuard, AnonymousCanActivate, SetupFinished, DayStarted } from './guards/auth.guard.service';
import { AuthService } from "./services/auth.service";

const routes: Routes = [
  {
    path: '',
    component: LoginComponent
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [AnonymousCanActivate]
  },
  {
    path: 'store',
    component: StoreComponent,
    canActivate: [CanActivateViaAuthGuard, DayStarted]
  },
  {
    path: 'cashbox',
    component: CashboxComponent,
    canActivate: [CanActivateViaAuthGuard, DayStarted]
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [CanActivateViaAuthGuard, DayStarted]
  },
  {
    path: 'endoftheday',
    component: EndofthedayComponent,
    canActivate: [CanActivateViaAuthGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [CanActivateViaAuthGuard]
  },
  {
    path: 'admin',
    component: AdminComponent
  },
  {
    path: 'selling-screen/:type/:id',
    component: SellingScreenComponent,
    canActivate: [CanActivateViaAuthGuard]
  },
  {
    path: 'payment/:id',
    component: PaymentScreenComponent,
  },
  {
    path: 'fast-selling',
    component: FastSellingComponent,
    canActivate: [CanActivateViaAuthGuard, DayStarted]
  },
  {
    path: 'setup',
    component: SetupComponent
    // canActivate: [SetupFinished]
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
  providers: [
    AuthService,
    AnonymousCanActivate,
    CanActivateViaAuthGuard,
    SetupFinished,
    DayStarted]
})
export class AppRoutingModule {
}
