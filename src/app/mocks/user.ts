export class User {
  constructor(
    public name: string,
    public role: string,
    public role_id: string,
    public pincode: number,
    public status: number,
    public timestamp: number,
    public _id?: string,
    public _rev?: string
  ) { }
}
export class UserGroup {
  constructor(
    public name: string,
    public description: string,
    public auth: UserAuth,
    public status: number,
    public timestamp: number,
    public _id?: string,
    public _rev?: string
  ) { }
}
export class UserAuth {
  constructor(
    public components: ComponentsAuth,
    public cancelCheck: boolean,
    public cancelProduct: boolean,
    public discount: boolean,
    public payment: boolean,
    public end: boolean,
  ) { }
}
export class ComponentsAuth {
  constructor(
    public store: boolean,
    public cashbox: boolean,
    public endoftheday: boolean,
    public reports: boolean,
    public settings: boolean
  ) { }
}