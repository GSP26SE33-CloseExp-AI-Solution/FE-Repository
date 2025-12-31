# FE-Repository  
## Frontend Service – Near-Expiry Food Trading Platform

Frontend (ReactJS + TypeScript) chịu trách nhiệm xây dựng giao diện người dùng cho hệ thống giao dịch thực phẩm cận hạn. FE đảm nhiệm việc hiển thị dữ liệu, điều hướng nghiệp vụ theo vai trò và giao tiếp với Backend thông qua REST API.

README này mô tả **phạm vi, công nghệ, cấu trúc và quy ước phát triển** của FE-Repository trong đồ án.

---

## 1) Mục tiêu & Phạm vi

- Cung cấp giao diện web cho toàn bộ người dùng của hệ thống
- Hiển thị dữ liệu nghiệp vụ và kết quả xử lý từ Backend / AI
- Đảm bảo trải nghiệm người dùng rõ ràng, dễ sử dụng

### Các vai trò FE hỗ trợ
- **Admin**: quản lý hệ thống, người dùng và thống kê
- **Nhân viên siêu thị**: đăng sản phẩm cận hạn, xem OCR & giá AI
- **Nhân viên đóng gói**: theo dõi và cập nhật trạng thái đơn hàng
- **Nhân viên giao hàng**: xem và cập nhật trạng thái giao
- **Hộ kinh doanh thực phẩm**: duyệt, đặt hàng và gửi phản hồi

---

## 2) Công nghệ Frontend sử dụng

- **Framework**: ReactJS + TypeScript  
- **Routing**: React Router  
- **Form Handling**: React Hook Form  
- **Schema Validation**: Zod  
- **UI Library**: Radix UI  
- **HTTP Client**: Axios  

---

## 3) Cấu trúc thư mục

```
src/
    components/     # UI components dùng chung
    pages/          # Trang theo chức năng & vai trò
    hooks/          # Custom React hooks
    services/       # Gọi REST API
    utils/          # Helper, constants
    App.tsx         # Routing & layout chính
    public/
    package.json
README.md
```

---

## 4) Quy ước & tiêu chuẩn phát triển

- Chỉ sử dụng **React Functional Component**
- Code **100% bằng TypeScript** (không dùng .js / .jsx)
- Business logic và API call đặt trong `services/` hoặc `hooks/`
- UI component chỉ xử lý render và props
- Validate form bằng **React Hook Form + Zod**
- Kiểm tra null/undefined trước khi render (`?.`, `??`)

---

## 5) Nghiệp vụ FE chính

- Đăng nhập và phân quyền theo vai trò
- Quản lý sản phẩm cận hạn
- Hiển thị kết quả OCR và giá gợi ý từ AI
- Quản lý đơn hàng và trạng thái xử lý
- Dashboard và thống kê
- Gửi phản hồi người dùng

---

## 6) Tích hợp Backend & AI

- FE giao tiếp với **.NET Backend** thông qua REST API
- Backend gọi sang **AI Service (Python/FastAPI)**
- FE chỉ đảm nhiệm hiển thị và điều hướng nghiệp vụ
- Xác thực bằng JWT token

---

## 7) Triển khai

- **Frontend Hosting**: Vercel  
- **CDN & Security**: Cloudflare  
- **Build Tool**: Create React App  

---

## 8) Ghi chú

- Repository này **chỉ chứa Frontend**
- Không xử lý logic Backend hoặc AI
- API contract được định nghĩa trong tài liệu riêng
- FE có thể triển khai độc lập
