export class Log {
    constructor(
      public type: number,
      public user:string,
      public description: string,
      public timestamp: number,
      public _id?:string,
      public _rev?:string
    ) { }
  }