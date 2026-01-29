// FAKE DATA
export interface ProductDraft {
    id: string;                  // ID chuẩn hóa
    image: string;               // Hình ảnh

    sku?: string;                // mã nội bộ / SKU
    barcode?: string;            // mã vạch
    
    name: string;                // Tên sản phẩm
    description: string;         // Mô tả
    category: string;            // Phân loại
    brand: string;               // Thương hiệu
    origin: string;              // Xuất xứ
    unit: string;                // Đơn vị
    qty: number | null;          // Số lượng

    manufactureDate: string;     // Ngày sản xuất
    expiry: string;              // Hạn sử dụng (dd/mm/yyyy để hiển thị)
    shelfLife: string;           // HSD dạng mô tả (vd: 2 năm kể từ NSX)

    weight: string;              // Trọng lượng/khối lượng
    ingredients: string;         // Thành phần
    usage: string;               // Cách sử dụng
    storage: string;             // Bảo quản
    manufacturer: string;        // Đơn vị chịu trách nhiệm
    warning: string;             // Cảnh báo
    organization: string;        // Tổ chức chịu trách nhiệm

    originalPrice: number;       // Giá gốc
    salePrice: number | null;    // Giá bán
}

export interface Product extends ProductDraft {
    qty: number;
    salePrice: number;
}

export const demoProducts: Product[] = [
    {
        id: "P001",
        image: "https://picsum.photos/seed/p001/100",
        name: "Thanh cua 3N",
        description: "Thanh cua đông lạnh",
        category: "Thực phẩm chế biến",
        brand: "3N",
        origin: "Thái Lan",
        unit: "Gói",
        qty: 40,
        manufactureDate: "In trên bao bì",
        expiry: "2026-12-31",
        shelfLife: "2 năm kể từ NSX",
        weight: "250G",
        ingredients: "Surimi, thịt cá trắng",
        usage: "Rã đông rồi chế biến",
        storage: "-18°C",
        manufacturer: "Lucky Union Foods",
        warning: "Không dùng khi có mùi lạ",
        organization: "Saigon Co.op",
        originalPrice: 52000,
        salePrice: 38900,
    },
    {
        id: "P002",
        image: "https://picsum.photos/seed/p002/100",
        name: "Sữa tươi Vinamilk",
        description: "Sữa tiệt trùng có đường",
        category: "Sữa & chế phẩm sữa",
        brand: "Vinamilk",
        origin: "Việt Nam",
        unit: "Lốc",
        qty: 24,
        manufactureDate: "In trên bao bì",
        expiry: "2026-02-01",
        shelfLife: "6 tháng",
        weight: "180ml x4",
        ingredients: "Sữa bò, đường",
        usage: "Uống liền",
        storage: "Nơi khô ráo",
        manufacturer: "Vinamilk",
        warning: "Không dùng khi hộp phồng",
        organization: "Vinamilk VN",
        originalPrice: 32000,
        salePrice: 25000,
    },
    {
        id: "P003",
        image: "https://picsum.photos/seed/p003/100",
        name: "Xúc xích Đức Việt",
        description: "Xúc xích tiệt trùng",
        category: "Thực phẩm chế biến",
        brand: "Đức Việt",
        origin: "Việt Nam",
        unit: "Gói",
        qty: 40,
        manufactureDate: "In trên bao bì",
        expiry: "2026-01-26",
        shelfLife: "9 tháng",
        weight: "175g",
        ingredients: "Thịt heo, gia vị",
        usage: "Ăn liền",
        storage: "Bảo quản mát",
        manufacturer: "Đức Việt Foods",
        warning: "Không dùng khi bao bì rách",
        organization: "Đức Việt VN",
        originalPrice: 34000,
        salePrice: 25500,
    },
    {
        id: "P004",
        image: "https://picsum.photos/seed/p004/100",
        name: "Phô mai Con Bò Cười",
        description: "Phô mai lát",
        category: "Sữa & chế phẩm sữa",
        brand: "Bel",
        origin: "Pháp",
        unit: "Gói",
        qty: 16,
        manufactureDate: "In trên bao bì",
        expiry: "2026-01-25",
        shelfLife: "12 tháng",
        weight: "200g",
        ingredients: "Sữa, muối",
        usage: "Ăn trực tiếp",
        storage: "2–8°C",
        manufacturer: "Bel Group",
        warning: "Có chứa sữa",
        organization: "Bel VN",
        originalPrice: 45000,
        salePrice: 27000,
    },
    {
        id: "P005",
        image: "https://picsum.photos/seed/p005/100",
        name: "Bánh mì sandwich ABC",
        description: "Bánh mì lát mềm",
        category: "Bánh mì",
        brand: "ABC",
        origin: "Việt Nam",
        unit: "Túi",
        qty: 10,
        manufactureDate: "Hôm nay",
        expiry: "2026-01-28",
        shelfLife: "5 ngày",
        weight: "500g",
        ingredients: "Bột mì, men",
        usage: "Ăn trực tiếp",
        storage: "Nơi khô thoáng",
        manufacturer: "ABC Bakery",
        warning: "Không dùng khi mốc",
        organization: "ABC VN",
        originalPrice: 18000,
        salePrice: 12000,
    },

    // ===== NHÓM SẮP HẾT HẠN (test filter) =====
    {
        id: "P006",
        image: "https://picsum.photos/seed/p006/100",
        name: "Sữa chua TH",
        description: "Sữa chua lên men",
        category: "Sữa & chế phẩm sữa",
        brand: "TH",
        origin: "Việt Nam",
        unit: "Lốc",
        qty: 30,
        manufactureDate: "In trên bao bì",
        expiry: "2026-01-30",
        shelfLife: "30 ngày",
        weight: "100g x4",
        ingredients: "Sữa bò, men",
        usage: "Ăn lạnh",
        storage: "2–6°C",
        manufacturer: "TH Milk",
        warning: "Không dùng khi có mùi lạ",
        organization: "TH VN",
        originalPrice: 26000,
        salePrice: 16900,
    },
    {
        id: "P007",
        image: "https://picsum.photos/seed/p007/100",
        name: "Nước cam Twister",
        description: "Nước cam có tép",
        category: "Nước giải khát",
        brand: "Twister",
        origin: "Việt Nam",
        unit: "Chai",
        qty: 18,
        manufactureDate: "In trên bao bì",
        expiry: "2026-01-29",
        shelfLife: "8 tháng",
        weight: "455ml",
        ingredients: "Nước cam cô đặc",
        usage: "Lắc đều",
        storage: "Nơi khô ráo",
        manufacturer: "Pepsico",
        warning: "Không dùng khi chai phồng",
        organization: "Pepsico VN",
        originalPrice: 15000,
        salePrice: 12000,
    },

    // ===== HẾT HẠN =====
    {
        id: "P008",
        image: "https://picsum.photos/seed/p008/100",
        name: "Rau salad Đà Lạt",
        description: "Rau củ trộn sẵn",
        category: "Rau củ quả",
        brand: "DalatGAP",
        origin: "Việt Nam",
        unit: "Hộp",
        qty: 5,
        manufactureDate: "3 ngày trước",
        expiry: "2026-01-20",
        shelfLife: "3 ngày",
        weight: "300g",
        ingredients: "Xà lách, cà chua",
        usage: "Rửa lại trước khi dùng",
        storage: "5°C",
        manufacturer: "Dalat Farm",
        warning: "Dùng ngay sau khi mở",
        organization: "DalatGAP VN",
        originalPrice: 30000,
        salePrice: 10000,
    },

    // ===== CÒN DÀI HẠN =====
    {
        id: "P009",
        image: "https://picsum.photos/seed/p009/100",
        name: "Mì trứng Safoco",
        description: "Mì sợi khô",
        category: "Thực phẩm khô",
        brand: "Safoco",
        origin: "Việt Nam",
        unit: "Gói",
        qty: 50,
        manufactureDate: "In trên bao bì",
        expiry: "2027-05-01",
        shelfLife: "12 tháng",
        weight: "500g",
        ingredients: "Bột mì, trứng",
        usage: "Luộc 3–5 phút",
        storage: "Nơi khô ráo",
        manufacturer: "Safoco",
        warning: "Có gluten",
        organization: "Safoco VN",
        originalPrice: 18000,
        salePrice: 15300,
    },

    // ===== TẠO THÊM TỰ ĐỘNG TỪ P010 → P050 =====
    ...Array.from({ length: 41 }, (_, i) => {
        const idNum = (i + 10).toString().padStart(3, "0");
        return {
            id: `P${idNum}`,
            image: `https://picsum.photos/seed/p${idNum}/100`,
            name: `Sản phẩm demo ${idNum}`,
            description: "Thực phẩm dùng để test hệ thống",
            category: ["Thực phẩm khô", "Đồ uống", "Đông lạnh", "Bánh kẹo"][i % 4],
            brand: ["Vinamilk", "CP", "Ajinomoto", "TH", "Orion"][i % 5],
            origin: ["Việt Nam", "Thái Lan", "Hàn Quốc", "Nhật Bản"][i % 4],
            unit: "Gói",
            qty: Math.floor(Math.random() * 100) + 1,
            manufactureDate: "In trên bao bì",
            expiry: ["2026-02-15", "2026-01-31", "2026-01-29", "2026-01-28", "2025-12-30"][i % 5],
            shelfLife: "6–12 tháng",
            weight: "200g",
            ingredients: "Nguyên liệu tổng hợp",
            usage: "Dùng trực tiếp hoặc chế biến",
            storage: "Nơi khô ráo, thoáng mát",
            manufacturer: "Demo Foods Co.",
            warning: "Không dùng khi có dấu hiệu hư hỏng",
            organization: "Demo VN",
            originalPrice: 20000 + i * 1000,
            salePrice: 15000 + i * 800,
        };
    })
];