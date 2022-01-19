import { Printer } from './settings';

export type PrintOutType = 'Check' | 'QRCode' | 'Order' | 'Receipt' | 'Report';

export class PrintOut {
    constructor(
      public type: PrintOutType,
      public status: PrintOutStatus,
      public connection: string,
      public printer: Printer,
      public _id?: string,
      public _rev?: string,
    ) { }
}

export enum PrintOutStatus {
    WAITING,
    PRINTED,
    ERROR
}