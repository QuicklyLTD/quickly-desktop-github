import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'timeAgo',
    standalone: true
})
export class TimeAgoPipe implements PipeTransform {

    constructor() { }

    transform(value: number): string {
        const current = Date.now();
        const msPerMinute = 60 * 1000;
        const msPerHour = msPerMinute * 60;
        const msPerDay = msPerHour * 24;
        const msPerMonth = msPerDay * 30;
        const msPerYear = msPerDay * 365;
        const elapsed = current - value;

        if (elapsed < msPerMinute) {
            return Math.round(elapsed / 1000) + ' sn';
        } else if (elapsed < msPerHour) {
            return Math.round(elapsed / msPerMinute) + ' dk';
        } else if (elapsed < msPerDay) {
            return Math.round(elapsed / msPerHour) + ' sa';
        } else if (elapsed < msPerMonth) {
            return Math.round(elapsed / msPerDay) + ' gün';
        } else if (elapsed < msPerYear) {
            return Math.round(elapsed / msPerMonth) + ' ay';
        } else {
            return Math.round(elapsed / msPerYear) + ' yıl';
        }
    }

}
