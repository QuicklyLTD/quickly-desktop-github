export class Table {
    constructor(
        public name: string,
        public floor_id: string,
        public capacity: number,
        public description: string,
        public status: number,
        public timestamp: number,
        public customers: Array<string>,
        public _id?: string,
        public _rev?: string
    ) { }
}
export class Floor {
    constructor(
        public name: string,
        public description: string,
        public status: number,
        public timestamp: number,
        public special: number,
        public conditions: FloorSpecs,
        public _id?: string,
        public _rev?: string
    ) { }
}
export class FloorSpecs {
    constructor(
        public air: boolean,
        public cigarate: boolean,
        public reservation: boolean,
        public music: boolean,
        public events: boolean,
    ) { }
}

export enum TableStatus{
    PASSIVE,
    ACTIVE,
    OCCUPIED,
    WILL_READY
}