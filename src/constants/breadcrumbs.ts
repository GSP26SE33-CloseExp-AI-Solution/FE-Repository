export const BREAD_CRUMB_MAP: Record<string, string[]> = {
    "/admin/internal-staff": ["Quản trị", "Nhân sự nội bộ"],
    "/admin/delivery": ["Quản trị", "Điều phối giao hàng"],
    "/admin/operations": ["Quản trị", "Điều phối đóng gói"],
    "/admin/feedbacks": ["Quản trị", "Phản hồi"],
    "/admin/refunds": ["Quản trị", "Hoàn tiền"],
    "/admin/reports": ["Quản trị", "Báo cáo"],
    "/admin/settings": ["Quản trị", "Cấu hình hệ thống"],
    "/admin/promotion-analytics": ["Quản trị", "Phân tích khuyến mãi"],
    "/admin/users": ["Quản trị", "Tài khoản"],
    "/admin/profile": ["Quản trị", "Hồ sơ"],
    "/admin": ["Quản trị", "Tổng quan"],
    "/admin/supermarkets": ["Quản trị", "Hồ sơ siêu thị"],

    "/supermarketStaff/products/add": ["Siêu thị", "Sản phẩm", "Thêm sản phẩm"],
    "/supermarketStaff/products/edit": ["Siêu thị", "Sản phẩm", "Chỉnh sửa"],
    "/supermarketStaff/products": ["Siêu thị", "Sản phẩm"],
    "/supermarketStaff/purchase-units": ["Siêu thị", "Đơn vị bán"],
    "/supermarketStaff/ai-tokens": ["Siêu thị", "AI Token"],
    "/supermarketStaff/statistic": ["Siêu thị", "Thống kê"],
    "/supermarketStaff/profile": ["Siêu thị", "Hồ sơ"],
    "/supermarketStaff/notification": ["Siêu thị", "Thông báo"],
    "/supermarketStaff/setting": ["Siêu thị", "Cài đặt"],
    "/supermarketStaff/dashboard": ["Siêu thị", "Tổng quan"],

    "/package/orders": ["Đóng gói", "Đơn chờ đóng gói"],
    "/package/collect": ["Đóng gói", "Thu gom sản phẩm"],
    "/package/packing": ["Đóng gói", "Hoàn tất đóng gói"],
    "/package/reports": ["Đóng gói", "Báo cáo"],
    "/package/profile": ["Đóng gói", "Hồ sơ"],
    "/package/notification": ["Đóng gói", "Thông báo"],
    "/package/setting": ["Đóng gói", "Cài đặt"],
    "/package/dashboard": ["Đóng gói", "Tổng quan"],

    "/marketing/promotions": ["Marketing", "Khuyến mãi"],
    "/marketing/category-products": ["Marketing", "Sản phẩm theo danh mục"],
    "/marketing/purchase-units": ["Marketing", "Sản phẩm theo danh mục"],
    "/marketing/reports": ["Marketing", "Hiệu quả"],
    "/marketing/notification": ["Marketing", "Thông báo"],
    "/marketing/profile": ["Marketing", "Hồ sơ"],

    "/vendor": ["Mua sắm", "Trang chủ"],
    "/vendor/profile": ["Mua sắm", "Tài khoản"],
    "/cart": ["Mua sắm", "Giỏ hàng"],
    "/checkout": ["Mua sắm", "Thanh toán"],
    "/impact": ["Mua sắm", "Tác động"],
    "/payment-return": ["Mua sắm", "Kết quả thanh toán"],
    "/orders": ["Mua sắm", "Đơn hàng của tôi"],
    "/notifications": ["Mua sắm", "Thông báo"],
}

type BreadcrumbOptions = {
    dynamicLabel?: string
}

export const getBreadcrumbsByPath = (
    pathname: string,
    options?: BreadcrumbOptions
): string[] => {
    if (pathname.startsWith("/orders/")) {
        return [
            "Mua sắm",
            "Đơn hàng của tôi",
            options?.dynamicLabel || "Chi tiết đơn hàng",
        ]
    }

    const matchedKey = Object.keys(BREAD_CRUMB_MAP)
        .sort((a, b) => b.length - a.length)
        .find((key) => pathname.startsWith(key))

    return matchedKey ? BREAD_CRUMB_MAP[matchedKey] : []
}
