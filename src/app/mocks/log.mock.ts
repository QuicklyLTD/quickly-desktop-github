export class Log {
  constructor(
    public type: logType,
    public user: string,
    public connection_id: string,
    public description: string,
    public status: number,
    public timestamp: number,
    public _id?: string,
    public _rev?: string
  ) { }
}

export enum logType {
  CHECK_CREATED,
  CHECK_CLOSED,
  CHECK_PAYED,
  CHECK_MOVED,
  CHECK_CANCELED,
  CHECK_UPDATED,
  ORDER_CREATED,
  ORDER_CANCELED,
  ORDER_MOVED,
  STOCK_CREATED,
  STOCK_DELETED,
  STOCK_UPDATED,
  STOCK_CHECKPOINT,
  USER_CREATED,
  USER_DELETED,
  USER_UPDATED,
  USER_CHECKPOINT,
  PRODUCT_CREATED,
  PRODUCT_DELETED,
  PRODUCT_UPDATED,
  PRODUCT_CHECKPOINT,
  TABLE_CREATED,
  TABLE_DELETED,
  TABLE_UPDATED,
  TABLE_CHECKPOINT,
  CASHBOX_CREATED,
  CASHBOX_DELETED,
  CASHBOX_UPDATED,
  DISCOUNT,
}