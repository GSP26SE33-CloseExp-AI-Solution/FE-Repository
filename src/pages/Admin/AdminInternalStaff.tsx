import { useEffect, useMemo, useState } from "react"
import {
    Briefcase,
    Building2,
    Mail,
    Phone,
    RefreshCcw,
    Search,
    ShieldCheck,
    UserCog,
    Users,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type { InternalStaffRow } from "@/types/admin.type"

const formatDateTime = (value?: string) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

const statusMap: Record<number, string> = {
    0: "Chờ duyệt",
    1: "Đang hoạt động",
    2: "Từ chối / Khóa",
}

const getStatusClass = (status?: number) => {
    switch (status) {
        case 0:
            return "border border-amber-200 bg-amber-100 text-amber-700"
        case 1:
            return "border border-emerald-200 bg-emerald-100 text-emerald-700"
        case 2:
            return "border border-rose-200 bg-rose-100 text-rose-700"
        default:
            return "border border-slate-200 bg-slate-100 text-slate-700"
    }
}

const getRoleClass = (roleName?: string) => {
    const normalized = roleName?.toLowerCase()

    if (normalized?.includes("admin")) {
        return "border border-violet-200 bg-violet-100 text-violet-700"
    }

    if (normalized?.includes("marketing")) {
        return "border border-sky-200 bg-sky-100 text-sky-700"
    }

    if (normalized?.includes("packaging")) {
        return "border border-orange-200 bg-orange-100 text-orange-700"
    }

    if (normalized?.includes("delivery")) {
        return "border border-cyan-200 bg-cyan-100 text-cyan-700"
    }

    if (normalized?.includes("supermarket")) {
        return "border border-emerald-200 bg-emerald-100 text-emerald-700"
    }

    return "border border-slate-200 bg-slate-100 text-slate-700"
}

const StaffCard = ({ item }: { item: InternalStaffRow }) => {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                            {item.fullName || "--"}
                        </h3>

                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleClass(
                                item.roleName
                            )}`}
                        >
                            {item.roleName || "--"}
                        </span>

                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                item.status
                            )}`}
                        >
                            {statusMap[item.status] ?? "Không xác định"}
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Mail className="h-4 w-4" />
                                <p className="text-xs font-medium uppercase tracking-wide">
                                    Email
                                </p>
                            </div>
                            <p className="mt-2 break-all text-sm font-medium text-slate-900">
                                {item.email || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Phone className="h-4 w-4" />
                                <p className="text-xs font-medium uppercase tracking-wide">
                                    Số điện thoại
                                </p>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-900">
                                {item.phone || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Briefcase className="h-4 w-4" />
                                <p className="text-xs font-medium uppercase tracking-wide">
                                    Chức vụ
                                </p>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-900">
                                {item.position || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Building2 className="h-4 w-4" />
                                <p className="text-xs font-medium uppercase tracking-wide">
                                    Đơn vị
                                </p>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-900">
                                {item.organizationName || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-500">
                                <ShieldCheck className="h-4 w-4" />
                                <p className="text-xs font-medium uppercase tracking-wide">
                                    Department
                                </p>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-900">
                                {item.department || "--"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-slate-500">
                                <UserCog className="h-4 w-4" />
                                <p className="text-xs font-medium uppercase tracking-wide">
                                    Cập nhật lúc
                                </p>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-900">
                                {formatDateTime(item.updatedAt || item.createdAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const AdminInternalStaff = () => {
    const [items, setItems] = useState<InternalStaffRow[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState("")

    const [search, setSearch] = useState("")
    const [keyword, setKeyword] = useState("")
    const [roleFilter, setRoleFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")

    const [page, setPage] = useState(1)
    const [pageSize] = useState(12)
    const [totalResult, setTotalResult] = useState(0)

    const filteredItems = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase()

        return items.filter((item) => {
            const matchesKeyword =
                !normalizedKeyword ||
                item.fullName?.toLowerCase().includes(normalizedKeyword) ||
                item.email?.toLowerCase().includes(normalizedKeyword) ||
                item.phone?.toLowerCase().includes(normalizedKeyword) ||
                item.roleName?.toLowerCase().includes(normalizedKeyword) ||
                item.organizationName?.toLowerCase().includes(normalizedKeyword) ||
                item.position?.toLowerCase().includes(normalizedKeyword)

            const matchesRole =
                !roleFilter ||
                item.roleName?.toLowerCase() === roleFilter.toLowerCase()

            const matchesStatus =
                !statusFilter || String(item.status) === statusFilter

            return Boolean(matchesKeyword && matchesRole && matchesStatus)
        })
    }, [items, keyword, roleFilter, statusFilter])

    const totalPages = useMemo(() => {
        const total = Math.ceil(totalResult / pageSize)
        return total > 0 ? total : 1
    }, [pageSize, totalResult])

    const activeCount = useMemo(() => {
        return filteredItems.filter((item) => item.status === 1).length
    }, [filteredItems])

    const pendingCount = useMemo(() => {
        return filteredItems.filter((item) => item.status === 0).length
    }, [filteredItems])

    const roleOptions = useMemo(() => {
        const uniqueRoles = Array.from(
            new Set(items.map((item) => item.roleName).filter(Boolean))
        ) as string[]

        return uniqueRoles.sort((a, b) => a.localeCompare(b))
    }, [items])

    const loadInternalStaff = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const response = await adminService.getInternalStaffRows({
                pageNumber: page,
                pageSize,
                keyword: keyword || undefined,
            })

            setItems(response.items ?? [])
            setTotalResult(response.totalResult ?? 0)
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                "Không thể tải danh sách nhân sự nội bộ."
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        void loadInternalStaff()
    }, [page, keyword])

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setPage(1)
        setKeyword(search.trim())
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Admin Internal Staff
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Theo dõi danh sách nhân sự nội bộ và trạng thái hoạt động trong hệ thống.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadInternalStaff(true)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Làm mới
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Nhân sự hiển thị</p>
                            <h3 className="mt-2 text-2xl font-bold text-slate-900">
                                {filteredItems.length}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                Số nhân sự sau khi lọc
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-100 p-3">
                            <Users className="h-5 w-5 text-slate-700" />
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Đang hoạt động</p>
                            <h3 className="mt-2 text-2xl font-bold text-emerald-700">
                                {activeCount}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                Status = active
                            </p>
                        </div>

                        <div className="rounded-2xl bg-emerald-50 p-3">
                            <ShieldCheck className="h-5 w-5 text-emerald-700" />
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Chờ duyệt</p>
                            <h3 className="mt-2 text-2xl font-bold text-amber-700">
                                {pendingCount}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                Status = pending
                            </p>
                        </div>

                        <div className="rounded-2xl bg-amber-50 p-3">
                            <UserCog className="h-5 w-5 text-amber-700" />
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Tổng số trang</p>
                            <h3 className="mt-2 text-2xl font-bold text-slate-900">
                                {totalPages}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                Theo phân trang API
                            </p>
                        </div>

                        <div className="rounded-2xl bg-sky-50 p-3">
                            <Briefcase className="h-5 w-5 text-sky-700" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <form
                    onSubmit={handleSearch}
                    className="grid grid-cols-1 gap-3 xl:grid-cols-4"
                >
                    <div className="relative xl:col-span-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên, email, số điện thoại, vai trò..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    >
                        <option value="">Tất cả vai trò</option>
                        {roleOptions.map((role) => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>

                    <div className="flex gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="0">Chờ duyệt</option>
                            <option value="1">Đang hoạt động</option>
                            <option value="2">Từ chối / Khóa</option>
                        </select>

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Tìm
                        </button>
                    </div>
                </form>
            </div>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
                        />
                    ))}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                        <Users className="h-7 w-7 text-slate-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                        Không có nhân sự phù hợp
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Chưa tìm thấy nhân sự nào khớp với bộ lọc hiện tại.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4">
                        {filteredItems.map((item) => (
                            <StaffCard key={item.id} item={item} />
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Hiển thị{" "}
                            <span className="font-semibold text-slate-900">
                                {filteredItems.length}
                            </span>{" "}
                            /{" "}
                            <span className="font-semibold text-slate-900">
                                {totalResult}
                            </span>{" "}
                            nhân sự
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={page === 1}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Trước
                            </button>

                            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                                {page} / {totalPages}
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setPage((prev) => Math.min(totalPages, prev + 1))
                                }
                                disabled={page >= totalPages}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default AdminInternalStaff
