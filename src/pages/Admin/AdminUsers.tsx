import { useEffect, useMemo, useState } from "react"
import { RefreshCw, Search, Shield, UserCog, Users } from "lucide-react"

import { getUsersApi, updateUserStatusApi } from "@/services/user.service"
import { User } from "@/types/user.type"
import { showError, showSuccess } from "@/utils/toast"

const USER_STATUS = {
    UNVERIFIED: 0,
    PENDING_APPROVAL: 1,
    ACTIVE: 2,
    REJECTED: 3,
    LOCKED: 4,
    BANNED: 5,
    DELETED: 6,
    HIDDEN: 7,
} as const

const getStatusLabel = (status: number) => {
    switch (status) {
        case USER_STATUS.UNVERIFIED:
            return "Chưa xác minh"
        case USER_STATUS.PENDING_APPROVAL:
            return "Chờ duyệt"
        case USER_STATUS.ACTIVE:
            return "Đang hoạt động"
        case USER_STATUS.REJECTED:
            return "Đã từ chối"
        case USER_STATUS.LOCKED:
            return "Tạm khóa"
        case USER_STATUS.BANNED:
            return "Bị cấm"
        case USER_STATUS.DELETED:
            return "Đã xóa"
        case USER_STATUS.HIDDEN:
            return "Đã ẩn"
        default:
            return `Không rõ (${status})`
    }
}

const getStatusClass = (status: number) => {
    switch (status) {
        case USER_STATUS.UNVERIFIED:
            return "border border-sky-200 bg-sky-100 text-sky-700"
        case USER_STATUS.PENDING_APPROVAL:
            return "border border-amber-200 bg-amber-100 text-amber-700"
        case USER_STATUS.ACTIVE:
            return "border border-emerald-200 bg-emerald-100 text-emerald-700"
        case USER_STATUS.REJECTED:
            return "border border-rose-200 bg-rose-100 text-rose-700"
        case USER_STATUS.LOCKED:
            return "border border-orange-200 bg-orange-100 text-orange-700"
        case USER_STATUS.BANNED:
            return "border border-red-200 bg-red-100 text-red-700"
        case USER_STATUS.DELETED:
            return "border border-slate-300 bg-slate-200 text-slate-700"
        case USER_STATUS.HIDDEN:
            return "border border-violet-200 bg-violet-100 text-violet-700"
        default:
            return "border border-gray-200 bg-gray-100 text-gray-700"
    }
}

const roleOptions = [
    "Tất cả",
    "Admin",
    "SupermarketStaff",
    "PackagingStaff",
    "MarketingStaff",
    "DeliveryStaff",
    "Vendor",
]

const statusOptions = [
    { label: "Tất cả", value: -1 },
    { label: "Chưa xác minh", value: USER_STATUS.UNVERIFIED },
    { label: "Chờ duyệt", value: USER_STATUS.PENDING_APPROVAL },
    { label: "Đang hoạt động", value: USER_STATUS.ACTIVE },
    { label: "Đã từ chối", value: USER_STATUS.REJECTED },
    { label: "Tạm khóa", value: USER_STATUS.LOCKED },
    { label: "Bị cấm", value: USER_STATUS.BANNED },
    { label: "Đã xóa", value: USER_STATUS.DELETED },
    { label: "Đã ẩn", value: USER_STATUS.HIDDEN },
]

const AdminUsers = () => {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [actionUserId, setActionUserId] = useState<string | null>(null)

    const [keyword, setKeyword] = useState("")
    const [roleFilter, setRoleFilter] = useState("Tất cả")
    const [statusFilter, setStatusFilter] = useState<number>(-1)

    const loadUsers = async () => {
        try {
            setLoading(true)
            const data = await getUsersApi()
            setUsers(data)
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Không tải được danh sách tài khoản"
            showError(message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [])

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const q = keyword.trim().toLowerCase()
            const matchKeyword =
                !q ||
                user.fullName?.toLowerCase().includes(q) ||
                user.email?.toLowerCase().includes(q) ||
                user.phone?.toLowerCase().includes(q)

            const matchRole =
                roleFilter === "Tất cả" || user.roleName === roleFilter

            const matchStatus =
                statusFilter === -1 || user.status === statusFilter

            return matchKeyword && matchRole && matchStatus
        })
    }, [users, keyword, roleFilter, statusFilter])

    const stats = useMemo(() => {
        return {
            total: users.length,
            active: users.filter((u) => u.status === USER_STATUS.ACTIVE).length,
            pending: users.filter((u) => u.status === USER_STATUS.PENDING_APPROVAL).length,
            locked: users.filter((u) => u.status === USER_STATUS.LOCKED).length,
        }
    }, [users])

    const handleQuickStatus = async (userId: string, status: number) => {
        try {
            setActionUserId(userId)
            await updateUserStatusApi(userId, { status })
            setUsers((prev) =>
                prev.map((user) =>
                    user.userId === userId ? { ...user, status } : user
                )
            )
            showSuccess("Đã cập nhật trạng thái tài khoản")
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Cập nhật trạng thái thất bại"
            showError(message)
        } finally {
            setActionUserId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-slate-800">
                            <Users className="h-6 w-6" />
                            <h1 className="text-2xl font-bold">Quản lý tài khoản</h1>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            Theo dõi tất cả tài khoản trong hệ thống, lọc theo vai trò và cập nhật trạng thái hoạt động.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadUsers}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Tải lại
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Tổng tài khoản</p>
                    <p className="mt-2 text-3xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Đang hoạt động</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.active}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Chờ duyệt</p>
                    <p className="mt-2 text-3xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Tạm khóa</p>
                    <p className="mt-2 text-3xl font-bold text-orange-600">{stats.locked}</p>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Tìm theo họ tên, email, số điện thoại..."
                            className="w-full rounded-2xl border border-slate-300 py-2 pl-10 pr-4 outline-none focus:border-slate-900"
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                    >
                        {roleOptions.map((role) => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(Number(e.target.value))}
                        className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-slate-900"
                    >
                        {statusOptions.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Danh sách tài khoản hệ thống
                    </h2>
                </div>

                {loading ? (
                    <div className="px-6 py-10 text-center text-slate-500">
                        Đang tải dữ liệu...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="px-6 py-10 text-center text-slate-500">
                        Không có tài khoản nào phù hợp bộ lọc.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-white">
                                <tr className="text-left text-sm text-slate-500">
                                    <th className="px-6 py-4 font-medium">Họ tên</th>
                                    <th className="px-6 py-4 font-medium">Email</th>
                                    <th className="px-6 py-4 font-medium">Số điện thoại</th>
                                    <th className="px-6 py-4 font-medium">Vai trò</th>
                                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                                    <th className="px-6 py-4 font-medium">Ngày tạo</th>
                                    <th className="px-6 py-4 font-medium text-right">Tác vụ nhanh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user) => {
                                    const isActing = actionUserId === user.userId

                                    return (
                                        <tr
                                            key={user.userId}
                                            className="border-t border-slate-100 text-sm text-slate-700"
                                        >
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                {user.fullName}
                                            </td>
                                            <td className="px-6 py-4">{user.email}</td>
                                            <td className="px-6 py-4">{user.phone || "--"}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                                    <Shield className="h-3.5 w-3.5" />
                                                    {user.roleName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                                                        user.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(user.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(user.createdAt).toLocaleString("vi-VN")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={isActing || user.status === USER_STATUS.ACTIVE}
                                                        onClick={() =>
                                                            handleQuickStatus(
                                                                user.userId,
                                                                USER_STATUS.ACTIVE
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Kích hoạt
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isActing || user.status === USER_STATUS.LOCKED}
                                                        onClick={() =>
                                                            handleQuickStatus(
                                                                user.userId,
                                                                USER_STATUS.LOCKED
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Tạm khóa
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isActing || user.status === USER_STATUS.BANNED}
                                                        onClick={() =>
                                                            handleQuickStatus(
                                                                user.userId,
                                                                USER_STATUS.BANNED
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Cấm
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                    <UserCog className="mt-0.5 h-4 w-4 text-slate-500" />
                    <div>
                        Trung tâm quản lý tất cả tài khoản.
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminUsers
