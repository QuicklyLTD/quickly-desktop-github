import 'zone.js';
import 'reflect-metadata';
//////  Modules
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppRoutingModule } from './app-routing.module';
//////  Main Pages Components
import { AppComponent } from './app.component';
import { ActivationComponent } from './components/activation/activation.component';
import { SetupComponent } from './components/setup/setup.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { CashboxComponent } from './components/cashbox/cashbox.component';
import { ReportsComponent } from './components/reports/reports.component';
import { EndofthedayComponent } from './components/endoftheday/endoftheday.component';
import { StoreComponent } from './components/store/store.component';
import { SettingsComponent } from './components/settings/settings.component';
import { AdminComponent } from './components/admin/admin.component';
////// EndDay Child Components
import { DayDetailComponent } from './components/endoftheday/day-detail/day-detail.component';
////// Store Child Components
import { SellingScreenComponent } from './components/store/selling-screen/selling-screen.component';
import { PaymentScreenComponent } from './components/store/payment-screen/payment-screen.component';
////// Settings Child Components
import { UserSettingsComponent } from './components/settings/user-settings/user-settings.component';
import { MenuSettingsComponent } from './components/settings/menu-settings/menu-settings.component';
import { ApplicationSettingsComponent } from './components/settings/application-settings/application-settings.component';
import { RestaurantSettingsComponent } from './components/settings/restaurant-settings/restaurant-settings.component';
import { StockSettingsComponent } from './components/settings/stock-settings/stock-settings.component';
////// Reports Child Components
import { StoreReportsComponent } from './components/reports/store-reports/store-reports.component';
import { ProductReportsComponent } from './components/reports/product-reports/product-reports.component';
import { TableReportsComponent } from './components/reports/table-reports/table-reports.component';
import { StockReportsComponent } from './components/reports/stock-reports/stock-reports.component';
import { UserReportsComponent } from './components/reports/user-reports/user-reports.component';
//////  Servisler
import { MainService } from './services/main.service';
import { ApplicationService } from './services/application.service';
import { SettingsService } from './services/settings.service';
import { AuthService } from './services/auth.service';
import { LogService } from './services/log.service';
import { HttpService } from './services/http.service';
import { ConflictService } from './services/conflict.service';
//////  Providers
import { KeyboardService } from './providers/keyboard.service';
import { MessageService } from "./providers/message.service";
import { PrinterService } from "./providers/printer.service"
import { ElectronService } from './providers/electron.service';
import { TerminalService } from './providers/terminal.service';
import { CallerIDService } from './providers/caller-id.service';
import { ScalerService } from './providers/scaler.service';

//////  Pipes
import { GeneralPipe } from './pipes/general.pipe';
import { TimeAgoPipe } from './pipes/timeago.pipe';
//////  Helpers
import { KeyboardComponent } from './components/helpers/keyboard/keyboard.component';
import { MessageComponent } from './components/helpers/message/message.component';
import { CallerComponent } from './components/helpers/caller/caller.component';
//////  Directives
import { KeyboardDirective } from './directives/keyboard.directive';
import { ButtonDirective } from './directives/button.directive';
import { PrinterSettingsComponent } from './components/settings/printer-settings/printer-settings.component';
import { RecipeSettingsComponent } from './components/settings/recipe-settings/recipe-settings.component';
import { CustomerSettingsComponent } from './components/settings/customer-settings/customer-settings.component';
import { PricePipe } from './pipes/price.pipe';
import { ActivityReportsComponent } from './components/reports/activity-reports/activity-reports.component';
import { CashboxReportsComponent } from './components/reports/cashbox-reports/cashbox-reports.component';
import { NotificationsReportsComponent } from './components/reports/notifications-reports/notifications-reports.component';

//////  3rd Party Modules
import { ChartsModule } from 'ng2-charts';
import { NgxMaskModule } from 'ngx-mask'

// Error Handler Sentry
// import * as Raven from 'raven-js';
// Raven.config('https://99ca5e8959c5432ca68bdf99d6360fb0@o380332.ingest.sentry.io/5206016').install();
// export class RavenErrorHandler implements ErrorHandler {
//   handleError(err: any): void {
//     console.error(err);
//     Raven.captureException(err);
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
    PaymentScreenComponent,
    StockSettingsComponent,
    StoreReportsComponent,
    ProductReportsComponent,
    TableReportsComponent,
    StockReportsComponent,
    UserReportsComponent,
    GeneralPipe,
    TimeAgoPipe,
    PricePipe,
    KeyboardDirective,
    AdminComponent,
    DayDetailComponent,
    ActivationComponent,
    ButtonDirective,
    PrinterSettingsComponent,
    RecipeSettingsComponent,
    CustomerSettingsComponent,
    CallerComponent,
    ActivityReportsComponent,
    CashboxReportsComponent,
    NotificationsReportsComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule,
    ChartsModule,
    NgxMaskModule.forRoot(),
  ],
  providers: [
    // { provide: ErrorHandler, useClass: RavenErrorHandler },
    ElectronService,
    MainService,
    ApplicationService,
    SettingsService,
    AuthService,
    LogService,
    MessageService,
    KeyboardService,
    PrinterService,
    TerminalService,
    ConflictService,
    CallerIDService,
    ScalerService,
    HttpService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}