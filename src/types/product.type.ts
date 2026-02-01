export interface ProductDraft {
    id: string;
    image: string;

    sku: string;
    barcode: string;

    name: string;
    description: string;
    category: string;
    brand: string;
    origin: string;
    unit: string;
    qty: number | null;

    manufactureDate: string;
    expiry: string;
    shelfLife: string;

    weight: string;
    ingredients: string;
    usage: string;
    storage: string;
    manufacturer: string;
    warning: string;
    organization: string;

    originalPrice: number | null;
    salePrice: number | null;
}

export interface Product extends ProductDraft {
    createdAt: string;
}
