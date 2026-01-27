import { Search, Plus, Eye, Pencil, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, ChangeEvent } from "react";

// FAKE DATA
interface Product {
    image: string;               // Hình ảnh
    name: string;                // Tên sản phẩm
    description: string;         // Mô tả
    category: string;            // Phân loại
    brand: string;               // Thương hiệu
    origin: string;              // Xuất xứ
    unit: string;                // Đơn vị
    qty: number;                 // Số lượng

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
    salePrice: number;           // Giá bán
}

const demoProducts: Product[] = [
    {
        image: "https://picsum.photos/seed/crabstick/100",
        name: "Thanh cua 3N",
        description: "Thanh cua đông lạnh",
        category: "Thực phẩm chế biến",
        brand: "3N",
        origin: "Thái Lan",
        unit: "Gói",
        qty: 40,
        manufactureDate: "Xem trên bao bì",
        expiry: "2026-12-31",
        shelfLife: "2 năm kể từ NSX",
        weight: "250G",
        ingredients: "Surimi 48%, thịt cá trắng, đường, trứng, chất làm ẩm INS 450, 451, 452, hương cua tổng hợp.",
        usage: "Rã đông rồi chế biến món xào, lẩu, mì, cơm chiên. Nấu 1–2 phút.",
        storage: "Bảo quản -18℃ hoặc ngăn đá.",
        manufacturer: "Lucky Union Foods Co., Ltd - Thailand",
        warning: "Không dùng khi có mùi lạ.",
        organization: "Liên hiệp HTX Thương mại TP.HCM",
        originalPrice: 52000,
        salePrice: 38900,
    },
    {
        image: "https://picsum.photos/seed/milk/100",
        name: "Sữa tươi Vinamilk",
        description: "Sữa tiệt trùng có đường",
        category: "Sữa & chế phẩm sữa",
        brand: "Vinamilk",
        origin: "Việt Nam",
        unit: "Lốc 4 hộp",
        qty: 24,
        manufactureDate: "In trên bao bì",
        expiry: "2026-02-01",
        shelfLife: "6 tháng",
        weight: "180ml x 4",
        ingredients: "Sữa bò tươi, đường, vitamin D3",
        usage: "Lắc đều trước khi uống, ngon hơn khi lạnh.",
        storage: "Nơi khô ráo, sau khi mở giữ lạnh.",
        manufacturer: "Công ty CP Sữa Việt Nam",
        warning: "Không dùng nếu hộp phồng.",
        organization: "Vinamilk Việt Nam",
        originalPrice: 32000,
        salePrice: 25000,
    },
    {
        image: "https://picsum.photos/seed/sausage/100",
        name: "Xúc xích Đức Việt",
        description: "Xúc xích tiệt trùng",
        category: "Thực phẩm chế biến",
        brand: "Đức Việt",
        origin: "Việt Nam",
        unit: "Gói 5 cây",
        qty: 40,
        manufactureDate: "In trên bao bì",
        expiry: "2026-01-26",
        shelfLife: "9 tháng",
        weight: "175g",
        ingredients: "Thịt heo, mỡ heo, gia vị, protein đậu nành",
        usage: "Ăn liền hoặc chiên/nướng.",
        storage: "Bảo quản mát.",
        manufacturer: "Đức Việt Foods",
        warning: "Không dùng khi bao bì rách.",
        organization: "Đức Việt Việt Nam",
        originalPrice: 34000,
        salePrice: 25500,
    },
    {
        image: "https://picsum.photos/seed/cheese/100",
        name: "Phô mai Con Bò Cười",
        description: "Phô mai lát sandwich",
        category: "Sữa & chế phẩm sữa",
        brand: "Con Bò Cười",
        origin: "Pháp",
        unit: "Gói 10 lát",
        qty: 16,
        manufactureDate: "In trên bao bì",
        expiry: "2026-01-25",
        shelfLife: "12 tháng",
        weight: "200g",
        ingredients: "Sữa, muối, men lactic",
        usage: "Ăn trực tiếp hoặc kẹp bánh mì.",
        storage: "Giữ lạnh 2–8℃.",
        manufacturer: "Bel Group",
        warning: "Có chứa sữa.",
        organization: "Bel Việt Nam",
        originalPrice: 45000,
        salePrice: 27000,
    },
    {
        image: "https://picsum.photos/seed/bread/100",
        name: "Bánh mì sandwich ABC",
        description: "Bánh mì lát mềm",
        category: "Bánh mì",
        brand: "ABC Bakery",
        origin: "Việt Nam",
        unit: "Túi",
        qty: 10,
        manufactureDate: "In trên bao bì",
        expiry: "2026-01-28",
        shelfLife: "5 ngày",
        weight: "500g",
        ingredients: "Bột mì, men, đường, muối, sữa",
        usage: "Ăn trực tiếp hoặc nướng.",
        storage: "Nơi khô thoáng.",
        manufacturer: "ABC Bakery",
        warning: "Không dùng khi mốc.",
        organization: "ABC Bakery Việt Nam",
        originalPrice: 18000,
        salePrice: 12000,
    },
    {
        image: "https://picsum.photos/seed/yogurt/100",
        name: "Sữa chua TH",
        description: "Sữa chua lên men tự nhiên",
        category: "Sữa & chế phẩm sữa",
        brand: "TH True Milk",
        origin: "Việt Nam",
        unit: "Lốc 4 hũ",
        qty: 30,
        manufactureDate: "In trên bao bì",
        expiry: "2026-01-29",
        shelfLife: "30 ngày",
        weight: "100g x 4",
        ingredients: "Sữa bò tươi, men sữa chua",
        usage: "Ăn trực tiếp, ngon hơn khi lạnh.",
        storage: "Giữ lạnh 2–6℃.",
        manufacturer: "TH Milk",
        warning: "Không dùng khi có mùi lạ.",
        organization: "TH True Milk",
        originalPrice: 26000,
        salePrice: 16900,
    },
    {
        image: "https://picsum.photos/seed/juice/100",
        name: "Nước cam Twister",
        description: "Nước cam có tép",
        category: "Nước giải khát",
        brand: "Twister",
        origin: "Việt Nam",
        unit: "Chai 455ml",
        qty: 18,
        manufactureDate: "In trên bao bì",
        expiry: "2026-01-27",
        shelfLife: "8 tháng",
        weight: "455ml",
        ingredients: "Nước, nước cam cô đặc, đường",
        usage: "Lắc đều trước khi uống.",
        storage: "Nơi khô ráo.",
        manufacturer: "Suntory Pepsico",
        warning: "Không dùng khi chai phồng.",
        organization: "Pepsico Việt Nam",
        originalPrice: 15000,
        salePrice: 12000,
    },
    {
        image: "https://picsum.photos/seed/noodles/100",
        name: "Mì trứng Safoco",
        description: "Mì sợi trứng khô",
        category: "Thực phẩm khô",
        brand: "Safoco",
        origin: "Việt Nam",
        unit: "Gói 500g",
        qty: 50,
        manufactureDate: "In trên bao bì",
        expiry: "2026-01-24",
        shelfLife: "12 tháng",
        weight: "500g",
        ingredients: "Bột mì, trứng, muối",
        usage: "Luộc 3–5 phút trước khi dùng.",
        storage: "Nơi khô ráo.",
        manufacturer: "Safoco",
        warning: "Có chứa gluten.",
        organization: "Safoco Việt Nam",
        originalPrice: 18000,
        salePrice: 15300,
    },
    {
        image: "https://picsum.photos/seed/ham/100",
        name: "Thịt nguội CP",
        description: "Thịt heo xông khói",
        category: "Thực phẩm chế biến",
        brand: "CP",
        origin: "Thái Lan",
        unit: "Gói 200g",
        qty: 14,
        manufactureDate: "In trên bao bì",
        expiry: "2026-01-22",
        shelfLife: "6 tháng",
        weight: "200g",
        ingredients: "Thịt heo, muối, gia vị",
        usage: "Ăn trực tiếp hoặc áp chảo.",
        storage: "Giữ lạnh.",
        manufacturer: "CP Foods",
        warning: "Không dùng khi có nhớt.",
        organization: "CP Việt Nam",
        originalPrice: 52000,
        salePrice: 33800,
    },
    {
        image: "https://picsum.photos/seed/salad/100",
        name: "Rau salad Đà Lạt",
        description: "Rau củ trộn sẵn",
        category: "Rau củ quả",
        brand: "DalatGAP",
        origin: "Việt Nam",
        unit: "Hộp",
        qty: 10,
        manufactureDate: "Hôm qua",
        expiry: "2026-01-21",
        shelfLife: "3 ngày",
        weight: "300g",
        ingredients: "Xà lách, cà chua, dưa leo",
        usage: "Rửa lại trước khi dùng.",
        storage: "Giữ lạnh 5℃.",
        manufacturer: "DalatGAP Farm",
        warning: "Dùng trong ngày sau khi mở.",
        organization: "DalatGAP Việt Nam",
        originalPrice: 30000,
        salePrice: 15000,
    },
];

const SProducts: React.FC = () => {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState<string>("");

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setKeyword(e.target.value);
    };

    const handleAddProduct = () => {
        navigate("/supermarket/products/add");
    };

    // FORMAT DAY
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // FORMAT TIỀN 
    const formatPrice = (price: number) =>
        price.toLocaleString("vi-VN") + "đ";

    // TÍNH % GIẢM GIÁ
    const calcDiscount = (original: number, sale: number) =>
        Math.round(((original - sale) / original) * 100);

    // TÍNH TRẠNG THÁI HẠN
    const getExpiryStatus = (expiryDate: string) => {
        const today = new Date();
        const exp = new Date(expiryDate);

        today.setHours(0, 0, 0, 0);
        exp.setHours(0, 0, 0, 0);

        const diffTime = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 8) {
            return { label: "Còn hạn dài", color: "bg-green-100 text-green-700" };
        }

        if (diffDays >= 3 && diffDays <= 7) {
            return { label: "Còn hạn ngắn", color: "bg-green-100 text-green-700" };
        }

        if (diffDays >= 1 && diffDays <= 2) {
            return { label: "Sắp hết hạn", color: "bg-yellow-100 text-yellow-700" };
        }

        if (diffDays >= 0 && diffDays <= 0) {
            return { label: "Trong ngày", color: "bg-orange-100 text-orange-700" };
        }

        return { label: "Hết hạn", color: "bg-red-100 text-red-700" };
    };

    // TÍNH SỐ NGÀY CÒN LẠI
    const getDaysLeft = (expiryDate: string) => {
        const today = new Date();
        const expiry = new Date(expiryDate);

        // reset giờ để tránh lệch do timezone
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
    };

    // PHÂN TRANG
    const ITEMS_PER_PAGE = 10;

    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(demoProducts.length / ITEMS_PER_PAGE);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentProducts = demoProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const goNext = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const goPrev = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    return (
        <div className="w-full">
            {/* TOP BAR */}
            <div className="flex items-center gap-5 mb-6">
                <div className="flex items-center flex-1 h-[50px] bg-white border border-gray-200 rounded-lg px-4 shadow-sm focus-within:ring-2 focus-within:ring-green-600">
                    <Search className="text-green-700 mr-4" size={22} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm"
                        value={keyword}
                        onChange={handleSearchChange}
                        className="w-full outline-none text-[20px] text-gray-500 font-light"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleAddProduct}
                    className="flex items-center justify-center gap-3 w-[200px] h-[50px] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
                >
                    <span className="text-[20px] font-semibold">Thêm sản phẩm</span>
                    <Plus size={26} />
                </button>
            </div>

            {/* PRODUCT LIST */}
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden rounded-t-lg">

                {/* HEADER + FILTER */}
                <div className="bg-[#F5F5F5] border-b border-gray-200 h-[70px] flex items-center justify-between px-5">
                    <h2 className="text-[24px] font-bold text-gray-900">
                        Danh sách sản phẩm
                    </h2>

                    <div className="relative w-[200px] h-[50px] mr-[20px]">
                        <select
                            className="appearance-none w-full h-full bg-white border border-gray-200 rounded-lg pl-4 pr-12 text-[18px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-600"
                        >
                            <option>Tất cả</option>
                            <option>Còn hạn ngắn</option>
                            <option>Sắp hết hạn</option>
                            <option>Hết hạn</option>
                        </select>

                        <ChevronDown
                            size={20}
                            className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-gray-500"
                        />
                    </div>

                </div>

                {/* TABLE HEADER */}
                <div className="grid grid-cols-[90px_2.2fr_110px_140px_130px_120px_140px_150px_110px] bg-[#F5F5F5] border-b border-gray-200 px-5 h-[64px] items-center text-[15px] font-semibold text-gray-700">
                    <div>Hình ảnh</div>
                    <div>Thông tin sản phẩm</div>
                    <div className="text-center">Số lượng</div>
                    <div className="text-center">Hạn sử dụng</div>
                    <div className="text-center">Giá gốc</div>
                    <div className="text-center">Giảm giá</div>
                    <div className="text-center">Giá bán</div>
                    <div className="text-center">Trạng thái</div>
                    <div className="text-center">Action</div>
                </div>

                {/* TABLE ROWS */}
                {currentProducts.map((p, i) => {
                    const status = getExpiryStatus(p.expiry);
                    const discount = calcDiscount(p.originalPrice, p.salePrice);

                    return (
                        <div
                            key={i}
                            className="grid grid-cols-[90px_2.2fr_110px_140px_130px_120px_140px_150px_110px] items-center h-[76px] border-b border-gray-100 px-5 text-[15px] hover:bg-gray-50 transition"
                        >
                            {/* IMAGE */}
                            <div>
                                <img src={p.image} className="w-14 h-14 object-cover rounded-md border" />
                            </div>

                            {/* PRODUCT INFO */}
                            <div className="leading-tight">
                                <p className="font-semibold text-gray-900">{p.name}</p>
                                <p className="text-gray-500 text-sm">
                                    {p.description} • {p.brand}
                                </p>
                                <p className="text-gray-400 text-xs">
                                    {p.category} • {p.unit}
                                </p>
                            </div>

                            {/* QTY */}
                            <div className="text-center font-medium">{p.qty}</div>

                            {/* EXPIRY */}
                            <div className="text-center">
                                <div>{formatDate(p.expiry)}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Còn lại {getDaysLeft(p.expiry)} ngày
                                </div>
                            </div>

                            {/* ORIGINAL PRICE */}
                            <div className="text-center text-gray-400 line-through">
                                {formatPrice(p.originalPrice)}
                            </div>

                            {/* DISCOUNT */}
                            <div className="text-center text-red-600 font-semibold">
                                -{discount}%
                            </div>

                            {/* SALE PRICE */}
                            <div className="text-center font-semibold text-green-700">
                                {formatPrice(p.salePrice)}
                            </div>

                            {/* STATUS */}
                            <div className="text-center">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                                    {status.label}
                                </span>
                            </div>

                            {/* ACTION */}
                            <div className="flex justify-center gap-4">
                                <button className="text-gray-500 hover:text-blue-600">
                                    <Eye size={20} />
                                </button>
                                <button className="text-gray-500 hover:text-green-600">
                                    <Pencil size={20} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* PAGE BAR */}
            <div className="w-full h-[60px] bg-[#FAFAFA] border border-gray-200 border-t-0 rounded-b-lg flex items-center justify-center">
                <div className="flex items-center gap-8">
                    {/* Prev */}
                    <button
                        onClick={goPrev}
                        disabled={currentPage === 1}
                        className="p-2 rounded-md text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                    >
                        <ChevronLeft size={20} strokeWidth={2} />
                    </button>

                    {/* Page number */}
                    <span className="text-[20px] font-semibold text-gray-700">
                        Trang {currentPage}
                    </span>

                    {/* Next */}
                    <button
                        onClick={goNext}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-md text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-200 transition"
                    >
                        <ChevronRight size={20} strokeWidth={2} />
                    </button>
                </div>
            </div>

        </div>
    );
};

export default SProducts;
