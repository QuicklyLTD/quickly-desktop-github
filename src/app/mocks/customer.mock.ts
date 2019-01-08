export class Customer {
    constructor(
        public name: string,
        public surname: string,
        public phone_number: string,
        public picture: string,
        public address: string,
        public _id?: string,
        public _rev?: string
    ) { }
}

export class Account {
    constructor(
        public customer_id:string,
        public points:number,
        public limit: number,
        public _id?: string,
        public _rev?: string
    ) { }
}

