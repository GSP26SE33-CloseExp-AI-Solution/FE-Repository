import { useEffect, useState } from "react"
import { getAuthSession } from "@/utils/authStorage"
import { AuthData, User } from "@/types/auth.types"

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const session: AuthData | null = getAuthSession()
        if (session?.user) {
            setUser(session.user)
        }
    }, [])

    if (!user) {
        return <div className="p-6">Không có thông tin người dùng</div>
    }

    const marketStaff = user.marketStaffInfo
    const supermarket = marketStaff?.supermarket

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Thông tin người dùng</h1>

            {/* THÔNG TIN TÀI KHOẢN */}
            <section className="border rounded p-4 space-y-2">
                <h2 className="font-medium text-lg">Tài khoản</h2>
                <div><b>Họ tên:</b> {user.fullName}</div>
                <div><b>Email:</b> {user.email}</div>
                <div><b>Số điện thoại:</b> {user.phone}</div>
                <div><b>Vai trò:</b> {user.roleName} (ID: {user.roleId})</div>
                <div><b>Trạng thái:</b> {user.status === 1 ? "Hoạt động" : "Ngưng"}</div>
                <div><b>Ngày tạo:</b> {new Date(user.createdAt).toLocaleString()}</div>
                <div><b>Cập nhật:</b> {new Date(user.updatedAt).toLocaleString()}</div>
            </section>

            {/* THÔNG TIN NHÂN SỰ */}
            {marketStaff && (
                <section className="border rounded p-4 space-y-2">
                    <h2 className="font-medium text-lg">Nhân sự</h2>
                    <div><b>Mã nhân sự:</b> {marketStaff.marketStaffId}</div>
                    <div><b>Chức vụ:</b> {marketStaff.position}</div>
                    <div><b>Ngày vào làm:</b> {new Date(marketStaff.joinedAt).toLocaleString()}</div>
                </section>
            )}

            {/* THÔNG TIN SIÊU THỊ */}
            {supermarket && (
                <section className="border rounded p-4 space-y-2">
                    <h2 className="font-medium text-lg">Siêu thị</h2>
                    <div><b>Tên:</b> {supermarket.name}</div>
                    <div><b>Địa chỉ:</b> {supermarket.address}</div>
                    <div><b>Liên hệ:</b> {supermarket.contactPhone}</div>
                    <div><b>ID:</b> {supermarket.supermarketId}</div>
                </section>
            )}
        </div>
    )
}
