import { useEffect, useMemo, useState } from "react"
import {
    AlertTriangle,
    RefreshCcw,
    Search,
    ShieldCheck,
    Store,
    UserRound,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type {
    AdminOrder,
    AdminSupermarketItem,
    PendingSupermarketApplication,
    UpdateSupermarketPayload,
} from "@/types/admin.type"

import ApplicationList from "./adminSupermarkets/ApplicationList"
import SupermarketDetailModal from "./adminSupermarkets/SupermarketDetailModal"
import SupermarketTable from "./adminSupermarkets/SupermarketTable"
import {
    cn,
    formatCompactNumber,
    normalizeStatus,
} from "./adminSupermarkets/adminSupermarkets.utils"

type SortOption =
    | "name-asc"
    | "name-desc"
    | "status-pending-first"
    | "status-active-first"
    | "created-desc"
    | "created-asc"

type StatusFilter =
    | "all"
    | "pending"
    | "active"
    | "suspended"
    | "closed"
    | "rejected"

type ViewTab = "applications" | "supermarkets"

const BLOCKING_ORDER_STATUSES = new Set([
    "pending",
    "paid",
    "readytoship",
    "deliveredwaitconfirm",
])

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
    const [updatingStatusId, setUpdatingStatusId] = useState("")

    const [blockingOrdersMap, setBlockingOrdersMap] = useState<Record<string, AdminOrder[]>>({})
    const [selectedSupermarket, setSelectedSupermarket] = useState<AdminSupermarketItem | null>(null)

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

    const toUpdatePayload = (
        item: AdminSupermarketItem,
        nextStatus: number
    ): UpdateSupermarketPayload => ({
        name: item.name || "",
        address: item.address || "",
        latitude: item.latitude ?? 0,
        longitude: item.longitude ?? 0,
        contactPhone: item.contactPhone || "",
        status: nextStatus,
    })

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

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setSelectedSupermarket(null)
            }
        }

        window.addEventListener("keydown", handleEscape)
        return () => window.removeEventListener("keydown", handleEscape)
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
                else if (item.status === 4) acc.rejected += 1

                if (!item.contactPhone?.trim()) acc.missingPhone += 1
                if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) {
                    acc.missingLocation += 1
                }
                if (
                    !item.name?.trim() ||
                    !item.address?.trim() ||
                    !item.contactPhone?.trim() ||
                    !Number.isFinite(item.latitude) ||
                    !Number.isFinite(item.longitude)
                ) {
                    acc.incompleteProfile += 1
                }

                return acc
            },
            {
                pending: 0,
                active: 0,
                suspended: 0,
                closed: 0,
                rejected: 0,
                missingPhone: 0,
                missingLocation: 0,
                incompleteProfile: 0,
            }
        )
    }, [supermarkets])

    const applicationSummary = useMemo(() => {
        return applications.reduce(
            (acc, item) => {
                const blockedCount = blockingOrdersMap[item.applicantUserId]?.length ?? 0
                if (blockedCount > 0) acc.blocked += 1
                else acc.ready += 1
                return acc
            },
            { ready: 0, blocked: 0 }
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
            case "rejected":
                return item.status === 4
            case "all":
            default:
                return true
        }
    }

    const displaySupermarkets = useMemo(() => {
        const normalized = keyword.trim().toLowerCase()

        const filtered = supermarkets
            .filter(matchesStatusFilter)
            .filter((item) => {
                if (!normalized) return true

                const target = [
                    item.name,
                    item.address,
                    item.contactPhone,
                    item.contactEmail,
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

    const statusTabs: Array<{ key: StatusFilter; label: string; count: number }> = [
        { key: "all", label: "Tất cả", count: supermarkets.length },
        { key: "pending", label: "Chờ duyệt", count: currentPageStats.pending },
        { key: "active", label: "Đang hoạt động", count: currentPageStats.active },
        { key: "suspended", label: "Tạm ngưng", count: currentPageStats.suspended },
        { key: "closed", label: "Đã đóng", count: currentPageStats.closed },
        { key: "rejected", label: "Đã từ chối", count: currentPageStats.rejected },
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

    const openMap = (item: { latitude?: number | null; longitude?: number | null }) => {
        if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) return

        const url = `https://www.google.com/maps?q=${item.latitude},${item.longitude}`
        window.open(url, "_blank", "noopener,noreferrer")
    }

    const getBlockingOrders = (userId: string) => blockingOrdersMap[userId] ?? []

    const loadBlockingOrdersByUserId = async (userId: string) => {
        const result = await adminService.getBlockingCustomerOrders(userId)
        return result.filter((order) =>
            BLOCKING_ORDER_STATUSES.has(normalizeStatus(order.status))
        )
    }

    const handleCheckBlockingOrders = async (application: PendingSupermarketApplication) => {
        try {
            setCheckingOrdersId(application.supermarketId)
            setError("")

            const blockingOrders = await loadBlockingOrdersByUserId(application.applicantUserId)

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
                blockingOrders = await loadBlockingOrdersByUserId(application.applicantUserId)
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

    const handleUpdateSupermarketStatus = async (
        item: AdminSupermarketItem,
        nextStatus: number
    ) => {
        try {
            setUpdatingStatusId(item.supermarketId)
            setError("")

            await adminService.updateSupermarket(
                item.supermarketId,
                toUpdatePayload(item, nextStatus)
            )

            setSupermarkets((prev) =>
                prev.map((current) =>
                    current.supermarketId === item.supermarketId
                        ? { ...current, status: nextStatus }
                        : current
                )
            )

            setSelectedSupermarket((prev) =>
                prev && prev.supermarketId === item.supermarketId
                    ? { ...prev, status: nextStatus }
                    : prev
            )
        } catch (err) {
            console.error("AdminSupermarkets.handleUpdateSupermarketStatus -> error:", err)
            setError(getErrorMessage(err, "Chưa thể cập nhật trạng thái siêu thị lúc này."))
        } finally {
            setUpdatingStatusId("")
        }
    }

    const statCards: Array<{
        label: string
        value: number
        hint: string
        tone: "slate" | "emerald" | "amber" | "violet"
    }> = [
            {
                label: "Hồ sơ chờ xem xét",
                value: applications.length,
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
        ]

    return (
        <div className="space-y-6">
            <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-slate-600">
                            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                            QUẢN LÝ ĐỐI TÁC SIÊU THỊ
                        </div>

                        <h1 className="mt-3 text-xl font-semibold leading-tight text-slate-900 lg:text-[26px]">
                            Hồ sơ đối tác và mạng lưới siêu thị
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={() => void handleRefresh()}
                        disabled={refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                        Làm mới dữ liệu
                    </button>
                </div>
            </section>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((item) => {
                        const toneClass =
                            item.tone === "emerald"
                                ? "border-emerald-200 bg-emerald-50/70"
                                : item.tone === "amber"
                                    ? "border-amber-200 bg-amber-50/70"
                                    : item.tone === "violet"
                                        ? "border-violet-200 bg-violet-50/70"
                                        : "border-slate-200 bg-slate-50/80"

                        return (
                            <div
                                key={item.label}
                                className={cn("rounded-2xl border px-4 py-4", toneClass)}
                            >
                                <p className="text-xs font-medium text-slate-500">{item.label}</p>
                                <p className="mt-2 text-2xl font-semibold text-slate-900">
                                    {formatCompactNumber(item.value)}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">{item.hint}</p>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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
                            Hồ sơ chờ duyệt
                            <span
                                className={cn(
                                    "rounded-full px-2 py-0.5 text-xs",
                                    tab === "applications"
                                        ? "bg-white/15 text-white"
                                        : "bg-slate-100 text-slate-600"
                                )}
                            >
                                {formatCompactNumber(applications.length)}
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
                                        : "Tìm theo tên siêu thị, địa chỉ, điện thoại, email hoặc mã..."
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
                                            Sau khi được phê duyệt, tài khoản này sẽ chuyển sang vai trò đối tác siêu thị.
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
                                            Nên kiểm tra đơn mua đang mở để tránh chồng vai trò khi xử lý đơn.
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
                                            Tách biệt với luồng duyệt tài khoản thông thường để quản trị rõ ràng hơn.
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
                <ApplicationList
                    loading={loadingApplications}
                    applications={displayApplications}
                    copiedCode={copiedCode}
                    checkingOrdersId={checkingOrdersId}
                    approvingId={approvingId}
                    rejectingId={rejectingId}
                    openRejectId={openRejectId}
                    rejectNote={rejectNote}
                    blockingOrdersMap={blockingOrdersMap}
                    onCopyCode={handleCopyCode}
                    onOpenMap={openMap}
                    onCheckBlockingOrders={handleCheckBlockingOrders}
                    onApprove={handleApprove}
                    onOpenReject={handleOpenReject}
                    onCloseReject={handleCloseReject}
                    onRejectNoteChange={setRejectNote}
                    onReject={handleReject}
                />
            ) : (
                <SupermarketTable
                    loading={loadingSupermarkets}
                    supermarkets={displaySupermarkets}
                    currentPageCount={supermarkets.length}
                    page={page}
                    totalPages={totalPages}
                    onPrevPage={() => setPage((prev) => Math.max(prev - 1, 1))}
                    onNextPage={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    onOpenDetail={setSelectedSupermarket}
                />
            )}

            <SupermarketDetailModal
                supermarket={selectedSupermarket}
                copiedCode={copiedCode}
                updatingStatusId={updatingStatusId}
                onClose={() => setSelectedSupermarket(null)}
                onCopyCode={handleCopyCode}
                onOpenMap={openMap}
                onUpdateStatus={handleUpdateSupermarketStatus}
            />
        </div>
    )
}

export default AdminSupermarkets
