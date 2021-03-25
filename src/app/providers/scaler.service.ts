import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { MessageService } from './message.service';
import { SettingsService } from '../services/settings.service';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class ScalerService {
    private scalerEvent: Subject<any> = new Subject<any>();

    constructor(private electron: ElectronService, private messageService: MessageService, private settings: SettingsService) {
        this.electron.ipcRenderer.on('scalerError', (event, message: string) => {
            this.messageService.sendMessage(message);
        });
        this.electron.ipcRenderer.on('scalerData', (event, data: Uint8Array) => {
            console.log(data.toString());
        });
    }

    startScaler() {
        console.log('Scaler Service Started...')
        this.electron.ipcRenderer.send('startScaler');
    }

    listenScalerEvent(): Observable<any> {
        return this.scalerEvent.asObservable();
    }
}