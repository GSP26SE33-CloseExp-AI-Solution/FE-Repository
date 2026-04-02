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
    ShieldCheck,
    Store,
    UserRound,
    XCircle,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type {
    AdminOrder,
    AdminSupermarketItem,
    PendingSupermarketApplication,
} from "@/types/admin.type"

const cn = (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" ")

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

const formatDateTime = (value?: string) => {
    if (!value) return "--"

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
type ViewTab = "applications" | "supermarkets"

const AdminSupermarkets = () => {
    const [tab, setTab] = useState<ViewTab>("applications")

    const [supermarkets, setSupermarkets] = useState<AdminSupermarketItem[]>([])
    const [applications, setApplications] = useState<PendingSupermarketApplication[]>([])

    const [loadingSupermarkets, setLoadingSupermarkets] = useState(true)
    const [loadingApplications, setLoadingApplications] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState("")

    const [search, setSearch] = useState("")
    const [keyword, setKeyword] = useState("")
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalResult, setTotalResult] = useState(0)
    const [sortBy, setSortBy] = useState<SortOption>("created-desc")
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
    const [copiedCode, setCopiedCode] = useState("")

    const [checkingOrdersId, setCheckingOrdersId] = useState("")
    const [approvingId, setApprovingId] = useState("")
    const [rejectingId, setRejectingId] = useState("")
    const [openRejectId, setOpenRejectId] = useState("")
    const [rejectNote, setRejectNote] = useState("")

    const [blockingOrdersMap, setBlockingOrdersMap] = useState<Record<string, AdminOrder[]>>({})

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(totalResult / pageSize))
    }, [totalResult, pageSize])

    const getErrorMessage = (err: unknown, fallback: string) => {
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
            fallback
        )
    }

    function hasCoordinates(item: AdminSupermarketItem) {
        return Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    }

    function getProfileScore(item: AdminSupermarketItem) {
        let score = 0
        if (item.name?.trim()) score += 1
        if (item.address?.trim()) score += 1
        if (item.contactPhone?.trim()) score += 1
        if (hasCoordinates(item)) score += 1
        return score
    }

    function getMissingFields(item: AdminSupermarketItem) {
        const missing: string[] = []

        if (!item.name?.trim()) missing.push("Tên siêu thị")
        if (!item.address?.trim()) missing.push("Địa chỉ")
        if (!item.contactPhone?.trim()) missing.push("Số điện thoại")
        if (!hasCoordinates(item)) missing.push("Tọa độ")

        return missing
    }

    function getProfileLabel(item: AdminSupermarketItem) {
        const missing = getMissingFields(item)
        if (missing.length === 0) return "Hoàn chỉnh"
        return "Cần bổ sung"
    }

    function getProfileClass(item: AdminSupermarketItem) {
        const score = getProfileScore(item)

        if (score >= 4) {
            return "border-emerald-200 bg-emerald-50 text-emerald-700"
        }

        if (score >= 2) {
            return "border-amber-200 bg-amber-50 text-amber-700"
        }

        return "border-rose-200 bg-rose-50 text-rose-700"
    }

    function getStatusLabel(status?: number) {
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

    function getStatusClass(status?: number) {
        switch (status) {
            case 0:
                return "border-amber-200 bg-amber-50 text-amber-700"
            case 1:
                return "border-emerald-200 bg-emerald-50 text-emerald-700"
            case 2:
                return "border-violet-200 bg-violet-50 text-violet-700"
            case 3:
                return "border-rose-200 bg-rose-50 text-rose-700"
            default:
                return "border-slate-200 bg-slate-50 text-slate-700"
        }
    }

    async function loadSupermarkets(isRefresh = false) {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoadingSupermarkets(true)

            const data = await adminService.getSupermarkets({
                pageNumber: page,
                pageSize,
            })

            setSupermarkets(data?.items ?? [])
            setTotalResult(data?.totalResult ?? 0)
        } catch (err) {
            console.error("AdminSupermarkets.loadSupermarkets -> error:", err)
            setError(getErrorMessage(err, "Chưa thể tải danh sách siêu thị lúc này."))
            setSupermarkets([])
            setTotalResult(0)
        } finally {
            setLoadingSupermarkets(false)
            setRefreshing(false)
        }
    }

    async function loadApplications(isRefresh = false) {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoadingApplications(true)

            const data = await adminService.getPendingSupermarketApplications()
            setApplications(data ?? [])
        } catch (err) {
            console.error("AdminSupermarkets.loadApplications -> error:", err)
            setError(getErrorMessage(err, "Chưa thể tải danh sách hồ sơ đối tác lúc này."))
            setApplications([])
        } finally {
            setLoadingApplications(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        void loadSupermarkets()
    }, [page])

    useEffect(() => {
        void loadApplications()
    }, [])

    const handleRefresh = async () => {
        setError("")
        await Promise.all([loadApplications(true), loadSupermarkets(true)])
    }

    const handleSearch = () => {
        setKeyword(search.trim())
        if (tab === "supermarkets") {
            setPage(1)
        }
    }

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

    const pendingApplicationCount = applications.length

    const applicationSummary = useMemo(() => {
        return applications.reduce(
            (acc, item) => {
                const blockedCount = blockingOrdersMap[item.applicantUserId]?.length ?? 0

                if (blockedCount > 0) acc.blocked += 1
                else acc.ready += 1

                return acc
            },
            {
                ready: 0,
                blocked: 0,
            }
        )
    }, [applications, blockingOrdersMap])

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

                const target = [item.name, item.address, item.contactPhone, item.supermarketId]
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

    const displayApplications = useMemo(() => {
        const normalized = keyword.trim().toLowerCase()

        return [...applications]
            .filter((item) => {
                if (!normalized) return true

                const target = [
                    item.name,
                    item.address,
                    item.contactPhone,
                    item.contactEmail,
                    item.applicationReference,
                    item.applicantEmail,
                    item.applicantFullName,
                    item.applicantUserId,
                    item.supermarketId,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()

                return target.includes(normalized)
            })
            .sort(
                (a, b) =>
                    new Date(b.submittedAt || b.createdAt || 0).getTime() -
                    new Date(a.submittedAt || a.createdAt || 0).getTime()
            )
    }, [applications, keyword])

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

    const handleCopyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code)
            setCopiedCode(code)

            window.setTimeout(() => {
                setCopiedCode((current) => (current === code ? "" : current))
            }, 1500)
        } catch (err) {
            console.error("AdminSupermarkets.handleCopyCode -> error:", err)
            setCopiedCode("")
        }
    }

    const openMap = (item: AdminSupermarketItem | PendingSupermarketApplication) => {
        if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) return

        const url = `https://www.google.com/maps?q=${item.latitude},${item.longitude}`
        window.open(url, "_blank", "noopener,noreferrer")
    }

    const getBlockingOrders = (userId: string) => {
        return blockingOrdersMap[userId] ?? []
    }

    const handleCheckBlockingOrders = async (application: PendingSupermarketApplication) => {
        try {
            setCheckingOrdersId(application.supermarketId)
            setError("")

            const blockingOrders = await adminService.getBlockingCustomerOrders(
                application.applicantUserId
            )

            setBlockingOrdersMap((prev) => ({
                ...prev,
                [application.applicantUserId]: blockingOrders,
            }))
        } catch (err) {
            console.error("AdminSupermarkets.handleCheckBlockingOrders -> error:", err)
            setError(getErrorMessage(err, "Chưa thể kiểm tra đơn mua của tài khoản này."))
        } finally {
            setCheckingOrdersId("")
        }
    }

    const handleApprove = async (application: PendingSupermarketApplication) => {
        try {
            setApprovingId(application.supermarketId)
            setError("")

            let blockingOrders = getBlockingOrders(application.applicantUserId)

            if (blockingOrders.length === 0) {
                blockingOrders = await adminService.getBlockingCustomerOrders(
                    application.applicantUserId
                )

                setBlockingOrdersMap((prev) => ({
                    ...prev,
                    [application.applicantUserId]: blockingOrders,
                }))
            }

            if (blockingOrders.length > 0) {
                setError(
                    "Tài khoản này vẫn còn đơn mua đang xử lý. Vui lòng hoàn tất hoặc đóng các đơn liên quan trước khi phê duyệt hồ sơ đối tác."
                )
                return
            }

            await adminService.approveSupermarketApplication(application.supermarketId)

            setApplications((prev) =>
                prev.filter((item) => item.supermarketId !== application.supermarketId)
            )

            await loadSupermarkets(true)
        } catch (err) {
            console.error("AdminSupermarkets.handleApprove -> error:", err)
            setError(getErrorMessage(err, "Chưa thể phê duyệt hồ sơ đối tác lúc này."))
        } finally {
            setApprovingId("")
        }
    }

    const handleOpenReject = (application: PendingSupermarketApplication) => {
        setOpenRejectId(application.supermarketId)
        setRejectNote("")
    }

    const handleCloseReject = () => {
        setOpenRejectId("")
        setRejectNote("")
    }

    const handleReject = async (application: PendingSupermarketApplication) => {
        const note = rejectNote.trim()

        if (!note) {
            setError("Vui lòng nhập lý do từ chối để người nộp hồ sơ dễ theo dõi.")
            return
        }

        try {
            setRejectingId(application.supermarketId)
            setError("")

            await adminService.rejectSupermarketApplication(application.supermarketId, {
                adminReviewNote: note,
            })

            setApplications((prev) =>
                prev.filter((item) => item.supermarketId !== application.supermarketId)
            )

            handleCloseReject()
        } catch (err) {
            console.error("AdminSupermarkets.handleReject -> error:", err)
            setError(getErrorMessage(err, "Chưa thể từ chối hồ sơ đối tác lúc này."))
        } finally {
            setRejectingId("")
        }
    }

    const statCards = [
        {
            label: "Hồ sơ chờ xem xét",
            value: pendingApplicationCount,
            hint: "Các hồ sơ đang đợi quyết định",
            tone: "slate",
        },
        {
            label: "Có thể phê duyệt",
            value: applicationSummary.ready,
            hint: "Chưa phát hiện đơn mua đang mở",
            tone: "emerald",
        },
        {
            label: "Cần xử lý trước",
            value: applicationSummary.blocked,
            hint: "Đang còn đơn mua cần hoàn tất",
            tone: "amber",
        },
        {
            label: "Tổng siêu thị hệ thống",
            value: totalResult,
            hint: "Số lượng bản ghi hiện có",
            tone: "violet",
        },
    ] as const

    return (
        <div className="space-y-6">

            {/* BANNER */}

            <section className="rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_-32px_rgba(15,23,42,0.18)]">
                <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-slate-600">
                            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                            QUẢN LÝ ĐỐI TÁC SIÊU THỊ
                        </div>

                        <h1 className="mt-3 text-xl font-bold leading-tight text-slate-900 lg:text-[26px]">
                            Hồ sơ đối tác và mạng lưới siêu thị
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                            Theo dõi hồ sơ đăng ký mới, kiểm tra điều kiện trước khi phê duyệt
                            và giữ danh sách siêu thị trong một không gian gọn gàng, rõ ràng.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => void handleRefresh()}
                            disabled={refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                            Làm mới dữ liệu
                        </button>

                        <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
                            Ưu tiên kiểm tra hồ sơ còn đơn mua đang mở
                        </div>
                    </div>
                </div>
            </section>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] lg:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setTab("applications")}
                            className={cn(
                                "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                                tab === "applications"
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            <ShieldCheck className="h-4 w-4" />
                            Hồ sơ đối tác
                            <span
                                className={cn(
                                    "rounded-full px-2 py-0.5 text-xs",
                                    tab === "applications"
                                        ? "bg-white/15 text-white"
                                        : "bg-slate-100 text-slate-600"
                                )}
                            >
                                {formatCompactNumber(pendingApplicationCount)}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setTab("supermarkets")}
                            className={cn(
                                "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                                tab === "supermarkets"
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            <Store className="h-4 w-4" />
                            Mạng lưới siêu thị
                            <span
                                className={cn(
                                    "rounded-full px-2 py-0.5 text-xs",
                                    tab === "supermarkets"
                                        ? "bg-white/15 text-white"
                                        : "bg-slate-100 text-slate-600"
                                )}
                            >
                                {formatCompactNumber(totalResult)}
                            </span>
                        </button>
                    </div>

                    <div className="flex w-full flex-col gap-3 xl:max-w-3xl xl:flex-row">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSearch()
                                }}
                                placeholder={
                                    tab === "applications"
                                        ? "Tìm theo tên siêu thị, người nộp hồ sơ, email hoặc mã hồ sơ..."
                                        : "Tìm theo tên siêu thị, địa chỉ, số điện thoại hoặc mã..."
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleSearch}
                            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Tìm kiếm
                        </button>

                        {tab === "supermarkets" ? (
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-300"
                            >
                                <option value="created-desc">Mới tạo gần đây</option>
                                <option value="created-asc">Tạo lâu hơn</option>
                                <option value="name-asc">Tên A-Z</option>
                                <option value="name-desc">Tên Z-A</option>
                                <option value="status-pending-first">Ưu tiên chờ duyệt</option>
                                <option value="status-active-first">Ưu tiên đang hoạt động</option>
                            </select>
                        ) : null}
                    </div>
                </div>

                <div className="mt-5">
                    {tab === "applications" ? (
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start gap-3">
                                    <UserRound className="mt-0.5 h-4 w-4 text-slate-700" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Duyệt đúng vai trò
                                        </p>
                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                            Sau khi được phê duyệt, tài khoản này sẽ chuyển sang vai trò
                                            đối tác siêu thị và không tiếp tục mua hàng bằng luồng khách hàng.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-900">
                                            Kiểm tra trước khi quyết định
                                        </p>
                                        <p className="mt-1 text-sm leading-6 text-amber-700">
                                            Nên kiểm tra đơn mua đang mở trước khi phê duyệt để tránh
                                            phát sinh chồng vai trò trong quá trình xử lý đơn.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-700" />
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-900">
                                            Luồng xét duyệt riêng
                                        </p>
                                        <p className="mt-1 text-sm leading-6 text-emerald-700">
                                            Mọi thao tác tại đây áp dụng cho hồ sơ đăng ký đối tác, không
                                            dùng chung với luồng xét duyệt tài khoản thông thường.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {statusTabs.map((tabItem) => {
                                const active = statusFilter === tabItem.key

                                return (
                                    <button
                                        key={tabItem.key}
                                        type="button"
                                        onClick={() => setStatusFilter(tabItem.key)}
                                        className={cn(
                                            "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition",
                                            active
                                                ? "bg-slate-900 text-white"
                                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                        )}
                                    >
                                        <span>{tabItem.label}</span>
                                        <span
                                            className={cn(
                                                "rounded-full px-2 py-0.5 text-xs",
                                                active
                                                    ? "bg-white/15 text-white"
                                                    : "bg-slate-100 text-slate-600"
                                            )}
                                        >
                                            {formatCompactNumber(tabItem.count)}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section>

            {tab === "applications" ? (
                <section className="space-y-4">
                    {loadingApplications ? (
                        <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
                            Đang tải danh sách hồ sơ đối tác...
                        </div>
                    ) : displayApplications.length === 0 ? (
                        <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
                            Hiện chưa có hồ sơ đối tác phù hợp với bộ lọc đang chọn.
                        </div>
                    ) : (
                        displayApplications.map((item) => {
                            const blockingOrders = getBlockingOrders(item.applicantUserId)
                            const blocked = blockingOrders.length > 0
                            const isChecking = checkingOrdersId === item.supermarketId
                            const isApproving = approvingId === item.supermarketId
                            const isRejecting = rejectingId === item.supermarketId
                            const isRejectPanelOpen = openRejectId === item.supermarketId

                            return (
                                <article
                                    key={item.supermarketId}
                                    className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]"
                                >
                                    <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-white px-5 py-5 lg:px-6">
                                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                                                    <Building2 className="h-5 w-5 text-slate-700" />
                                                </div>

                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h2 className="text-lg font-semibold text-slate-900">
                                                            {item.name || "--"}
                                                        </h2>

                                                        <span
                                                            className={cn(
                                                                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                                                                blocked
                                                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                                                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                            )}
                                                        >
                                                            {blocked
                                                                ? "Cần xử lý đơn mua trước"
                                                                : "Sẵn sàng xem xét phê duyệt"}
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                                                            Mã hồ sơ: {item.applicationReference || "--"}
                                                        </span>
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                                                            Mã siêu thị: {item.supermarketId || "--"}
                                                        </span>
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                                                            Gửi lúc:{" "}
                                                            {formatDateTime(item.submittedAt || item.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 xl:justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCopyCode(
                                                            item.applicationReference || item.supermarketId
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                    {copiedCode ===
                                                        (item.applicationReference || item.supermarketId)
                                                        ? "Đã sao chép"
                                                        : "Sao chép mã"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => openMap(item)}
                                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    <MapPinned className="h-4 w-4" />
                                                    Xem vị trí
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1.2fr_0.8fr] lg:p-6">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                                        Người nộp hồ sơ
                                                    </p>
                                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                                        {item.applicantFullName || "--"}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-700">
                                                        {item.applicantEmail || "--"}
                                                    </p>
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Mã tài khoản: {item.applicantUserId || "--"}
                                                    </p>
                                                </div>

                                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                                        Liên hệ đại diện
                                                    </p>
                                                    <p className="mt-2 text-sm font-semibold text-slate-900">
                                                        {item.contactPhone || "--"}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-700">
                                                        {item.contactEmail || "--"}
                                                    </p>
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Sẵn sàng cho bước đối chiếu hồ sơ
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                                <div className="flex items-start gap-3">
                                                    <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                                            Địa chỉ siêu thị
                                                        </p>
                                                        <p className="mt-2 text-sm leading-6 text-slate-700">
                                                            {item.address || "--"}
                                                        </p>
                                                        <p className="mt-2 text-xs text-slate-500">
                                                            Tọa độ: {item.latitude}, {item.longitude}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {blocked ? (
                                                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                                                    <p className="text-sm font-semibold text-amber-900">
                                                        Cần hoàn tất đơn mua trước khi phê duyệt
                                                    </p>
                                                    <p className="mt-1 text-sm leading-6 text-amber-700">
                                                        Tài khoản này hiện còn{" "}
                                                        {formatCompactNumber(blockingOrders.length)} đơn mua
                                                        chưa hoàn tất. Nên xử lý xong trước khi chuyển vai trò.
                                                    </p>

                                                    <div className="mt-3 grid grid-cols-1 gap-2">
                                                        {blockingOrders.slice(0, 5).map((order) => (
                                                            <div
                                                                key={order.orderId}
                                                                className="rounded-2xl border border-amber-200 bg-white px-4 py-3"
                                                            >
                                                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                                    <p className="text-sm font-semibold text-slate-900">
                                                                        {order.orderCode || order.orderId}
                                                                    </p>
                                                                    <p className="text-xs font-medium text-amber-700">
                                                                        {order.status || "--"}
                                                                    </p>
                                                                </div>
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {formatDateTime(
                                                                        order.orderDate || order.createdAt
                                                                    )}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {isRejectPanelOpen ? (
                                                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
                                                    <p className="text-sm font-semibold text-rose-900">
                                                        Ghi rõ lý do để người nộp hồ sơ dễ theo dõi
                                                    </p>

                                                    <textarea
                                                        value={rejectNote}
                                                        onChange={(e) => setRejectNote(e.target.value)}
                                                        rows={4}
                                                        placeholder="Ví dụ: Hồ sơ liên hệ chưa đầy đủ, cần bổ sung thông tin pháp lý hoặc xác minh lại địa chỉ..."
                                                        className="mt-3 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-rose-300"
                                                    />

                                                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={handleCloseReject}
                                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            Đóng lại
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleReject(item)}
                                                            disabled={isRejecting}
                                                            className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {isRejecting ? "Đang xử lý..." : "Xác nhận từ chối"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>

                                        <aside className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4 lg:p-5">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                                    Hành động đề xuất
                                                </p>
                                                <h3 className="mt-2 text-base font-semibold text-slate-900">
                                                    Ra quyết định cho hồ sơ này
                                                </h3>
                                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                                    Kiểm tra điều kiện, sau đó chọn phê duyệt hoặc từ chối
                                                    với lý do rõ ràng.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => void handleCheckBlockingOrders(item)}
                                                    disabled={isChecking}
                                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <Search className="h-4 w-4" />
                                                    {isChecking
                                                        ? "Đang kiểm tra đơn mua..."
                                                        : "Kiểm tra đơn mua đang mở"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => void handleApprove(item)}
                                                    disabled={isApproving || blocked}
                                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    {isApproving
                                                        ? "Đang phê duyệt..."
                                                        : "Phê duyệt trở thành đối tác"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenReject(item)}
                                                    disabled={isRejecting}
                                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                    Từ chối hồ sơ
                                                </button>
                                            </div>

                                            <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    Tình trạng rà soát
                                                </p>
                                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                                    {blockingOrdersMap[item.applicantUserId]
                                                        ? blocked
                                                            ? "Đã kiểm tra và phát hiện đơn mua cần hoàn tất trước."
                                                            : "Đã kiểm tra, hiện chưa phát hiện đơn mua đang mở."
                                                        : "Chưa thực hiện kiểm tra đơn mua cho hồ sơ này."}
                                                </p>
                                            </div>
                                        </aside>
                                    </div>
                                </article>
                            )
                        })
                    )}
                </section>
            ) : (
                <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
                    <div className="border-b border-slate-100 px-5 py-4 lg:px-6">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-medium text-slate-500">
                                    Hồ sơ cần bổ sung
                                </p>
                                <p className="mt-1 text-lg font-semibold text-slate-900">
                                    {formatCompactNumber(currentPageStats.incompleteProfile)}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3">
                                <p className="text-xs font-medium text-violet-700">Thiếu tọa độ</p>
                                <p className="mt-1 text-lg font-semibold text-violet-900">
                                    {formatCompactNumber(currentPageStats.missingLocation)}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                                <p className="text-xs font-medium text-rose-700">Thiếu liên hệ</p>
                                <p className="mt-1 text-lg font-semibold text-rose-900">
                                    {formatCompactNumber(currentPageStats.missingPhone)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                    <th className="px-5 py-4">Siêu thị</th>
                                    <th className="px-5 py-4">Liên hệ</th>
                                    <th className="px-5 py-4">Địa chỉ</th>
                                    <th className="px-5 py-4">Trạng thái</th>
                                    <th className="px-5 py-4">Mức hoàn chỉnh</th>
                                    <th className="px-5 py-4">Ngày tạo</th>
                                    <th className="px-5 py-4 text-right">Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loadingSupermarkets ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-12 text-center text-sm text-slate-500"
                                        >
                                            Đang tải danh sách siêu thị...
                                        </td>
                                    </tr>
                                ) : displaySupermarkets.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-12 text-center text-sm text-slate-500"
                                        >
                                            Chưa có siêu thị phù hợp với bộ lọc đang chọn.
                                        </td>
                                    </tr>
                                ) : (
                                    displaySupermarkets.map((item, index) => {
                                        const code = item.supermarketId || "--"
                                        const missingFields = getMissingFields(item)
                                        const isComplete = missingFields.length === 0

                                        return (
                                            <tr
                                                key={`${code}-${index}`}
                                                className="border-b border-slate-100 align-top transition hover:bg-slate-50/70"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                                                            <Building2 className="h-5 w-5 text-slate-600" />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {item.name || "--"}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                Mã: {code}
                                                            </p>
                                                            {copiedCode === code ? (
                                                                <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                                                    Đã sao chép
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="space-y-2">
                                                        <p className="text-sm text-slate-900">
                                                            {item.contactPhone || "--"}
                                                        </p>
                                                        <span
                                                            className={cn(
                                                                "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                                                                item.contactPhone?.trim()
                                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                                    : "border-rose-200 bg-rose-50 text-rose-700"
                                                            )}
                                                        >
                                                            {item.contactPhone?.trim()
                                                                ? "Đã có liên hệ"
                                                                : "Thiếu liên hệ"}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-start gap-2">
                                                            <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                                                            <p className="text-sm leading-6 text-slate-700">
                                                                {item.address || "--"}
                                                            </p>
                                                        </div>

                                                        <span
                                                            className={cn(
                                                                "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                                                                hasCoordinates(item)
                                                                    ? "border-violet-200 bg-violet-50 text-violet-700"
                                                                    : "border-slate-200 bg-slate-50 text-slate-700"
                                                            )}
                                                        >
                                                            {hasCoordinates(item)
                                                                ? "Có định vị"
                                                                : "Chưa có tọa độ"}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={cn(
                                                            "inline-flex rounded-full border px-3 py-1 text-sm font-medium",
                                                            getStatusClass(item.status)
                                                        )}
                                                    >
                                                        {getStatusLabel(item.status)}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="group relative inline-flex">
                                                        <span
                                                            className={cn(
                                                                "inline-flex rounded-full border px-3 py-1 text-sm font-medium",
                                                                getProfileClass(item)
                                                            )}
                                                        >
                                                            {getProfileLabel(item)}
                                                        </span>

                                                        {!isComplete ? (
                                                            <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-max max-w-[260px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-slate-900 px-3 py-2 text-xs text-white shadow-xl group-hover:block">
                                                                <p className="font-semibold">Thông tin cần bổ sung</p>
                                                                <ul className="mt-1 list-disc pl-4 text-slate-200">
                                                                    {missingFields.map((field) => (
                                                                        <li key={field}>{field}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ) : null}
                                                    </div>
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
                                                            <MapPinned className="h-4 w-4" />
                                                            Xem vị trí
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
                </section>
            )}
        </div>
    )
}

export default AdminSupermarkets
