# FE-Repository  
## Frontend Service – Near-Expiry Food Trading Platform

Frontend (ReactJS + TypeScript) chịu trách nhiệm xây dựng giao diện người dùng cho hệ thống giao dịch thực phẩm cận hạn. FE đảm nhiệm việc hiển thị dữ liệu, điều hướng nghiệp vụ theo vai trò và giao tiếp với Backend thông qua REST API.

README này mô tả **phạm vi, công nghệ, cấu trúc và quy ước phát triển** của FE-Repository trong đồ án.

---

## 1) Mục tiêu & Phạm vi

- Cung cấp giao diện web cho toàn bộ người dùng của hệ thống giao dịch thực phẩm cận hạn
- Hiển thị dữ liệu nghiệp vụ từ Backend và các kết quả xử lý liên quan đến AI
- Điều hướng chức năng theo vai trò người dùng
- Hỗ trợ luồng mua hàng, đặt hàng, thanh toán và phản hồi của khách hàng
- Hỗ trợ nhân viên siêu thị đăng sản phẩm/lô hàng cận hạn
- Hỗ trợ nhân viên đóng gói xử lý đơn hàng theo từng trạng thái
- Hỗ trợ nhân viên giao hàng theo dõi và cập nhật trạng thái giao
- Hỗ trợ Admin quản lý hệ thống, dữ liệu nền, người dùng, nhân sự và thống kê
- Đảm bảo trải nghiệm người dùng rõ ràng, dễ sử dụng và bám sát quy trình nghiệp vụ

### Các vai trò FE hỗ trợ

- **Admin**: quản lý hệ thống, người dùng, nhân sự, siêu thị, cấu hình hệ thống, dashboard và thống kê
- **Nhân viên siêu thị / bên bán**: quản lý sản phẩm, tạo sản phẩm/lô hàng cận hạn, import sản phẩm, xem OCR, giá thị trường và giá gợi ý từ AI
- **Nhân viên đóng gói**: xem đơn chờ xử lý, ghi nhận gom hàng, đóng gói, báo lỗi và xem lịch sử đóng gói
- **Nhân viên giao hàng**: xem nhóm giao hàng, nhận việc, bắt đầu giao, xác nhận giao hàng, báo lỗi giao hàng và xem lịch sử giao
- **Nhân viên marketing**: quản lý khuyến mãi, xem lượt sử dụng khuyến mãi và báo cáo marketing
- **Hộ kinh doanh thực phẩm / khách hàng**: tìm kiếm sản phẩm, thêm vào giỏ hàng, đặt hàng, thanh toán, theo dõi đơn và gửi phản hồi

---

## 2) Công nghệ Frontend sử dụng

- **Framework**: ReactJS + TypeScript
- **Build Tool**: Create React App
- **Routing**: React Router
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Icon Library**: Lucide React
- **Notification**: React Hot Toast
- **Form Handling**: React Hook Form
- **Schema Validation**: Zod
- **UI Library**: Radix UI
- **Map / Location Picker**: Mapbox
- **State Management**: React Hooks, Context API và local storage helpers

---

## 3) Cấu trúc thư mục

```
src/
    assets/                 # Logo, hình ảnh tĩnh
    components/             # UI components dùng chung
        ai/                 # Component liên quan đến AI token
        layouts/            # Header, footer, sidebar, layout theo vai trò
        profile/            # Component hồ sơ dùng chung
        uiCommon/           # Component giao diện dùng chung
        uiLogin/            # Component giao diện đăng nhập
    constants/              # Hằng số, config layout, breadcrumb, storage key
    contexts/               # React Context, ví dụ AuthContext
    hooks/                  # Custom React hooks
    mappers/                # Mapper chuyển đổi dữ liệu API sang form/UI
    pages/                  # Trang theo chức năng & vai trò
        Admin/              # Trang quản trị
        Auth/               # Đăng nhập, đăng ký, OTP, quên mật khẩu
        Common/             # Trang lỗi chung
        Home/               # Trang chủ, sản phẩm, chi tiết sản phẩm
        MarketingStaff/     # Trang nhân viên marketing
        PackagingStaff/     # Trang nhân viên đóng gói
        SupermarketStaff/   # Trang nhân viên siêu thị
        Vendor/             # Trang khách hàng/hộ kinh doanh
    routes/                 # AppRouter, PrivateRoute, RoleRoute, RoleRedirect
    services/               # Gọi REST API
    styles/                 # CSS/theme dùng chung
    types/                  # TypeScript types cho API và UI
    utils/                  # Helper, storage, axiosClient, toast
    App.tsx                 # Component gốc
    index.css               # Tailwind base/components/utilities
    index.tsx               # Entry point React
public/
package.json
README.md
```

---

## 4) Quy ước & tiêu chuẩn phát triển

- Chỉ sử dụng React Functional Component
- Code FE sử dụng TypeScript
- Hạn chế dùng any; ưu tiên khai báo type rõ ràng trong src/types
- Business logic và API call đặt trong services/, hooks/ hoặc helper tương ứng
- UI component ưu tiên chỉ xử lý render, props và interaction đơn giản
- API response dùng type chung ApiResponse<T>
- Dữ liệu phân trang dùng type chung PaginationResult<T>
- Validate form bằng React Hook Form + Zod khi form có nghiệp vụ rõ ràng
- Kiểm tra null/undefined trước khi render bằng ?., ??
- Không gọi API trực tiếp rải rác nếu đã có service tương ứng
- Không đặt logic Backend hoặc AI trong FE
- Các màn hình lớn nên tách nhỏ thành component con, modal, table, panel và file utils
- Các route cần kiểm tra đăng nhập dùng PrivateRoute
- Các route theo vai trò dùng RoleRoute
- Điều hướng sau đăng nhập theo vai trò được xử lý qua RoleRedirect
- Token, refresh token và interceptor được xử lý tập trung qua axiosClient và authStorage
- Thông báo lỗi/thành công dùng helper toast chung
- Khi đăng xuất cần reset dữ liệu phiên làm việc phù hợp, ví dụ giỏ hàng phía client

---

## 5) Nghiệp vụ FE chính

### Xác thực & phân quyền

- Đăng nhập bằng email/password
- Đăng ký tài khoản
- Xác minh OTP
- Gửi lại OTP
- Quên mật khẩu và đặt lại mật khẩu
- Đăng xuất một thiết bị
- Đăng xuất tất cả thiết bị
- Đăng nhập bằng Google
- Chọn staff context bằng mã nhân viên khi tài khoản cần chọn ngữ cảnh làm việc
- Điều hướng người dùng về đúng portal theo vai trò
- Bảo vệ route theo trạng thái đăng nhập và vai trò

### Trang chủ & mua hàng

- Hiển thị danh sách sản phẩm/lô hàng còn khả dụng
- Tìm kiếm và lọc sản phẩm
- Xem chi tiết sản phẩm
- Hiển thị sản phẩm theo siêu thị, đơn vị bán và hạn sử dụng
- Chỉ cho chọn option có hàng hợp lệ
- Thêm sản phẩm vào giỏ hàng
- Quản lý số lượng trong giỏ hàng
- Reset giỏ hàng khi đăng xuất
- Checkout đơn hàng
- Chọn địa chỉ nhận hàng
- Chọn hình thức nhận/giao
- Xử lý kết quả thanh toán
- Xem danh sách đơn hàng của bản thân
- Xem chi tiết đơn hàng
- Gửi phản hồi/đánh giá đơn hàng

### Quản lý sản phẩm & lô hàng

- Quản lý sản phẩm của siêu thị
- Tạo và cập nhật sản phẩm
- Xem chi tiết sản phẩm
- Tạo lot sản phẩm
- Publish lot lên hệ thống
- Quản lý nhiều lot của cùng một sản phẩm
- Hiển thị ngày sản xuất, hạn sử dụng, số lượng, đơn vị, giá hiện hành, giá bán và giá AI
- Import sản phẩm bằng file Excel
- Preview file import
- Mapping cột Excel với field hệ thống
- Tích hợp barcode lookup
- Tích hợp phân tích ảnh sản phẩm bằng AI
- Tích hợp giá thị trường tham khảo
- Tích hợp gợi ý giá AI

### Đóng gói đơn hàng

- Xem danh sách đơn chờ đóng gói
- Xem chi tiết đơn hàng
- Hiển thị sản phẩm thuộc siêu thị nào
- Lọc đơn theo siêu thị
- Ghi nhận bắt đầu gom hàng
- Ghi chú khi bắt đầu gom
- Ghi nhận gom xong
- Chuyển sang bước đóng gói
- Ghi nhận hoàn tất đóng gói
- Báo lỗi đóng gói kèm lý do
- Xem lịch sử đóng gói

### Quản trị hệ thống

- Xem dashboard tổng quan
- Xem doanh thu, tổng đơn, tổng người dùng, siêu thị hoạt động và cảnh báo SLA
- Xem biểu đồ doanh thu
- Quản lý người dùng
- Cập nhật trạng thái người dùng
- Quản lý nhân sự nội bộ
- Tạo nhân sự nội bộ
- Xem chi tiết nhân sự
- Quản lý siêu thị
- Duyệt hoặc từ chối hồ sơ siêu thị
- Quản lý cấu hình hệ thống:
  - Khung giờ giao hàng
  - Điểm nhận hàng
  - Đơn vị tính
  - Danh mục
  - Khuyến mãi
- Quản lý và phân công nhóm giao hàng
- Theo dõi phản hồi người dùng
- Theo dõi lịch sử AI pricing
- Theo dõi trạng thái/token AI

### Marketing

- Quản lý danh sách khuyến mãi
- Tạo khuyến mãi
- Cập nhật khuyến mãi
- Cập nhật trạng thái khuyến mãi
- Xem lượt sử dụng khuyến mãi
- Xem analytics tổng quan
- Xem top promotion
- Xem trend theo promotion
- Xem báo cáo marketing

### Hồ sơ cá nhân

- Hiển thị hồ sơ theo vai trò
- Dùng component hồ sơ chung để giảm lặp code
- Hiển thị thông tin tài khoản, vai trò và trạng thái người dùng

---

## 6) Tích hợp Backend & AI

- FE giao tiếp với **.NET Backend** thông qua REST API
- FE sử dụng **Axios** để gọi API
- Xác thực bằng **JWT access token** và **refresh token**
- Token được gắn vào request thông qua Axios interceptor
- Refresh token được xử lý tập trung trong `axiosClient`
- Backend gọi sang **AI Service (Python/FastAPI)** khi cần xử lý AI
- FE không xử lý logic AI trực tiếp, chỉ gửi request và hiển thị kết quả từ Backend
- API contract được quản lý dựa trên Swagger/API document của Backend

---

## 7) Triển khai

- **Frontend Hosting**: Vercel
- **CDN & Security**: Cloudflare
- **Build Tool**: Create React App
- **Backend**: .NET REST API
- **AI Service**: Python/FastAPI, được Backend gọi gián tiếp

### Cài đặt dependencies

```bash
npm install
```

### Chạy môi trường development

```bash
npm start
```

### Build production

```bash
npm run build
```

### Chạy test

```bash
npm test
```

### Biến môi trường

Dự án có thể sử dụng file môi trường để cấu hình API base URL, Mapbox token hoặc các cấu hình cần thiết khác.

Ví dụ:

```env
REACT_APP_API_BASE_URL=https://your-api-domain.com
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
```
Tên biến thực tế có thể thay đổi tùy cấu hình hiện tại của project.

---

## 8) Ghi chú

- Repository này **chỉ chứa Frontend**
- Không xử lý logic Backend, database hoặc AI model
- Không xác thực/phân quyền thật ở phía server
- Không xử lý thanh toán phía server
- Không lưu trữ file ảnh phía server
- FE có thể triển khai độc lập nếu cấu hình đúng API base URL
- API contract được định nghĩa và cập nhật theo tài liệu Backend/Swagger
- Các type API nên được cập nhật khi Backend thay đổi response/request
- Với Tailwind CSS, VS Code có thể báo cảnh báo `unknownAtRules` tại `@tailwind`, `@layer`, `@apply`; đây là cảnh báo editor, không phải lỗi build
