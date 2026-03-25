import { useEffect, useMemo, useState } from "react"
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    Copy,
    MapPin,
    MapPinned,
    RefreshCcw,
    Search,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type { AdminSupermarketItem } from "@/types/admin.type"

const formatCompactNumber = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value)
}

const formatDate = (value?: string) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date)
}

type SortOption =
    | "name-asc"
    | "name-desc"
    | "status-pending-first"
    | "status-active-first"
    | "created-desc"
    | "created-asc"

type StatusFilter = "all" | "pending" | "active" | "suspended" | "closed"

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
    const [sortBy, setSortBy] = useState<SortOption>("created-desc")
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
    const [copiedCode, setCopiedCode] = useState<string>("")

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(totalResult / pageSize))
    }, [totalResult, pageSize])

    const getErrorMessage = (err: unknown) => {
        const error = err as
            | {
                response?: {
                    data?: {
                        message?: string
                        errors?: string[]
                        error?: string[]
                    }
                }
                message?: string
            }
            | undefined

        return (
            error?.response?.data?.message ||
            error?.response?.data?.errors?.[0] ||
            error?.response?.data?.error?.[0] ||
            error?.message ||
            "Không thể tải danh sách siêu thị."
        )
    }

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
        } catch (err) {
            setError(getErrorMessage(err))
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

    const handleSearch = () => {
        setKeyword(search.trim())
        setPage(1)
    }

    const getSupermarketCode = (item: AdminSupermarketItem) => {
        return item.supermarketId || "--"
    }

    const getPhone = (item: AdminSupermarketItem) => {
        return item.contactPhone || "--"
    }

    const hasCoordinates = (item: AdminSupermarketItem) => {
        return Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    }

    const getProfileScore = (item: AdminSupermarketItem) => {
        let score = 0
        if (item.name?.trim()) score += 1
        if (item.address?.trim()) score += 1
        if (item.contactPhone?.trim()) score += 1
        if (hasCoordinates(item)) score += 1
        return score
    }

    const getMissingFields = (item: AdminSupermarketItem) => {
        const missing: string[] = []

        if (!item.name?.trim()) missing.push("Tên siêu thị")
        if (!item.address?.trim()) missing.push("Địa chỉ")
        if (!item.contactPhone?.trim()) missing.push("Số điện thoại")
        if (!hasCoordinates(item)) missing.push("Tọa độ")

        return missing
    }

    const getProfileLabel = (item: AdminSupermarketItem) => {
        const missing = getMissingFields(item)

        if (missing.length === 0) return "Đầy đủ"
        return "Cần bổ sung"
    }

    const getProfileClass = (item: AdminSupermarketItem) => {
        const score = getProfileScore(item)

        if (score >= 4) {
            return "border border-emerald-200 bg-emerald-50 text-emerald-700"
        }

        if (score >= 2) {
            return "border border-amber-200 bg-amber-50 text-amber-700"
        }

        return "border border-rose-200 bg-rose-50 text-rose-700"
    }

    const getStatusLabel = (status?: number) => {
        switch (status) {
            case 0:
                return "Chờ duyệt"
            case 1:
                return "Đang hoạt động"
            case 2:
                return "Tạm ngưng"
            case 3:
                return "Đã đóng"
            default:
                return "Không xác định"
        }
    }

    const getStatusClass = (status?: number) => {
        switch (status) {
            case 0:
                return "border border-amber-200 bg-amber-50 text-amber-700"
            case 1:
                return "border border-emerald-200 bg-emerald-50 text-emerald-700"
            case 2:
                return "border border-violet-200 bg-violet-50 text-violet-700"
            case 3:
                return "border border-rose-200 bg-rose-50 text-rose-700"
            default:
                return "border border-slate-200 bg-slate-50 text-slate-700"
        }
    }

    const matchesStatusFilter = (item: AdminSupermarketItem) => {
        switch (statusFilter) {
            case "pending":
                return item.status === 0
            case "active":
                return item.status === 1
            case "suspended":
                return item.status === 2
            case "closed":
                return item.status === 3
            case "all":
            default:
                return true
        }
    }

    const displaySupermarkets = useMemo(() => {
        const normalized = keyword.trim().toLowerCase()

        const filtered = supermarkets
            .filter((item) => matchesStatusFilter(item))
            .filter((item) => {
                if (!normalized) return true

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
                    (b.name || "").localeCompare(a.name || "", "vi", {
                        sensitivity: "base",
                    })
                )

            case "status-pending-first":
                return list.sort((a, b) => {
                    const aValue = a.status === 0 ? 0 : 1
                    const bValue = b.status === 0 ? 0 : 1

                    if (aValue !== bValue) return aValue - bValue

                    return (a.name || "").localeCompare(b.name || "", "vi", {
                        sensitivity: "base",
                    })
                })

            case "status-active-first":
                return list.sort((a, b) => {
                    const aValue = a.status === 1 ? 0 : 1
                    const bValue = b.status === 1 ? 0 : 1

                    if (aValue !== bValue) return aValue - bValue

                    return (a.name || "").localeCompare(b.name || "", "vi", {
                        sensitivity: "base",
                    })
                })

            case "created-asc":
                return list.sort(
                    (a, b) =>
                        new Date(a.createdAt || 0).getTime() -
                        new Date(b.createdAt || 0).getTime()
                )

            case "name-asc":
                return list.sort((a, b) =>
                    (a.name || "").localeCompare(b.name || "", "vi", {
                        sensitivity: "base",
                    })
                )

            case "created-desc":
            default:
                return list.sort(
                    (a, b) =>
                        new Date(b.createdAt || 0).getTime() -
                        new Date(a.createdAt || 0).getTime()
                )
        }
    }, [supermarkets, keyword, sortBy, statusFilter])

    const currentPageStats = useMemo(() => {
        return supermarkets.reduce(
            (acc, item) => {
                if (item.status === 0) acc.pending += 1
                else if (item.status === 1) acc.active += 1
                else if (item.status === 2) acc.suspended += 1
                else if (item.status === 3) acc.closed += 1

                if (!item.contactPhone?.trim()) acc.missingPhone += 1
                if (!hasCoordinates(item)) acc.missingLocation += 1
                if (getProfileScore(item) < 4) acc.incompleteProfile += 1

                return acc
            },
            {
                pending: 0,
                active: 0,
                suspended: 0,
                closed: 0,
                missingPhone: 0,
                missingLocation: 0,
                incompleteProfile: 0,
            }
        )
    }, [supermarkets])

    const handleCopyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code)
            setCopiedCode(code)

            window.setTimeout(() => {
                setCopiedCode((current) => (current === code ? "" : current))
            }, 1500)
        } catch {
            setCopiedCode("")
        }
    }

    const openMap = (item: AdminSupermarketItem) => {
        if (!hasCoordinates(item)) return

        const url = `https://www.google.com/maps?q=${item.latitude},${item.longitude}`
        window.open(url, "_blank", "noopener,noreferrer")
    }

    const statusTabs: Array<{
        key: StatusFilter
        label: string
        count: number
    }> = [
            { key: "all", label: "Tất cả", count: supermarkets.length },
            { key: "pending", label: "Chờ duyệt", count: currentPageStats.pending },
            { key: "active", label: "Đang hoạt động", count: currentPageStats.active },
            { key: "suspended", label: "Tạm ngưng", count: currentPageStats.suspended },
            { key: "closed", label: "Đã đóng", count: currentPageStats.closed },
        ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Quản lý siêu thị
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Theo dõi mạng lưới siêu thị, mức độ hoàn chỉnh hồ sơ và các điểm cần rà soát.
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

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Tổng siêu thị</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {formatCompactNumber(totalResult)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Tổng số bản ghi toàn hệ thống
                    </p>
                </div>

                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                    <p className="text-sm text-emerald-700">Đang hoạt động</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-900">
                        {formatCompactNumber(currentPageStats.active)}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                        Trong dữ liệu của trang hiện tại
                    </p>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <p className="text-sm text-amber-700">Chờ duyệt</p>
                    <p className="mt-2 text-2xl font-bold text-amber-900">
                        {formatCompactNumber(currentPageStats.pending)}
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                        Nên ưu tiên rà soát trước
                    </p>
                </div>

                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
                    <p className="text-sm text-rose-700">Cần chú ý</p>
                    <p className="mt-2 text-2xl font-bold text-rose-900">
                        {formatCompactNumber(
                            currentPageStats.incompleteProfile +
                            currentPageStats.missingLocation +
                            currentPageStats.missingPhone
                        )}
                    </p>
                    <p className="mt-1 text-xs text-rose-700">
                        Hồ sơ thiếu, thiếu liên hệ hoặc thiếu tọa độ
                    </p>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-300"
                    >
                        <option value="created-desc">Mới tạo gần đây</option>
                        <option value="created-asc">Tạo lâu hơn</option>
                        <option value="name-asc">Tên A-Z</option>
                        <option value="name-desc">Tên Z-A</option>
                        <option value="status-pending-first">Ưu tiên chờ duyệt</option>
                        <option value="status-active-first">Ưu tiên đang hoạt động</option>
                    </select>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {statusTabs.map((tab) => {
                        const active = statusFilter === tab.key

                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setStatusFilter(tab.key)}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${active
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs ${active
                                        ? "bg-white/15 text-white"
                                        : "bg-slate-100 text-slate-600"
                                        }`}
                                >
                                    {formatCompactNumber(tab.count)}
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
                            <div>
                                <p className="text-sm font-semibold text-amber-900">
                                    Hồ sơ cần rà soát
                                </p>
                                <p className="mt-1 text-sm text-amber-700">
                                    {formatCompactNumber(currentPageStats.incompleteProfile)} siêu thị
                                    chưa đủ thông tin hồ sơ trên trang hiện tại.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                            <MapPinned className="mt-0.5 h-4 w-4 text-violet-700" />
                            <div>
                                <p className="text-sm font-semibold text-violet-900">
                                    Thiếu tọa độ
                                </p>
                                <p className="mt-1 text-sm text-violet-700">
                                    {formatCompactNumber(currentPageStats.missingLocation)} siêu thị
                                    chưa có định vị để tra cứu nhanh trên bản đồ.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                            <Building2 className="mt-0.5 h-4 w-4 text-rose-700" />
                            <div>
                                <p className="text-sm font-semibold text-rose-900">
                                    Thiếu liên hệ
                                </p>
                                <p className="mt-1 text-sm text-rose-700">
                                    {formatCompactNumber(currentPageStats.missingPhone)} siêu thị
                                    chưa có số điện thoại để đối chiếu nhanh.
                                </p>
                            </div>
                        </div>
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
                                <th className="px-5 py-4">Hồ sơ</th>
                                <th className="px-5 py-4">Ngày tạo</th>
                                <th className="px-5 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-5 py-10 text-center text-sm text-slate-500"
                                    >
                                        Đang tải danh sách siêu thị...
                                    </td>
                                </tr>
                            ) : displaySupermarkets.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-5 py-10 text-center text-sm text-slate-500"
                                    >
                                        Không có siêu thị nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                displaySupermarkets.map((item, index) => {
                                    const code = getSupermarketCode(item)

                                    return (
                                        <tr
                                            key={`${code}-${index}`}
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

                                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                                            <span className="text-xs text-slate-500">
                                                                Mã: {code}
                                                            </span>

                                                            {copiedCode === code ? (
                                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                                                    Đã sao chép
                                                                </span>
                                                            ) : null}
                                                        </div>

                                                        <p className="mt-1 text-xs text-slate-400">
                                                            Tạo ngày {formatDate(item.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="space-y-2">
                                                    <p className="text-sm text-slate-900">
                                                        {getPhone(item)}
                                                    </p>

                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.contactPhone?.trim()
                                                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                                            : "border border-rose-200 bg-rose-50 text-rose-700"
                                                            }`}
                                                    >
                                                        {item.contactPhone?.trim()
                                                            ? "Có liên hệ"
                                                            : "Thiếu liên hệ"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                                                        <p className="text-sm text-slate-700">
                                                            {item.address || "--"}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${hasCoordinates(item)
                                                            ? "border border-violet-200 bg-violet-50 text-violet-700"
                                                            : "border border-slate-200 bg-slate-50 text-slate-700"
                                                            }`}
                                                    >
                                                        {hasCoordinates(item)
                                                            ? "Có định vị"
                                                            : "Thiếu tọa độ"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getStatusClass(item.status)}`}
                                                >
                                                    {getStatusLabel(item.status)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                {(() => {
                                                    const missingFields = getMissingFields(item)
                                                    const isComplete = missingFields.length === 0

                                                    return (
                                                        <div className="group relative inline-flex">
                                                            <span
                                                                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getProfileClass(item)}`}
                                                            >
                                                                {getProfileLabel(item)}
                                                            </span>

                                                            {!isComplete ? (
                                                                <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-max max-w-[260px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-slate-900 px-3 py-2 text-xs text-white shadow-xl group-hover:block">
                                                                    <p className="font-semibold">Thông tin còn thiếu</p>
                                                                    <ul className="mt-1 list-disc pl-4 text-slate-200">
                                                                        {missingFields.map((field) => (
                                                                            <li key={field}>{field}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    )
                                                })()}
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="text-sm text-slate-700">
                                                    {formatDate(item.createdAt)}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyCode(code)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                        Sao chép mã
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => openMap(item)}
                                                        disabled={!hasCoordinates(item)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Mở bản đồ
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                        Hiển thị {formatCompactNumber(displaySupermarkets.length)} /{" "}
                        {formatCompactNumber(supermarkets.length)} siêu thị của trang hiện tại
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
