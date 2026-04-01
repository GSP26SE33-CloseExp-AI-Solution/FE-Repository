export const BREAD_CRUMB_MAP: Record<string, string[]> = {
    "/admin/internal-staff": ["Quản trị", "Nhân sự nội bộ"],
    "/admin/approvals": ["Quản trị", "Phê duyệt"],
    "/admin/transactions": ["Quản trị", "Giao dịch"],
    "/admin/delivery": ["Quản trị", "Điều phối giao hàng"],
    "/admin/operations": ["Quản trị", "Điều phối đóng gói"],
    "/admin/feedbacks": ["Quản trị", "Phản hồi"],
    "/admin/reports": ["Quản trị", "Báo cáo"],
    "/admin/settings": ["Quản trị", "Cấu hình hệ thống"],
    "/admin/users": ["Quản trị", "Tài khoản"],
    "/admin/profile": ["Quản trị", "Hồ sơ"],
    "/admin": ["Quản trị", "Tổng quan"],

    "/supermarketStaff/products/add": ["Siêu thị", "Sản phẩm", "Thêm sản phẩm"],
    "/supermarketStaff/products/edit": ["Siêu thị", "Sản phẩm", "Chỉnh sửa"],
    "/supermarketStaff/products": ["Siêu thị", "Sản phẩm"],
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

    "/marketing/campaigns": ["Marketing", "Chiến dịch"],
    "/marketing/promotions": ["Marketing", "Khuyến mãi"],
    "/marketing/statistic": ["Marketing", "Hiệu quả"],
    "/marketing/feedbacks": ["Marketing", "Phản hồi khách hàng"],
    "/marketing/notification": ["Marketing", "Thông báo"],
    "/marketing/profile": ["Marketing", "Hồ sơ"],
    "/marketing/setting": ["Marketing", "Cài đặt"],
    "/marketing/dashboard": ["Marketing", "Tổng quan"],

    "/vendor": ["Mua sắm", "Trang chủ"],
    "/vendor/profile": ["Mua sắm", "Tài khoản"],
    "/cart": ["Mua sắm", "Giỏ hàng"],
    "/checkout": ["Mua sắm", "Thanh toán"],
    "/impact": ["Mua sắm", "Tác động"],
    "/payment-return": ["Mua sắm", "Kết quả thanh toán"],
}

export const getBreadcrumbsByPath = (pathname: string): string[] => {
    const matchedKey = Object.keys(BREAD_CRUMB_MAP)
        .sort((a, b) => b.length - a.length)
        .find((key) => pathname.startsWith(key))

    return matchedKey ? BREAD_CRUMB_MAP[matchedKey] : []
}
