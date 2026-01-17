import { Injectable } from '@angular/core';
import { MainService } from './main.service';
import { ElectronService } from '../providers/electron.service';
import { MessageService } from '../providers/message.service';
import { DayInfo } from '../mocks/settings';

/**
 * DayManagementService
 * Handles day start/end operations and validation
 */
@Injectable()
export class DayManagementService {

  constructor(
    private mainService: MainService,
    private electronService: ElectronService,
    private messageService: MessageService
  ) {}

  /**
   * Checks if day has changed and validates day status
   * @param dayStatus Current day status
   */
  dayCheck(dayStatus: DayInfo) {
    if (new Date().getDay() !== dayStatus.day) {
      if (dayStatus.started) {
        this.messageService.sendAlert('Dikkat!', 'Gün Sonu Yapılmamış.', 'warning');
      } else {
        this.mainService.RemoteDB.find({
          selector: { db_name: 'settings', key: 'DateSettings' },
          limit: 5000
        }).then((res) => {
          const serverDate: DayInfo = res.docs[0].value;
          if (serverDate.started) {
            this.mainService.getData('settings', res.docs[0]._id).then(settingsDoc => {
              this.mainService.LocalDB['settings'].get(settingsDoc._id).then(localDoc => {
                localDoc.value = serverDate;
                this.mainService.LocalDB['settings'].put(localDoc).then(isUpdated => {
                  this.electronService.reloadProgram();
                }).catch(err => {
                  console.log(err);
                })
              }).catch(err => {
                console.log(err);
              })
            }).catch(err => {
              console.log(err);
            })
          } else {
            this.messageService.sendAlert('Dikkat!', 'Gün Başlangıcı Yapmalısınız.', 'warning');
          }
        }).catch(err => {
          this.dayCheck(dayStatus);
        })
      }
    }
  }
}
