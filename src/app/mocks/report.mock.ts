export type reportType = 'Customer' | 'Store' | 'Product' | 'Category' | 'SubCategory' | 'Table' | 'Floor' | 'User' | 'Group';

export class Report {
    constructor(
        public type: reportType,
        public connection_id: string,
        public count: number,
        public amount: number,
        public profit: number,
        public weekly: Array<number>,
        public weekly_count: Array<number>,
        public monthly: Array<number>,
        public monthly_count: Array<number>,
        public month: number,
        public year: number,
        public description: string,
        public timestamp: number,
        public db_name?: string,
        public db_seq?: number,
        public _id?: string,
        public _rev?: string,
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