import { Injectable } from '@angular/core';
import { Log, logType } from '../../models/log';
import { MainService } from '../services/main.service';
import { FileLogService } from '../services/file-log.service';
export { logType } from '../../models/log';

@Injectable()
export class LogService {
  user: string;
  constructor(private mainService: MainService, private fileLogService: FileLogService) { }

  createLog(type: logType, connection_id: string, message: string, ) {
    this.user = localStorage.getItem('userName');
    const log = new Log(type, this.user, connection_id, message, 0, Date.now());
    this.mainService.addData('logs', log);
  }

  deleteLog(id) {
    this.mainService.removeData('logs', id);
  }

  /**
   * Writes a detailed log entry to a .log file in /data.
   */
  logToFile(message: string, context?: any) {
    this.fileLogService.logToFile(message, context);
  }
}
