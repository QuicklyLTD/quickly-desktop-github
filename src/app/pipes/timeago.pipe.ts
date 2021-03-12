import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {

    constructor() { }

    transform(value: number): string {
        let current = Date.now();
        let msPerMinute = 60 * 1000;
        let msPerHour = msPerMinute * 60;
        let msPerDay = msPerHour * 24;
        let msPerMonth = msPerDay * 30;
        let msPerYear = msPerDay * 365;
        let elapsed = current - value;

        if (elapsed < msPerMinute) {
            return Math.round(elapsed / 1000) + ' sn';
        }

        else if (elapsed < msPerHour) {
            return Math.round(elapsed / msPerMinute) + ' dk';
        }

        else if (elapsed < msPerDay) {
            return Math.round(elapsed / msPerHour) + ' sa';
        }

        else if (elapsed < msPerMonth) {
            return Math.round(elapsed / msPerDay) + ' gün';
        }

        else if (elapsed < msPerYear) {
            return Math.round(elapsed / msPerMonth) + ' ay';
        }

        else {
            return Math.round(elapsed / msPerYear) + ' yıl';
        }
    }

}
