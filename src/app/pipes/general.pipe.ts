import { Pipe, PipeTransform } from '@angular/core';
import { MainService } from '../services/main.service';

@Pipe({
  name: 'general'
})

export class GeneralPipe implements PipeTransform {

  constructor(private mainService: MainService) {

  }

  transform(value: any, args: string): any {
    return this.mainService.getData(args, value).then((result) => {
      return result.name;
    }).catch((err) => {
      return value;
    });
  }

}
