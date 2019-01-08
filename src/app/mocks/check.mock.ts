export class Check {
    constructor(
        public table_id: string,
        public total_price: number,
        public discount: number,
        public owner: string,
        public note: string,
        public status: number,
        public products: Array<CheckProduct>,
        public timestamp: number,
        public type: number,
        public check_no: number,
        public payment_flow?: Array<PaymentStatus>,
        public discountPercent?: number,
        public _id?: string,
        public _rev?: string
    ) { }
}
export class ClosedCheck {
    constructor(
        public table_id: string,
        public total_price: number,
        public discount: number,
        public owner: string,
        public note: string,
        public status: number,
        public products: Array<CheckProduct>,
        public timestamp: number,
        public type: number,
        public payment_method: string,
        public payment_flow?: Array<PaymentStatus>,
        public description?: string,
        public _id?: string,
        public _rev?: string,
    ) { }
}
export class PaymentStatus {
    constructor(
        public owner: string,
        public method: string,
        public amount: number,
        public discount: number,
        public timestamp: number,
        public payed_products: Array<CheckProduct>
    ) { }
}
export class CheckProduct {
    constructor(
        public id: string,
        public cat_id: string,
        public name: string,
        public price: number,
        public note: string,
        public status: number,
        public owner: string,
        public timestamp: number,
        public tax_value: number,
        public barcode: number,
    ) { }
}

export enum CheckType {
    PASSIVE,
    NORMAL,
    FAST,
    CANCELED,
    PROCESSING
}

export enum CheckStatus {
    PASSIVE,
    READY,
    OCCUPIED,
    PROCESSING,
}

export function CheckNo(){
    // let currentID = parseInt(localStorage.getItem('CheckNo'));
    // let CheckNo = currentID+1;
    // localStorage.setItem('CheckNo', CheckNo.toString());
    let CheckNo = Math.floor(Math.random() * Math.floor(500));
    return CheckNo;
}