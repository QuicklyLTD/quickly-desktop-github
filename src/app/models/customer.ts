export class Customer {
    constructor(
        public name: string,
        public surname: string,
        public phone_number: number,
        public address: string,
        public picture: string,
        public type: CustomerType,
        public timestamp: number,
        public _id?: string,
        public _rev?: string
    ) { }
}

export class CustomerAccount {
    constructor(
        public customer_id: string,
        public points: number,
        public limit: number,
        public _id?: string,
        public _rev?: string
    ) { }
}

export enum CustomerType {
    NEAR,
    FAR
}
