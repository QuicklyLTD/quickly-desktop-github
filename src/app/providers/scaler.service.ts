import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';
import { MessageService } from './message.service';
import { SettingsService } from '../services/settings.service';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators/map';

@Injectable()
export class ScalerService {
    private scalerEvent: Subject<string> = new Subject<string>();
    private decoder: TextDecoder = new TextDecoder("utf-8");

    constructor(private electron: ElectronService, private messageService: MessageService, private settings: SettingsService) {
        this.electron.ipcRenderer.on('scalerError', (event, message: string) => {
            console.log('Scaler ERR:', message.toString());
            this.messageService.sendMessage(message);
        });
        this.electron.ipcRenderer.on('scalerData', (event, data: Uint8Array) => {
            this.scalerEvent.next(this.decoder.decode(data));
        });
    }

    // testFlow() {
    //     let data = [
    //         'S  0.000kg',
    //         'S  0.000kg',
    //         'S  0.000kg',
    //         'S  0.000kg',
    //         'S  0.000kg',
    //         'S  0.000kg',
    //         'S  0.000kg',
    //         'S  0.000kg',
    //         'S  0.000kg',
    //         'S  0.254kg',
    //         'S  0.350kg',
    //         'U  0.350kg',
    //         'U  0.350kg',
    //         'S  0.350kg',
    //         'U  0.350kg',
    //         'U  0.350kg',
    //         'S  0.350kg',
    //         'U  0.350kg',
    //         'U  0.350kg',
    //         'S  0.460kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //         'S  0.560kg',
    //     ];
    //     let i = 0;
    //     setInterval(() => {
    //         // let randomIndex = Math.round(Math.random() * 13);
    //         console.log(data[i]);
    //         this.scalerEvent.next(data[i]);
    //         if (i <= data.length) {
    //             i++
    //         } else {
    //             i = 0;
    //         }
    //     }, 1100)
    // }

    startScaler() {
        console.log('Scaler Service Started...')
        this.electron.ipcRenderer.send('startScaler');
        // this.testFlow();
    }

    closeScaler() {
        this.electron.ipcRenderer.send('closeScaler');
    }

    listenScalerEvent(): Observable<any> {
        return this.scalerEvent.asObservable().pipe(map((obj: string) => {
            if (obj) {
                let formatted = obj.replace('S', '').replace('U', '').replace('kg', '').replace('- ', '-').trim();
                return parseFloat(formatted);
            }
        }))
    }
}