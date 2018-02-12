export class Report {
    constructor(
        public type: string,
        public connection_id: string,
        public count: number,
        public amount: number,
        public profit: number,
        public weekly: Array<number>,
        public weekly_count: Array<number>,
        public description: string,
        public update_time: number,
        public _id?: string,
        public _rev?: string
    ) { }
}
export class Activity {
    constructor(
        public type:string,
        public name:string,
        public activity:Array<number>,
        public activity_time:Array<any>,
        public activity_count:Array<number>
    ) { }
}