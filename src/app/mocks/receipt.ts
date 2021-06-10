import { Order, User } from "./order";

export class Receipt {
    constructor(
        public db_name: string,
        public user: User,
        public check: string,
        public orders: Array<Order>,
        public total: number,
        public discount: number,
        public type: ReceiptType,
        public method: ReceiptMethod,
        public status: ReceiptStatus,
        public timestamp: number,
        public note?: string,
        public _id?: string,
        public _rev?: string
    ) { }
}

export enum ReceiptMethod {
    UNDEFINED,
    CASH,
    CARD,
    COUPON,
    MOBILE,
    CRYPTO,
}

export enum ReceiptType {
    ALL,
    USER,
    PARTIAL
}

export enum ReceiptStatus {
    REQUESTED,
    WAITING,
    READY,
    APPROVED,
    CANCELED
}