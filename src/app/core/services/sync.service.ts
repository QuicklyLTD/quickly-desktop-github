import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MainService } from '../services/main.service';
import { ElectronService } from './electron/electron.service';
import { MessageService } from '../providers/message.service';
import { ConflictService } from '../services/conflict.service';
import { ServerInfo } from '../../models/settings';
import { SERVER_TYPES } from '../../shared/constants';

/**
 * SyncService
 * Handles database synchronization responsibilities
 * - Server replication
 * - Local/Remote sync
 * - App data initialization
 * - Backup/restore operations
 */
@Injectable()
export class SyncService {
  hasError = false;
  statusMessage = '';

  constructor(
    private mainService: MainService,
    private electronService: ElectronService,
    private messageService: MessageService,
    private conflictService: ConflictService,
    private router: Router
  ) {}

  /**
   * Replicates database from server
   * @param serverSettings Server configuration
   * @returns Replication handler
   */
  serverReplication(serverSettings: ServerInfo) {
    this.hasError = false;
    console.log('Server Replicating Started!')
    return (this.mainService.replicateDB(serverSettings) as any)
      .on('change', (sync) => {
        this.statusMessage = `${sync.docs_written} - Senkronize Ediliyor `;
      })
      .on('complete', () => {
        // Replication complete
      })
      .on('active', () => {
        console.log('active')
      })
      .on('denied', (ass) => {
        console.log(ass, 'denied')
      })
      .on('error', (err) => {
        console.log(err);
      })
      .catch(err => {
        console.warn('Server Replicating Error:', err);
        this.hasError = true;
        this.electronService.openDevTools();
      });
  }

  /**
   * Initializes app data after sync
   */
  appDataInitializer(onComplete: () => void) {
    this.mainService.loadAppData().then((isLoaded: boolean) => {
      if (isLoaded) {
        onComplete();
      }
    }).catch(err => {
      console.warn('LoadApp Data Error:', err);
    })
  }

  /**
   * Loads application data from backup file
   */
  loadFromBackup() {
    this.electronService.fileSystem.readFile('./data/db.dat', (err, data) => {
      if (err || !data) {
        console.error('Backup file read error:', err);
        return;
      }
      try {
        const rdata = JSON.parse(data.toString('utf-8'));
        this.mainService.destroyDB('allData').then(res => {
          if (res.ok) {
            this.mainService.initDatabases();
            setTimeout(() => {
              this.mainService.putAll('allData', rdata).then(putRes => {
                console.log(putRes);
                this.electronService.reloadProgram();
              }).catch(putErr => {
                this.electronService.reloadProgram();
              })
            }, 2500)
          }
        }).catch(destroyErr => {
          console.error(destroyErr);
        });
      } catch (parseError) {
        console.error('Backup file parse error:', parseError);
      }
    })
  }

  /**
   * Finds and syncs server settings from remote
   */
  findServerSettings() {
    let serverDocument;
    const AppType = localStorage.getItem('AppType');
    this.mainService.getAllBy('allData', { key: 'ServerSettings' }).then(res => {
      switch (AppType) {
        case 'Primary':
          serverDocument = res.docs.find(obj => obj.value.type === SERVER_TYPES.PRIMARY);
          delete serverDocument._rev;
          this.mainService.putDoc('settings', serverDocument).then(putDocRes => {
            this.electronService.reloadProgram();
          });
          break;
        case 'Secondary':
          serverDocument = res.docs.find(obj => obj.value.type === SERVER_TYPES.SECONDARY);
          delete serverDocument._rev;
          this.mainService.putDoc('settings', serverDocument).then(putDocRes2 => {
            this.electronService.reloadProgram();
          });
          break;
        default:
          break;
      }
    })
  }

  /**
   * Syncs app settings from remote
   */
  findAppSettings() {
    this.mainService.syncToLocal('settings').then(message => {
      this.messageService.sendMessage('Ayarlar Güncelleniyor...');
      this.electronService.reloadProgram();
    }).catch(err => {
      this.messageService.sendAlert('Hata!', 'Gün Dökümanı Bulunamadı!', 'error');
    });
  }
}
