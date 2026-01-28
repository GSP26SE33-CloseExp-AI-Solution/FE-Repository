import { ProductDraft } from "./products";

export const fakeAiProduct = (): ProductDraft => ({
    id: "AI_TMP_001",
    image: "",
    name: "Khô cá cơm tẩm ngọt An Vĩnh khay 200g",
    description: "",
    category: "Thực phẩm khô",
    brand: "An Vĩnh",
    origin: "Việt Nam",
    unit: "",
    qty: null,

    manufactureDate: "30/12/2025",
    expiry: "30/06/2026",
    shelfLife: "6 tháng kể từ NSX",

    weight: "200g",
    ingredients: "Cá cơm, đường, gia vị",
    usage: "Dùng trực tiếp",
    storage: "Bảo quản nơi khô ráo",
    manufacturer: "CTY TNHH An Vĩnh",
    warning: "",
    organization: "",

    originalPrice: 53000,
    salePrice: null,
});
