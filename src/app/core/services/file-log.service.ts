import { Injectable } from '@angular/core';
import { ElectronService } from './electron/electron.service';

@Injectable()
export class FileLogService {
  private readonly logFileName = 'app.log';

  constructor(private electronService: ElectronService) {}

  /**
   * Writes a detailed log entry to a .log file in /data.
   */
  logToFile(message: string, context?: any) {
    if (!this.electronService || !this.electronService.isElectron) {
      console.log('[FileLog]', message, context || '');
      return;
    }

    const fs = this.electronService.fileSystem;
    const dataDir = this.electronService.appRealPath + '/data';
    const logPath = dataDir + '/' + this.logFileName;
    const timestamp = new Date().toISOString();
    const contextText = context ? ' | ' + JSON.stringify(context) : '';
    const line = `${timestamp} | ${message}${contextText}\n`;

    fs.exists(dataDir, (exists) => {
      if (!exists) {
        fs.mkdir(dataDir, (mkdirErr) => {
          if (mkdirErr) {
            console.log('[FileLog] mkdir error', mkdirErr);
            return;
          }
          fs.appendFile(logPath, line, (appendErr) => {
            if (appendErr) {
              console.log('[FileLog] append error', appendErr);
            }
          });
        });
      } else {
        fs.appendFile(logPath, line, (appendErr) => {
          if (appendErr) {
            console.log('[FileLog] append error', appendErr);
          }
        });
      }
    });
  }
}
