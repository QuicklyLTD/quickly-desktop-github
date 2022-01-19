export class Cashbox {
  constructor(
    public type: string,
    public description: string,
    public timestamp: number,
    public cash: number,
    public card: number,
    public coupon: number,
    public user: string,
    public _id?: string,
    public _rev?: string
  ) { }
}

export enum CashboxType {
    PASSIVE,
    INCOME,
    OUTCOME
}