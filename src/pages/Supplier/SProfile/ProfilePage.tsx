import { useEffect, useState } from "react"
import { getAuthSession } from "@/utils/authStorage"
import { AuthData, User } from "@/types/auth.types"

function Info({
    label,
    value,
}: {
    label: string
    value?: string | number | React.ReactNode
}) {
    return (
        <div className="space-y-1">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="font-medium break-all">
                {value !== undefined && value !== null ? value : "-"}
            </div>
        </div>
    )
}

function Section({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <section className="bg-white border rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {children}
            </div>
        </section>
    )
}

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
    const memberships = user.marketStaffMemberships ?? []

    return (
        <div className="min-h-screen bg-white py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* HEADER */}
                <div className="bg-white border rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold">
                            {user.fullName?.charAt(0)}
                        </div>
                        <div>
                            <div className="text-xl font-semibold">
                                {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                                {user.roleName}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">
                            Đổi mật khẩu
                        </button>
                        <button className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">
                            Đăng xuất
                        </button>
                    </div>
                </div>

                {/* ACCOUNT */}
                <Section title="Thông tin tài khoản">
                    <Info label="Email" value={user.email} />
                    <Info label="Số điện thoại" value={user.phone} />
                    <Info label="Role" value={user.roleName} />
                    <Info label="Role ID" value={user.roleId} />
                    <Info
                        label="Trạng thái"
                        value={
                            user.status === 1 ? (
                                <span className="text-green-600 font-semibold">
                                    Hoạt động
                                </span>
                            ) : (
                                <span className="text-red-500 font-semibold">
                                    Ngưng
                                </span>
                            )
                        }
                    />
                    <Info
                        label="Ngày tạo"
                        value={new Date(user.createdAt).toLocaleString()}
                    />
                    <Info
                        label="Cập nhật lần cuối"
                        value={new Date(user.updatedAt).toLocaleString()}
                    />
                </Section>

                {/* STAFF — context hiện tại (JWT) */}
                {marketStaff && (
                    <Section title="Thông tin nhân sự (phiên hiện tại)">
                        <Info
                            label="Mã nhân sự"
                            value={marketStaff.marketStaffId}
                        />
                        <Info label="Chức vụ" value={marketStaff.position} />
                        {marketStaff.isManager !== undefined && (
                            <Info
                                label="Quản lý"
                                value={marketStaff.isManager ? "Có" : "Không"}
                            />
                        )}
                        {marketStaff.employeeCodeHint != null &&
                            marketStaff.employeeCodeHint !== "" && (
                                <Info
                                    label="Gợi ý mã NV (cuối)"
                                    value={marketStaff.employeeCodeHint}
                                />
                            )}
                        <Info
                            label="Ngày vào làm"
                            value={new Date(
                                marketStaff.joinedAt
                            ).toLocaleString()}
                        />
                    </Section>
                )}

                {/* Tất cả persona nhân viên gắn tài khoản (shared login) */}
                {memberships.length > 1 && (
                    <Section title="Các mã nhân viên trên tài khoản">
                        {memberships.map((m) => (
                            <div
                                key={m.marketStaffId}
                                className="col-span-full sm:col-span-2 border rounded-lg p-3 space-y-2"
                            >
                                <Info
                                    label="Mã nhân sự"
                                    value={m.marketStaffId}
                                />
                                <Info label="Chức vụ" value={m.position} />
                                <Info
                                    label="Siêu thị"
                                    value={m.supermarket?.name ?? "-"}
                                />
                            </div>
                        ))}
                    </Section>
                )}

                {/* SUPERMARKET */}
                {supermarket && (
                    <Section title="Thông tin siêu thị">
                        <Info label="Tên siêu thị" value={supermarket.name} />
                        <Info label="Địa chỉ" value={supermarket.address} />
                        <Info
                            label="Liên hệ"
                            value={supermarket.contactPhone}
                        />
                        <Info
                            label="Supermarket ID"
                            value={supermarket.supermarketId}
                        />
                    </Section>
                )}

                {/* SECURITY */}
                <Section title="Bảo mật & hệ thống">
                    <Info label="User ID" value={user.userId} />
                    <Info label="Login Method" value="Email / Password" />
                    <Info label="Session" value="Active" />
                    <Info label="Environment" value="Internal System" />
                </Section>
            </div>
        </div>
    )
}
