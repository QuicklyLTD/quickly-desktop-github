import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Services
import { MainService } from './services/main.service';
import { EntityStoreService } from './services/entity-store.service';
import { ElectronService } from './services/electron/electron.service';
import { FileLogService } from './services/file-log.service';
import { SyncService } from './services/sync.service';
import { ApplicationService } from './services/application.service';
import { LogService } from './services/log.service';
import { AuthService } from './services/auth.service';
import { SettingsService } from './services/settings.service';
import { HttpService } from './services/http.service';
import { ConnectionService } from './services/connection.service';
import { ConflictService } from './services/conflict.service';
import { OrderListenerService } from './services/order-listener.service';
import { DayManagementService } from './services/day-management.service';
import { OrderService } from './services/order.service';

// Providers
import { MessageService } from './providers/message.service';
import { PrinterService } from './providers/printer.service';
import { ScalerService } from './providers/scaler.service';
import { TerminalService } from './providers/terminal.service';
import { CallerIDService } from './providers/caller-id.service';
import { KeyboardService } from './providers/keyboard.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    MainService,
    EntityStoreService,
    ElectronService,
    FileLogService,
    SyncService,
    ApplicationService,
    LogService,
    AuthService,
    SettingsService,
    HttpService,
    ConnectionService,
    ConflictService,
    OrderListenerService,
    DayManagementService,
    OrderService,
    MessageService,
    PrinterService,
    ScalerService,
    TerminalService,
    CallerIDService,
    KeyboardService
  ]
})
export class CoreModule { }
