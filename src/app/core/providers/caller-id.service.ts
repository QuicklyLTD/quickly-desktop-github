import { Injectable } from '@angular/core';
import { ElectronService } from '../services/electron/electron.service';
import { MessageService } from './message.service';
import { SettingsService } from '../services/settings.service';
import { Subject } from 'rxjs';
import { Observable } from 'rxjs';
import { Call } from '../../models/caller';

@Injectable()
export class CallerIDService {
    private CallEvent: Subject<Call> = new Subject<Call>();

    constructor(
        private electron: ElectronService,
        private messageService: MessageService,
        private settings: SettingsService
    ) {
        if (this.electron.ipcRenderer) {
            this.electron.ipcRenderer.on('callerError', (event, message: string) => {
                this.messageService.sendMessage(message);
            });
            this.electron.ipcRenderer.on('phoneRequest', (event, data) => {
                if (data.toString().split('.')[1] === undefined ||
                    data.toString().split('.')[0] === '    ----    CIDSHOW - 2020  - Sistemler') {
                    console.log('Device Signal...');
                } else {
                    const newCall: Call = {
                        line: data.toString().split('.')[0],
                        number: data.toString().split('.')[1],
                        serial: data.toString().split('.')[3],
                        timestamp: Date.now()
                    };
                    this.CallEvent.next(newCall);
                }
            });
            this.electron.ipcRenderer.on('callerPath', (event, message) => {
                console.log('CIDSHOW PATH:', message);
            });
        }
    }

    startCallerID() {
        console.log('CallerID Service Started...');
        if (this.electron.ipcRenderer) {
            this.electron.ipcRenderer.send('startCaller');
        }
    }

    listenCallEvent(): Observable<Call> {
        return this.CallEvent.asObservable();
    }

    testCall() {
        const testCall: Call = { line: 0, number: '05448743568', serial: 5556666, timestamp: Date.now() };
        this.CallEvent.next(testCall);
    }
}
