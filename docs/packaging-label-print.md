# In tem đơn sau đóng gói (Packaging Staff)

## Vị trí trên giao diện

- Trang **Đóng gói** (`/package/packing?orderId=...`)
- Sau khi **toàn bộ dòng** trong đơn đã hoàn tất đóng gói

## Cách sử dụng

### 1. Hoàn tất đóng gói

1. Chọn các món đã kiểm tra đúng trong checklist.
2. Nhập ghi chú (tuỳ chọn) ở card **Hoàn tất đóng gói**.
3. Bấm **Hoàn tất đóng gói**.

### 2. Khi đơn xong hẳn

- Hệ thống hiện banner **Đã hoàn tất đóng gói** và khối **In tem đơn (mã vạch)**.
- Modal **In tem đơn** có thể tự mở — bạn có thể in ngay hoặc bấm **In sau**.

### 3. In tem

1. Xem trước tem: mã đơn, mã vạch CODE128 (giá trị = `orderCode`), khách, khung giờ, giao nhận, số món.
2. Chọn **Số túi / tem cần in** (1–10) nếu đơn chia nhiều túi.
3. Bấm **In tem đơn**.
4. Trình duyệt mở cửa sổ in → chọn máy in (máy in nhiệt 80mm hoặc A4) → **In**.
5. Dán tem lên từng túi/kiện tương ứng.

### 4. Xem lại đơn đã xong

- Từ danh sách đơn: **Xem chi tiết** hoặc URL `...&view=1`
- Khối in tem vẫn hiển thị để in lại khi cần.

## Lưu ý

- Chỉ in sau khi API xác nhận đóng gói xong; đơn còn dòng **Pending/Packaging** sẽ không hiện in tem.
- Cần **cho phép popup** nếu trình duyệt chặn cửa sổ in.
- Mã vạch quét = **mã đơn** (`orderCode`), dùng cho bàn giao / đối soát với Delivery.

## Phụ thuộc

- Thư viện `jsbarcode` (CODE128) — đã khai báo trong `package.json`.
