export class Category {
    constructor(
        public name: string,
        public description: string,
        public status: number,
        public printer: string,
        public order: number,
        public tags: string,
        public _id?: string,
        public _rev?: string
    ) { }
}
export class SubCategory {
    constructor(
        public cat_id: string,
        public name: string,
        public description: string,
        public status: number,
        public _id?: string,
        public _rev?: string
    ) { }
}
export class Occations {
    constructor(
        public name: string,
        public price_list: Array<OccationUnit>
    ) { }
}
export class OccationUnit {
    constructor(
        public product_id: string,
        public price: number,
    ) { }
}
export class Product {
    constructor(
        public cat_id: string,
        public type: number,
        public description: string,
        public name: string,
        public price: number,
        public status: number,
        public tax_value: number,
        public barcode: number,
        public subcat_id?: string,
        public specifies?: Array<ProductSpecs>,
        public _id?: string,
        public _rev?: string
    ) { }
}
export class ProductGroup {
    constructor(
        public cat_id: string,
        public name: string,
        public description: string,
        public price: number,
        public products: Array<Product>,
        public status: number,
        public subcat_id?: string,
        public specifies?: Array<ProductSpecs>,
        public _id?: string,
        public _rev?: string
    ) { }
}
export class ProductSpecs {
    constructor(
        public spec_name: string,
        public spec_price: number
    ) { }
}
export class Recipe {
    constructor(
        public product_id: string,
        public recipe: Array<Ingredient>,
        public _id?: string,
        public _rev?: string
    ) { }
}
export class Ingredient {
    constructor(
        public stock_id: string,
        public amount: number
    ) { }
}

export enum ProductType {
    PASSIVE,
    AUTOMATIC,
    MANUEL
}

export enum ProductStatus{
    PASSIVE,
    ACTIVE,
    LOCKED,
    CANCELED
}