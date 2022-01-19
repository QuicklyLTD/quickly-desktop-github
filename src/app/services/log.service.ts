import { Injectable } from '@angular/core';
import { Log, logType } from '../mocks/log';
import { MainService } from './main.service';
export { logType } from '../mocks/log';

@Injectable()
export class LogService {
  user: string;
  constructor(private mainService: MainService) { }

  createLog(type: logType, connection_id: string, message: string, ) {
    this.user = localStorage.getItem('userName');
    let log = new Log(type, this.user, connection_id, message, 0, Date.now());
    this.mainService.addData('logs', log);
  }

  deleteLog(id) {
    this.mainService.removeData('logs', id);
  }
}
