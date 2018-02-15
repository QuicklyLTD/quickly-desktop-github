import { Injectable } from '@angular/core';
import { Log } from '../mocks/log.mock'
import { MainService } from './main.service';

@Injectable()
export class LogService {
  user:string;
  constructor(private mainService:MainService) {}
  
  createLog(type: number,message :string){
    this.user = localStorage.getItem('userName');
    let log = new Log(type,this.user,message,Date.now());
    this.mainService.addData('logs',log);
  }

  deleteLog(id){
    this.mainService.removeData('logs',id);
  }
}
