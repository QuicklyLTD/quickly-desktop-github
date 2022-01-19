// export class Stock {
//     constructor(
//         public name: string,
//         public description: string,
//         public cat_id: string,
//         public quantity: number,
//         public unit: string,
//         public total: number,
//         public left_total: number,
//         public first_quantity: number,
//         public warning_limit: number,
//         public warning_value: number,
//         public timestamp: number,
//         public _id?: string,
//         public _rev?: string
//     ) { }
// }
export class StockCategory {
    constructor(
        public name: string,
        public description: string,
        public _id?: string,
        public _rev?: string
    ) { }
}

export class Stock {
    constructor(
        public name: string,
        public description: string,
        public unit: UnitType,
        public portion: number,
        public quantity: number,
        public first_quantity: number,
        public total: number,
        public left_total: number,
        public first_total: number,
        public warning_value: number,
        public warning_limit: number,
        public category: string,
        public sub_category: string,
        public producer: string,
        public product: string,
        public warehouse: string,
        public supplier: string,
        public timestamp: number,
        public _id?: string,
        public _rev?: string
    ) { }
}

export interface StockCategory {
    name: string,
    description: string,
    _id?: string,
    _rev?: string
}

export type UnitType = 'Gr' | 'Kg' | 'Ml' | 'Cl' | 'Lt';