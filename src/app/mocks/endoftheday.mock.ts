export class EndDay {
    constructor(
       public timestamp: number,
       public owner: string,
       public total_income: number,
       public cash_total: number,
       public card_total: number,
       public coupon_total: number,
       public free_total: number,
       public canceled_total: number,
       public check_count: number,
       public incomes: number,
       public outcomes: number,
       public data_file: string,
       public _id?:string,
       public _rev?:string
    ) { }
}
export class BackupData {
    constructor(
       public database:string,
       public docs:Array<object>
    ) { }
}
