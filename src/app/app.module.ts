import 'zone.js';
import 'reflect-metadata';
//////  Moduller
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppRoutingModule } from './app-routing.module';
//////  Komponentler
import { AppComponent } from './app.component';
import { SetupComponent } from './components/setup/setup.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { CashboxComponent } from './components/cashbox/cashbox.component';
import { ReportsComponent } from './components/reports/reports.component';
import { EndofthedayComponent } from './components/endoftheday/endoftheday.component';
import { StoreComponent } from './components/store/store.component';
import { SettingsComponent } from './components/settings/settings.component';
//Store Child Components
import { SellingScreenComponent } from './components/store/selling-screen/selling-screen.component';
import { FastSellingComponent } from './components/store/fast-selling/fast-selling.component';
//Settings Child Components
import { UserSettingsComponent } from './components/settings/user-settings/user-settings.component';
import { MenuSettingsComponent } from './components/settings/menu-settings/menu-settings.component';
import { ApplicationSettingsComponent } from './components/settings/application-settings/application-settings.component';
import { RestaurantSettingsComponent } from './components/settings/restaurant-settings/restaurant-settings.component';
import { StockSettingsComponent } from './components/settings/stock-settings/stock-settings.component';
//Reports Child Components
import { StoreReportsComponent } from './components/reports/store-reports/store-reports.component';
import { ProductReportsComponent } from './components/reports/product-reports/product-reports.component';
import { TableReportsComponent } from './components/reports/table-reports/table-reports.component';
import { StockReportsComponent } from './components/reports/stock-reports/stock-reports.component';
import { UserReportsComponent } from './components/reports/user-reports/user-reports.component';
//////  External Components
import { ChartsModule } from 'ng2-charts';
//////  Servisler
import { MainService } from './services/main.service';
import { ApplicationService } from './services/application.service';
import { SettingsService } from './services/settings.service';
import { AuthService } from './services/auth.service';
//////  Providers
import { KeyboardService } from './providers/keyboard.service';
import { MessageService } from "./providers/message.service";
import { PrinterService } from "./providers/printer.service"
import { ElectronService } from './providers/electron.service';
//////  Guards
import { CanActivateViaAuthGuard } from './guards/auth.guard.service';
//////  Pipes
import { GeneralPipe } from './pipes/general.pipe';
//////  Helpers
import { KeyboardComponent } from './components/helpers/keyboard/keyboard.component';
import { MessageComponent } from './components/helpers/message/message.component';
//////  Directives
import { KeyboardDirective } from './directives/keyboard.directive';
import { PaymentScreenComponent } from './components/store/payment-screen/payment-screen.component';

// Error Handler Sentry
// import * as Raven from 'raven-js';
// Raven.config('https://8b40ef17376d472eb66f7b67bfccfd47@sentry.io/233500').install();
// export class RavenErrorHandler implements ErrorHandler {
//   handleError(err: any): void {
//     Raven.captureException(err);
//     console.error(err);
//   }
// }

@NgModule({
  declarations: [
    AppComponent,
    SetupComponent,
    HomeComponent,
    CashboxComponent,
    ReportsComponent,
    SettingsComponent,
    EndofthedayComponent,
    StoreComponent,
    SellingScreenComponent,
    LoginComponent,
    UserSettingsComponent,
    MenuSettingsComponent,
    ApplicationSettingsComponent,
    RestaurantSettingsComponent,
    MessageComponent,
    KeyboardComponent,
    FastSellingComponent,
    StockSettingsComponent,
    StoreReportsComponent,
    ProductReportsComponent,
    TableReportsComponent,
    StockReportsComponent,
    UserReportsComponent,
    GeneralPipe,
    KeyboardDirective,
    PaymentScreenComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule,
    ChartsModule
  ],
  providers: [
    // { provide: ErrorHandler, useClass: RavenErrorHandler },
    ElectronService,
    MainService,
    ApplicationService,
    SettingsService,
    AuthService,
    MessageService,
    KeyboardService,
    PrinterService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}