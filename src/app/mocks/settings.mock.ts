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
export class Printer {
    constructor(
        public name: string,
        public type: string,
        public note: string,
        public device_port: number,
    ) { }
}