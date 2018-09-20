export class Settings {
    constructor(
        public key: string,
        public value: any,
        public description: string,
        public timestamp: number,
    ) { }
}
export class AuthInfo {
    constructor(
        public app_remote: string,
        public app_port: string,
        public app_db: string,
        public app_id: string,
        public app_token: string,
    ) { }
}
export class ServerInfo {
    constructor(
        public type: number,
        public status: number,
        public ip_address: string,
        public ip_port: number,
        public key: string
    ) { }
}
export class Printer {
    constructor(
        public name: string,
        public type: string,
        public note: string,
        public device_port: number,
    ) { }
}
export class PaymentMethod {
    constructor(
        public name: string,
        public description: string,
        public color: string,
        public icon: string,
        public type: number,
        public status: number
    ) { }
}
export class DayInfo {
    constructor(
        public day: number,
        public started: boolean,
        public time: number,
    ) { }
}