import { useEffect, useMemo, useState } from "react"
import { Building2, MapPin, RefreshCcw, Search } from "lucide-react"

import { adminService } from "@/services/admin.service"
import type { AdminSupermarketItem } from "@/types/admin.type"

const formatCompactNumber = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value)
}

const AdminSupermarkets = () => {
    const [supermarkets, setSupermarkets] = useState<AdminSupermarketItem[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState("")

    const [search, setSearch] = useState("")
    const [keyword, setKeyword] = useState("")
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalResult, setTotalResult] = useState(0)

    const [sortBy, setSortBy] = useState<
        "name-asc" | "name-desc" | "status-active-first" | "status-inactive-first" | "created-desc" | "created-asc"
    >("name-asc")

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(totalResult / pageSize))
    }, [totalResult, pageSize])

    const loadSupermarkets = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const data = await adminService.getSupermarkets({
                pageNumber: page,
                pageSize,
            })

            setSupermarkets(data?.items ?? [])
            setTotalResult(data?.totalResult ?? 0)
        } catch (err: any) {
            setError(
                err?.response?.data?.message || "Không thể tải danh sách siêu thị."
            )
            setSupermarkets([])
            setTotalResult(0)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        void loadSupermarkets()
    }, [page])

    const displaySupermarkets = useMemo(() => {
        const normalized = keyword.trim().toLowerCase()

        const filtered = !normalized
            ? supermarkets
            : supermarkets.filter((item) => {
                const target = [
                    item.name,
                    item.address,
                    item.contactPhone,
                    item.supermarketId,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()

                return target.includes(normalized)
            })

        const list = [...filtered]

        switch (sortBy) {
            case "name-desc":
                return list.sort((a, b) =>
                    (b.name || "").localeCompare(a.name || "", "vi", { sensitivity: "base" })
                )

            case "status-active-first":
                return list.sort((a, b) => {
                    const aValue = isActive(a) ? 0 : 1
                    const bValue = isActive(b) ? 0 : 1
                    return aValue - bValue
                })

            case "status-inactive-first":
                return list.sort((a, b) => {
                    const aValue = isActive(a) ? 1 : 0
                    const bValue = isActive(b) ? 1 : 0
                    return aValue - bValue
                })

            case "created-desc":
                return list.sort(
                    (a, b) =>
                        new Date(b.createdAt || 0).getTime() -
                        new Date(a.createdAt || 0).getTime()
                )

            case "created-asc":
                return list.sort(
                    (a, b) =>
                        new Date(a.createdAt || 0).getTime() -
                        new Date(b.createdAt || 0).getTime()
                )

            case "name-asc":
            default:
                return list.sort((a, b) =>
                    (a.name || "").localeCompare(b.name || "", "vi", { sensitivity: "base" })
                )
        }
    }, [supermarkets, keyword, sortBy])

    const handleSearch = () => {
        setKeyword(search)
        setPage(1)
    }

    const getSupermarketCode = (item: AdminSupermarketItem) => {
        return item.supermarketId || "--"
    }

    const getPhone = (item: AdminSupermarketItem) => {
        return item.contactPhone || "--"
    }

    const isActive = (item: AdminSupermarketItem) => item.status === 2

    const getStatusLabel = (item: AdminSupermarketItem) => {
        return isActive(item) ? "Đang hoạt động" : "Ngưng hoạt động"
    }

    const getStatusClass = (item: AdminSupermarketItem) => {
        return isActive(item)
            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border border-rose-200 bg-rose-50 text-rose-700"
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Quản lý siêu thị
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Theo dõi danh sách siêu thị, thông tin liên hệ và trạng thái hoạt động.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadSupermarkets(true)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Làm mới
                </button>
            </div>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-sm text-slate-500">Tổng siêu thị</p>
                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {formatCompactNumber(totalResult)}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-sm text-slate-500">Đang hiển thị</p>
                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {formatCompactNumber(displaySupermarkets.length)}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-sm text-slate-500">Trang hiện tại</p>
                            <p className="mt-1 text-xl font-bold text-slate-900">
                                {page}/{totalPages}
                            </p>
                        </div>
                    </div>

                    <div className="flex w-full max-w-4xl gap-3">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSearch()
                                }}
                                placeholder="Tìm theo tên, số điện thoại, địa chỉ, mã siêu thị..."
                                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-300"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleSearch}
                            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Tìm kiếm
                        </button>

                        <select
                            value={sortBy}
                            onChange={(e) =>
                                setSortBy(
                                    e.target.value as
                                    | "name-asc"
                                    | "name-desc"
                                    | "status-active-first"
                                    | "status-inactive-first"
                                    | "created-desc"
                                    | "created-asc"
                                )
                            }
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-300"
                        >
                            <option value="name-asc">Tên A-Z</option>
                            <option value="name-desc">Tên Z-A</option>
                            <option value="status-active-first">Ưu tiên đang hoạt động</option>
                            <option value="status-inactive-first">Ưu tiên ngưng hoạt động</option>
                            <option value="created-desc">Mới tạo gần đây</option>
                            <option value="created-asc">Tạo lâu hơn</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                <th className="px-5 py-4">Siêu thị</th>
                                <th className="px-5 py-4">Liên hệ</th>
                                <th className="px-5 py-4">Địa chỉ</th>
                                <th className="px-5 py-4">Trạng thái</th>
                                <th className="px-5 py-4">Ngày tạo</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-5 py-10 text-center text-sm text-slate-500"
                                    >
                                        Đang tải danh sách siêu thị...
                                    </td>
                                </tr>
                            ) : displaySupermarkets.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-5 py-10 text-center text-sm text-slate-500"
                                    >
                                        Không có siêu thị nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                displaySupermarkets.map((item, index) => (
                                    <tr
                                        key={`${getSupermarketCode(item)}-${index}`}
                                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                                                    <Building2 className="h-5 w-5 text-slate-600" />
                                                </div>

                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {item.name || "--"}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Mã: {getSupermarketCode(item)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="text-sm text-slate-900">
                                                {getPhone(item)}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                                                <p className="text-sm text-slate-700">
                                                    {item.address || "--"}
                                                </p>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusClass(item)}`}
                                            >
                                                {getStatusLabel(item)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <p className="text-sm text-slate-700">
                                                {item.createdAt
                                                    ? new Intl.DateTimeFormat("vi-VN", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                    }).format(new Date(item.createdAt))
                                                    : "--"}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                        Tổng cộng {formatCompactNumber(totalResult)} siêu thị
                    </p>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            disabled={page === 1}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Trang trước
                        </button>

                        <span className="text-sm font-medium text-slate-600">
                            {page}/{totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={page >= totalPages}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Trang sau
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminSupermarkets
