import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'price',
    standalone: true
})
export class PricePipe implements PipeTransform {

    constructor() { }

    transform(value: number): string {
        let val = value;
        if (!val) {
          val = 0;
        }
        return '₺ ' + Number(val).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

}
