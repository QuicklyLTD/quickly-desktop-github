export interface User {
    id: string,
    name: string,
    phone?: string,
    address?: string,
}

export interface OrderItem {
    product_id: string;
    name: string;
    price: number;
    note: string;
    type?: string;
}

export class Order {
    constructor(
        public check: any,
        public user: User,
        public items: Array<OrderItem>,
        public status: OrderStatus,
        public type: OrderType,
        public timestamp: number,
        public _id?: string,
        public _rev?: string,
    ) { }
}

export enum OrderType {
    INSIDE,
    OUTSIDE,
    TAKEAWAY,
    EMPLOOYEE,
    DEVICE
}

export enum OrderStatus {
    WAITING,
    PREPARING,
    APPROVED,
    CANCELED,
    PAYED,
}