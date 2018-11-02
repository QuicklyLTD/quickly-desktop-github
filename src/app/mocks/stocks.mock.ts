export class Stock {
    constructor(
        public name: string,
        public description: string,
        public cat_id: string,
        public quantity: number,
        public unit: string,
        public total: number,
        public left_total: number,
        public first_quantity: number,
        public warning_limit: number,
        public warning_value: number,
        public timestamp: number,
        public _id?: string,
        public _rev?: string
    ) { }
}
export class StockCategory {
    constructor(
        public name: string,
        public description: string,
        public _id?: string,
        public _rev?: string
    ) { }
}