import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, XCircle, RefreshCw, ShieldAlert, Users } from "lucide-react"

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
            return "Chưa xác minh email"
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
            return "bg-sky-100 text-sky-700 border border-sky-200"
        case USER_STATUS.PENDING_APPROVAL:
            return "bg-amber-100 text-amber-700 border border-amber-200"
        case USER_STATUS.ACTIVE:
            return "bg-emerald-100 text-emerald-700 border border-emerald-200"
        case USER_STATUS.REJECTED:
            return "bg-rose-100 text-rose-700 border border-rose-200"
        case USER_STATUS.LOCKED:
            return "bg-orange-100 text-orange-700 border border-orange-200"
        case USER_STATUS.BANNED:
            return "bg-red-100 text-red-700 border border-red-200"
        case USER_STATUS.DELETED:
            return "bg-slate-200 text-slate-700 border border-slate-300"
        case USER_STATUS.HIDDEN:
            return "bg-violet-100 text-violet-700 border border-violet-200"
        default:
            return "bg-gray-100 text-gray-700 border border-gray-200"
    }
}

const AdminUsers = () => {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [actionUserId, setActionUserId] = useState<string | null>(null)

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

    const supermarketStaffUsers = useMemo(() => {
        return users.filter((user) => {
            const role = user.roleName?.toLowerCase()
            return role === "supermarketStaff" || role === "SupermarketStaff"
        })
    }, [users])

    const handleUpdateStatus = async (userId: string, status: number) => {
        try {
            setActionUserId(userId)
            await updateUserStatusApi(userId, { status })
            setUsers((prev) =>
                prev.map((user) =>
                    user.userId === userId ? { ...user, status } : user
                )
            )
            showSuccess("Cập nhật trạng thái tài khoản thành công")
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Cập nhật trạng thái thất bại"
            showError(message)
        } finally {
            setActionUserId(null)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-slate-800">
                                <Users className="h-6 w-6" />
                                <h1 className="text-2xl font-bold">Quản lý tài khoản supermarketStaff</h1>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                                Duyệt, từ chối hoặc theo dõi trạng thái các tài khoản supermarketStaff đăng ký mới.
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-500">Tổng supermarketStaff</p>
                        <p className="mt-2 text-3xl font-bold text-slate-800">
                            {supermarketStaffUsers.length}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-500">Chờ duyệt</p>
                        <p className="mt-2 text-3xl font-bold text-amber-600">
                            {
                                supermarketStaffUsers.filter(
                                    (user) => user.status === USER_STATUS.PENDING_APPROVAL
                                ).length
                            }
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-500">Đang hoạt động</p>
                        <p className="mt-2 text-3xl font-bold text-emerald-600">
                            {
                                supermarketStaffUsers.filter(
                                    (user) => user.status === USER_STATUS.ACTIVE
                                ).length
                            }
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-200">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Danh sách tài khoản supermarketStaff
                        </h2>
                    </div>

                    {loading ? (
                        <div className="px-6 py-10 text-center text-slate-500">
                            Đang tải dữ liệu...
                        </div>
                    ) : supermarketStaffUsers.length === 0 ? (
                        <div className="px-6 py-10 text-center text-slate-500">
                            Chưa có tài khoản supermarketStaff nào.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-slate-50">
                                    <tr className="text-left text-sm text-slate-500">
                                        <th className="px-6 py-4 font-medium">Họ tên</th>
                                        <th className="px-6 py-4 font-medium">Email</th>
                                        <th className="px-6 py-4 font-medium">Số điện thoại</th>
                                        <th className="px-6 py-4 font-medium">Vai trò</th>
                                        <th className="px-6 py-4 font-medium">Trạng thái</th>
                                        <th className="px-6 py-4 font-medium">Ngày tạo</th>
                                        <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {supermarketStaffUsers.map((user) => {
                                        const isPending = user.status === USER_STATUS.PENDING_APPROVAL
                                        const isActive = user.status === USER_STATUS.ACTIVE
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
                                                <td className="px-6 py-4">{user.phone}</td>
                                                <td className="px-6 py-4">{user.roleName}</td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(user.status)}`}
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
                                                            disabled={isActing || isActive}
                                                            onClick={() =>
                                                                handleUpdateStatus(
                                                                    user.userId,
                                                                    USER_STATUS.ACTIVE
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Duyệt
                                                        </button>

                                                        <button
                                                            type="button"
                                                            disabled={isActing || !isPending}
                                                            onClick={() =>
                                                                handleUpdateStatus(
                                                                    user.userId,
                                                                    USER_STATUS.REJECTED
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                            Từ chối
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

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                    <div className="flex items-start gap-2">
                        <ShieldAlert className="mt-0.5 h-4 w-4" />
                        <div>
                            Map trạng thái hiện tại: 0 = Chưa xác minh email, 1 = Chờ duyệt, 2 = Đang hoạt động, 3 = Đã từ chối, 4 = Tạm khóa, 5 = Bị cấm, 6 = Đã xóa, 7 = Đã ẩn.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminUsers
