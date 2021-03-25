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

export interface Order {
    db_name: string,
    check: any,
    user: User,
    items: Array<OrderItem>,
    status: OrderStatus,
    type: OrderType,
    timestamp: number,
    _id?: string;
    _rev?: string;
}

export enum OrderType {
    INSIDE,
    OUTSIDE,
    TAKEAWAY
}

export enum OrderStatus {
    WAITING,
    PREPARING,
    APPROVED,
    CANCELED,
    PAYED,
}