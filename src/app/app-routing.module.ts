import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ActivationComponent } from './components/activation/activation.component';
import { AdminComponent } from './components/admin/admin.component';
import { CashboxComponent } from './components/cashbox/cashbox.component';
import { EndofthedayComponent } from './components/endoftheday/endoftheday.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { ReportsComponent } from './components/reports/reports.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SetupComponent } from './components/setup/setup.component';
import { PaymentScreenComponent } from './components/store/payment-screen/payment-screen.component';
import { SellingScreenComponent } from './components/store/selling-screen/selling-screen.component';
import { StoreComponent } from './components/store/store.component';
import { AnonymousCanActivate, CanActivateViaAuthGuard, DayStarted, SetupFinished } from './guards/auth.guard.service';
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
    path: 'activation',
    component: ActivationComponent
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
    path: 'endoftheday_no_guard',
    component: EndofthedayComponent,
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [CanActivateViaAuthGuard]
  },
  {
    path: 'admin',
    component: AdminComponent,
  },
  {
    path: 'selling-screen/:type/:id',
    component: SellingScreenComponent,
    canActivate: [CanActivateViaAuthGuard, DayStarted]
  },
  {
    path: 'payment/:id',
    component: PaymentScreenComponent,
  },
  {
    path: 'setup',
    component: SetupComponent
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
