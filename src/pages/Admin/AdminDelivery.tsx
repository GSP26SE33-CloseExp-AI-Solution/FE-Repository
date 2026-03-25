import { useEffect, useMemo, useState } from "react"
import {
    Bike,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    PackageCheck,
    RefreshCcw,
    Search,
    Truck,
    UserRound,
    XCircle,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type {
    DeliveryGroupDetail,
    DeliveryGroupListItem,
    DeliveryHistoryItem,
    DeliveryStats,
} from "@/types/admin.type"

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

const formatDateShort = (value?: string) => {
    if (!value) return "--"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "--"

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
    }).format(date)
}

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

const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
})

const formatNumber = (value?: number) => {
    return new Intl.NumberFormat("vi-VN").format(value ?? 0)
}

const getStatusClass = (status?: string) => {
    const normalized = status?.toLowerCase()

    switch (normalized) {
        case "pending":
        case "created":
            return "border border-amber-200 bg-amber-100 text-amber-700"
        case "assigned":
        case "confirmed":
        case "ready":
            return "border border-sky-200 bg-sky-100 text-sky-700"
        case "intransit":
        case "in-transit":
        case "shipping":
            return "border border-violet-200 bg-violet-100 text-violet-700"
        case "completed":
        case "delivered":
            return "border border-emerald-200 bg-emerald-100 text-emerald-700"
        case "cancelled":
        case "failed":
            return "border border-rose-200 bg-rose-100 text-rose-700"
        default:
            return "border border-slate-200 bg-slate-100 text-slate-700"
    }
}

const getLoadClass = (load: "rảnh" | "đang bận" | "gần quá tải") => {
    switch (load) {
        case "rảnh":
            return "border border-emerald-200 bg-emerald-50 text-emerald-700"
        case "đang bận":
            return "border border-amber-200 bg-amber-50 text-amber-700"
        case "gần quá tải":
            return "border border-rose-200 bg-rose-50 text-rose-700"
        default:
            return "border border-slate-200 bg-slate-50 text-slate-700"
    }
}

const StatCard = ({
    title,
    value,
    hint,
    icon: Icon,
}: {
    title: string
    value: string
    hint: string
    icon: React.ComponentType<{ className?: string }>
}) => {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
                    <p className="mt-2 text-sm text-slate-500">{hint}</p>
                </div>

                <div className="rounded-2xl bg-slate-100 p-3">
                    <Icon className="h-5 w-5 text-slate-700" />
                </div>
            </div>
        </div>
    )
}

const SectionCard = ({
    title,
    description,
    right,
    children,
}: {
    title: string
    description?: string
    right?: React.ReactNode
    children: React.ReactNode
}) => {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    {description ? (
                        <p className="mt-1 text-sm text-slate-500">{description}</p>
                    ) : null}
                </div>
                {right}
            </div>
            {children}
        </div>
    )
}

const GroupDetailPanel = ({
    detail,
    assigningStaffId,
    setAssigningStaffId,
    assignInput,
    setAssignInput,
    actingAction,
    onAssign,
    onStart,
    onComplete,
    onCancel,
}: {
    detail: DeliveryGroupDetail
    assigningStaffId: string
    setAssigningStaffId: (value: string) => void
    assignInput: string
    setAssignInput: (value: string) => void
    actingAction: string
    onAssign: () => Promise<void>
    onStart: () => Promise<void>
    onComplete: () => Promise<void>
    onCancel: () => Promise<void>
}) => {
    const isAssigning = actingAction === "assign"
    const isStarting = actingAction === "start"
    const isCompleting = actingAction === "complete"
    const isCancelling = actingAction === "cancel"

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Mã nhóm giao
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {detail.groupCode || detail.deliveryGroupId}
                    </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Trạng thái
                    </p>
                    <div className="mt-1">
                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(detail.status)}`}
                        >
                            {detail.status || "--"}
                        </span>
                    </div>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Khung giờ
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {detail.timeSlotDisplay || "--"}
                    </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Khu vực giao
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {detail.deliveryArea || "--"}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Hình thức nhận hàng
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {detail.deliveryType || "--"}
                    </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Tổng số đơn
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatNumber(detail.totalOrders)}
                    </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Đã hoàn tất
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatNumber(detail.completedOrders)}
                    </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Giao chưa thành công
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatNumber(detail.failedOrders)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4 xl:col-span-2">
                    <h3 className="text-base font-bold text-slate-900">Đơn hàng trong nhóm giao</h3>

                    {detail.orders?.length ? (
                        <div className="mt-4 space-y-3">
                            {detail.orders.map((order) => (
                                <div
                                    key={order.orderId}
                                    className="rounded-2xl border border-slate-200 p-4"
                                >
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-slate-900">
                                                    {order.orderCode || order.orderId}
                                                </p>
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(order.status)}`}
                                                >
                                                    {order.status || "--"}
                                                </span>
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
                                                <p>
                                                    <span className="font-medium text-slate-900">
                                                        Khách hàng:
                                                    </span>{" "}
                                                    {order.customerName || "--"}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-slate-900">
                                                        Số điện thoại:
                                                    </span>{" "}
                                                    {order.customerPhone || "--"}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-slate-900">
                                                        Điểm nhận hàng:
                                                    </span>{" "}
                                                    {order.collectionPointName || "--"}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-slate-900">
                                                        Khung giờ:
                                                    </span>{" "}
                                                    {order.timeSlotDisplay || "--"}
                                                </p>
                                                <p className="md:col-span-2">
                                                    <span className="font-medium text-slate-900">
                                                        Địa chỉ:
                                                    </span>{" "}
                                                    {order.addressLine || "--"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                            <p className="text-slate-500">Tổng thanh toán</p>
                                            <p className="mt-1 font-semibold text-slate-900">
                                                {currency.format(order.totalAmount ?? 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                            Nhóm giao này hiện chưa có đơn hàng.
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-base font-bold text-slate-900">Xử lý nhóm giao</h3>

                    <div className="mt-4 space-y-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm font-medium text-slate-700">
                                Người đang phụ trách
                            </p>
                            <p className="mt-1 text-sm text-slate-900">
                                {detail.deliveryStaffName || "Chưa phân công"}
                            </p>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Mã nhân sự giao hàng
                            </label>
                            <input
                                value={assignInput}
                                onChange={(e) => {
                                    setAssignInput(e.target.value)
                                    setAssigningStaffId(e.target.value)
                                }}
                                placeholder="Nhập mã nhân sự giao hàng"
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                            />
                            <button
                                type="button"
                                onClick={() => void onAssign()}
                                disabled={isAssigning || !assigningStaffId.trim()}
                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <UserRound className="h-4 w-4" />
                                {isAssigning ? "Đang phân công..." : "Phân công người giao"}
                            </button>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => void onStart()}
                                disabled={isStarting}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Truck className="h-4 w-4" />
                                {isStarting ? "Đang cập nhật..." : "Bắt đầu giao hàng"}
                            </button>

                            <button
                                type="button"
                                onClick={() => void onComplete()}
                                disabled={isCompleting}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {isCompleting ? "Đang cập nhật..." : "Đánh dấu đã hoàn tất"}
                            </button>

                            <button
                                type="button"
                                onClick={() => void onCancel()}
                                disabled={isCancelling}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <XCircle className="h-4 w-4" />
                                {isCancelling ? "Đang cập nhật..." : "Hủy nhóm giao"}
                            </button>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                            <p>
                                <span className="font-medium text-slate-900">Ngày giao:</span>{" "}
                                {formatDate(detail.deliveryDate)}
                            </p>
                            <p className="mt-1">
                                <span className="font-medium text-slate-900">Tạo lúc:</span>{" "}
                                {formatDateTime(detail.createdAt)}
                            </p>
                            <p className="mt-1">
                                <span className="font-medium text-slate-900">Cập nhật lần cuối:</span>{" "}
                                {formatDateTime(detail.updatedAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

type OPhanCong = {
    groupId: string
    staffId: string
    dayKey: string
    slotId: string
}

const khungGio = [
    { id: "slot-1", label: "08:00 - 10:00" },
    { id: "slot-2", label: "10:00 - 12:00" },
    { id: "slot-3", label: "13:00 - 15:00" },
    { id: "slot-4", label: "15:00 - 17:00" },
    { id: "slot-5", label: "17:00 - 19:00" },
]

const tenThu = [
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
    "Chủ nhật",
]

const toDateInputValue = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

const startOfWeek = (input: Date) => {
    const date = new Date(input)
    const day = date.getDay()
    const diff = day === 0 ? -6 : 1 - day
    date.setDate(date.getDate() + diff)
    date.setHours(0, 0, 0, 0)
    return date
}

const addDays = (date: Date, days: number) => {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
}

const AdminDelivery = () => {
    const [activeTab, setActiveTab] = useState<"groups" | "history" | "stats">("groups")

    const [groupItems, setGroupItems] = useState<DeliveryGroupListItem[]>([])
    const [historyItems, setHistoryItems] = useState<DeliveryHistoryItem[]>([])
    const [statsItems, setStatsItems] = useState<DeliveryStats[]>([])
    const [selectedGroup, setSelectedGroup] = useState<DeliveryGroupDetail | null>(null)

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [detailLoading, setDetailLoading] = useState(false)
    const [actingAction, setActingAction] = useState("")
    const [error, setError] = useState("")

    const [search, setSearch] = useState("")
    const [keyword, setKeyword] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [deliveryTypeFilter, setDeliveryTypeFilter] = useState("")

    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [totalResult, setTotalResult] = useState(0)

    const [assigningStaffId, setAssigningStaffId] = useState("")
    const [assignInput, setAssignInput] = useState("")

    const [weekAnchorDate, setWeekAnchorDate] = useState(() => {
        const now = new Date()
        return toDateInputValue(startOfWeek(now))
    })

    const [draggingGroupId, setDraggingGroupId] = useState("")
    const [plannerAssignments, setPlannerAssignments] = useState<OPhanCong[]>([])

    const weekDates = useMemo(() => {
        const start = startOfWeek(new Date(weekAnchorDate))
        return Array.from({ length: 7 }).map((_, index) => {
            const date = addDays(start, index)
            return {
                index,
                label: tenThu[index],
                value: toDateInputValue(date),
                fullDate: formatDate(toDateInputValue(date)),
                shortDate: formatDateShort(toDateInputValue(date)),
                isToday: toDateInputValue(date) === toDateInputValue(new Date()),
            }
        })
    }, [weekAnchorDate])

    const totalPages = useMemo(() => {
        const total = Math.ceil(totalResult / pageSize)
        return total > 0 ? total : 1
    }, [pageSize, totalResult])

    const totalOrdersInGroups = useMemo(() => {
        return groupItems.reduce((sum, item) => sum + (item.totalOrders ?? 0), 0)
    }, [groupItems])

    const totalCompletedInGroups = useMemo(() => {
        return groupItems.reduce((sum, item) => sum + (item.completedOrders ?? 0), 0)
    }, [groupItems])

    const weekRangeText = useMemo(() => {
        const first = weekDates[0]
        const last = weekDates[6]
        if (!first || !last) return "--"
        return `${first.fullDate} - ${last.fullDate}`
    }, [weekDates])

    const loadStats = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)

            setError("")

            const response = await adminService.getDeliveryStats()
            setStatsItems(response ?? [])
            if (activeTab === "stats") {
                setTotalResult(response?.length ?? 0)
            }
        } catch (err: any) {
            if (activeTab === "stats") {
                setError(err?.response?.data?.message || "Không thể tải thống kê giao hàng.")
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const loadGroups = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)

            setError("")

            const responses = await Promise.all(
                weekDates.map((day) =>
                    adminService.getDeliveryGroups({
                        deliveryDate: day.value,
                        pageNumber: 1,
                        pageSize: 100,
                        status: statusFilter || undefined,
                    })
                )
            )

            let nextItems = responses.flatMap((item) => item.items ?? [])

            if (deliveryTypeFilter) {
                const normalizedDeliveryType = deliveryTypeFilter.trim().toLowerCase()
                nextItems = nextItems.filter(
                    (item) => item.deliveryType?.trim().toLowerCase() === normalizedDeliveryType
                )
            }

            if (keyword.trim()) {
                const normalized = keyword.trim().toLowerCase()
                nextItems = nextItems.filter((item) => {
                    return (
                        item.groupCode?.toLowerCase().includes(normalized) ||
                        item.deliveryArea?.toLowerCase().includes(normalized) ||
                        item.timeSlotDisplay?.toLowerCase().includes(normalized) ||
                        item.status?.toLowerCase().includes(normalized)
                    )
                })
            }

            nextItems.sort((a, b) => {
                const first = new Date(a.deliveryDate ?? "").getTime()
                const second = new Date(b.deliveryDate ?? "").getTime()
                return first - second
            })

            setGroupItems(nextItems)
            setTotalResult(nextItems.length)
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể tải lịch điều phối giao hàng.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const loadHistory = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true)
            else setLoading(true)

            setError("")

            const response = await adminService.getDeliveryHistory({
                pageNumber: page,
                pageSize,
                status: statusFilter || undefined,
            })

            let nextItems = response.items ?? []

            if (keyword.trim()) {
                const normalized = keyword.trim().toLowerCase()
                nextItems = nextItems.filter((item) => {
                    return (
                        item.deliveryId?.toLowerCase().includes(normalized) ||
                        item.orderCode?.toLowerCase().includes(normalized) ||
                        item.orderId?.toLowerCase().includes(normalized) ||
                        item.deliveryStaffName?.toLowerCase().includes(normalized) ||
                        item.status?.toLowerCase().includes(normalized) ||
                        item.failureReason?.toLowerCase().includes(normalized)
                    )
                })
            }

            setHistoryItems(nextItems)
            setTotalResult(keyword.trim() ? nextItems.length : response.totalResult ?? 0)
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể tải lịch sử giao hàng.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const loadGroupDetail = async (groupId: string) => {
        try {
            setDetailLoading(true)
            setError("")

            const response = await adminService.getDeliveryGroupById(groupId)
            setSelectedGroup(response)
            setAssigningStaffId(response.deliveryStaffId || "")
            setAssignInput(response.deliveryStaffId || "")
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể tải chi tiết nhóm giao.")
        } finally {
            setDetailLoading(false)
        }
    }

    const loadData = async (isRefresh = false) => {
        if (activeTab === "groups") {
            await Promise.all([loadGroups(isRefresh), loadStats(isRefresh)])
            return
        }

        if (activeTab === "history") {
            await loadHistory(isRefresh)
            return
        }

        await loadStats(isRefresh)
    }

    useEffect(() => {
        void loadData()
    }, [activeTab, page, keyword, statusFilter, deliveryTypeFilter, weekAnchorDate])

    useEffect(() => {
        setPage(1)
    }, [activeTab])

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setPage(1)
        setKeyword(search.trim())
    }

    const handleAssign = async () => {
        if (!selectedGroup || !assigningStaffId.trim()) return

        try {
            setActingAction("assign")
            await adminService.assignDeliveryGroup(selectedGroup.deliveryGroupId, {
                deliveryStaffId: assigningStaffId.trim(),
            })
            await loadGroupDetail(selectedGroup.deliveryGroupId)
            await loadGroups(true)
            await loadStats(true)
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể phân công người giao hàng.")
        } finally {
            setActingAction("")
        }
    }

    const handleStart = async () => {
        if (!selectedGroup) return

        try {
            setActingAction("start")
            await adminService.startDeliveryGroup(selectedGroup.deliveryGroupId)
            await loadGroupDetail(selectedGroup.deliveryGroupId)
            await loadGroups(true)
            await loadStats(true)
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể bắt đầu giao hàng.")
        } finally {
            setActingAction("")
        }
    }

    const handleComplete = async () => {
        if (!selectedGroup) return

        try {
            setActingAction("complete")
            await adminService.completeDeliveryGroup(selectedGroup.deliveryGroupId)
            await loadGroupDetail(selectedGroup.deliveryGroupId)
            await loadGroups(true)
            await loadStats(true)
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể cập nhật trạng thái hoàn tất.")
        } finally {
            setActingAction("")
        }
    }

    const handleCancel = async () => {
        if (!selectedGroup) return

        try {
            setActingAction("cancel")
            await adminService.cancelDeliveryGroup(selectedGroup.deliveryGroupId)
            await loadGroupDetail(selectedGroup.deliveryGroupId)
            await loadGroups(true)
            await loadStats(true)
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể hủy nhóm giao.")
        } finally {
            setActingAction("")
        }
    }

    const danhSachNhanSu = useMemo(() => {
        return statsItems.map((item) => {
            const activeGroups = item.totalAssignedGroups ?? 0
            const load: "rảnh" | "đang bận" | "gần quá tải" =
                activeGroups <= 1 ? "rảnh" : activeGroups <= 3 ? "đang bận" : "gần quá tải"

            return {
                ...item,
                load,
            }
        })
    }, [statsItems])

    const pendingGroups = useMemo(() => {
        return groupItems.filter((item) => {
            const status = item.status?.toLowerCase() ?? ""
            return ["pending", "created", "assigned", "confirmed", "ready"].includes(status)
        })
    }, [groupItems])

    const unplannedGroups = useMemo(() => {
        return pendingGroups.filter(
            (group) => !plannerAssignments.some((assignment) => assignment.groupId === group.deliveryGroupId)
        )
    }, [pendingGroups, plannerAssignments])

    const assignmentMap = useMemo(() => {
        return new Map(
            plannerAssignments.map((item) => [
                `${item.staffId}-${item.dayKey}-${item.slotId}`,
                item.groupId,
            ])
        )
    }, [plannerAssignments])

    const getAssignedGroup = (staffId?: string, dayKey?: string, slotId?: string) => {
        if (!staffId || !dayKey || !slotId) return null
        const groupId = assignmentMap.get(`${staffId}-${dayKey}-${slotId}`)
        if (!groupId) return null
        return groupItems.find((item) => item.deliveryGroupId === groupId) ?? null
    }

    const handleDropToSlot = (staffId?: string, dayKey?: string, slotId?: string) => {
        if (!draggingGroupId || !staffId || !dayKey || !slotId) return

        setPlannerAssignments((prev) => {
            const next = prev.filter(
                (item) =>
                    item.groupId !== draggingGroupId &&
                    !(item.staffId === staffId && item.dayKey === dayKey && item.slotId === slotId)
            )

            return [...next, { groupId: draggingGroupId, staffId, dayKey, slotId }]
        })

        void loadGroupDetail(draggingGroupId)
        setDraggingGroupId("")
    }

    const goToPreviousWeek = () => {
        const current = startOfWeek(new Date(weekAnchorDate))
        setWeekAnchorDate(toDateInputValue(addDays(current, -7)))
    }

    const goToNextWeek = () => {
        const current = startOfWeek(new Date(weekAnchorDate))
        setWeekAnchorDate(toDateInputValue(addDays(current, 7)))
    }

    const goToCurrentWeek = () => {
        setWeekAnchorDate(toDateInputValue(startOfWeek(new Date())))
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Điều phối giao hàng</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Sắp lịch giao hàng theo tuần, phân công người giao và theo dõi tiến độ xử lý.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadData(true)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Làm mới dữ liệu
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Nhóm giao trong tuần"
                    value={formatNumber(groupItems.length)}
                    hint="Tổng số nhóm giao đang hiển thị trong tuần này"
                    icon={Truck}
                />
                <StatCard
                    title="Tổng đơn cần xử lý"
                    value={formatNumber(totalOrdersInGroups)}
                    hint="Tổng số đơn thuộc các nhóm giao trong tuần"
                    icon={ClipboardList}
                />
                <StatCard
                    title="Đơn đã hoàn tất"
                    value={formatNumber(totalCompletedInGroups)}
                    hint="Số đơn đã giao thành công"
                    icon={PackageCheck}
                />
                <StatCard
                    title="Nhân sự đang sẵn sàng"
                    value={formatNumber(danhSachNhanSu.length)}
                    hint="Số người có thể tham gia điều phối"
                    icon={Bike}
                />
            </div>

            <SectionCard
                title="Bộ lọc và tra cứu"
                description="Tìm nhanh nhóm giao, lọc theo trạng thái và hình thức nhận hàng."
                right={
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab("groups")}
                            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === "groups"
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            Điều phối theo tuần
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("history")}
                            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === "history"
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            Lịch sử giao hàng
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("stats")}
                            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === "stats"
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            Hiệu suất giao hàng
                        </button>
                    </div>
                }
            >
                <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 xl:grid-cols-4">
                    <div className="relative xl:col-span-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo mã nhóm, khu vực giao hoặc trạng thái"
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setPage(1)
                            setStatusFilter(e.target.value)
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="Pending">Chờ xử lý</option>
                        <option value="Assigned">Đã phân công</option>
                        <option value="InTransit">Đang giao</option>
                        <option value="Completed">Đã hoàn tất</option>
                        <option value="Cancelled">Đã hủy</option>
                        <option value="Failed">Giao chưa thành công</option>
                    </select>

                    <div className="flex gap-3">
                        {activeTab !== "stats" ? (
                            <select
                                value={deliveryTypeFilter}
                                onChange={(e) => {
                                    setPage(1)
                                    setDeliveryTypeFilter(e.target.value)
                                }}
                                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                            >
                                <option value="">Tất cả hình thức</option>
                                <option value="Delivery">Giao tận nơi</option>
                                <option value="Pickup">Nhận tại điểm</option>
                            </select>
                        ) : (
                            <div className="flex-1" />
                        )}

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Áp dụng
                        </button>
                    </div>
                </form>
            </SectionCard>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            {activeTab === "groups" ? (
                <div className="space-y-6">
                    <SectionCard
                        title="Lịch điều phối theo tuần"
                        description="Kéo từng nhóm giao từ danh sách chờ sang ô phù hợp theo ngày và khung giờ."
                        right={
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                                    <CalendarDays className="h-4 w-4" />
                                    Tuần đang xem: {weekRangeText}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={goToPreviousWeek}
                                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={goToCurrentWeek}
                                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Về tuần hiện tại
                                    </button>

                                    <button
                                        type="button"
                                        onClick={goToNextWeek}
                                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        }
                    >
                        {loading ? (
                            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
                        ) : (
                            <div className="space-y-5">
                                {danhSachNhanSu.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                                        Hiện chưa có nhân sự giao hàng. Bạn vẫn có thể xem trước lịch điều phối trong tuần.
                                    </div>
                                ) : null}

                                {danhSachNhanSu.length === 0 ? (
                                    <div className="overflow-x-auto">
                                        <div className="min-w-[1280px]">
                                            <div className="grid grid-cols-7 gap-3">
                                                {weekDates.map((day) => (
                                                    <div
                                                        key={day.value}
                                                        className={`rounded-2xl border p-3 ${day.isToday
                                                                ? "border-slate-900 bg-slate-50"
                                                                : "border-slate-200 bg-white"
                                                            }`}
                                                    >
                                                        <div className="mb-3 border-b border-slate-200 pb-3">
                                                            <p className="text-sm font-bold text-slate-900">
                                                                {day.label}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {day.fullDate}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {khungGio.map((slot) => (
                                                                <div
                                                                    key={`${day.value}-${slot.id}`}
                                                                    className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-2.5"
                                                                >
                                                                    <div className="mb-2 flex items-center justify-between gap-2">
                                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                                            {slot.label}
                                                                        </p>
                                                                    </div>

                                                                    <div className="flex min-h-[110px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-3 text-center text-xs text-slate-400">
                                                                        Chưa có người giao để sắp vào khung này
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    danhSachNhanSu.map((staff) => (
                                        <div
                                            key={staff.deliveryStaffId}
                                            className="overflow-hidden rounded-3xl border border-slate-200"
                                        >
                                            <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                                                        <UserRound className="h-5 w-5 text-slate-700" />
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {staff.deliveryStaffName || "--"}
                                                        </p>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Mã nhân sự: {staff.deliveryStaffId}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getLoadClass(
                                                            staff.load
                                                        )}`}
                                                    >
                                                        {staff.load === "rảnh"
                                                            ? "Đang rảnh"
                                                            : staff.load === "đang bận"
                                                                ? "Đang có chuyến"
                                                                : "Gần quá tải"}
                                                    </span>

                                                    <div className="rounded-2xl bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                                                        Tỷ lệ hoàn tất:{" "}
                                                        <span className="font-bold text-slate-900">
                                                            {staff.completionRate ?? 0}%
                                                        </span>
                                                    </div>

                                                    <div className="rounded-2xl bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                                                        Nhóm đang phụ trách:{" "}
                                                        <span className="font-bold text-slate-900">
                                                            {formatNumber(staff.totalAssignedGroups)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <div className="min-w-[1280px]">
                                                    <div className="grid grid-cols-7 gap-3 p-4">
                                                        {weekDates.map((day) => (
                                                            <div
                                                                key={`${staff.deliveryStaffId}-${day.value}`}
                                                                className={`rounded-2xl border p-3 ${day.isToday
                                                                        ? "border-slate-900 bg-slate-50"
                                                                        : "border-slate-200 bg-white"
                                                                    }`}
                                                            >
                                                                <div className="mb-3 border-b border-slate-200 pb-3">
                                                                    <p className="text-sm font-bold text-slate-900">
                                                                        {day.label}
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        {day.fullDate}
                                                                    </p>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    {khungGio.map((slot) => {
                                                                        const assignedGroup = getAssignedGroup(
                                                                            staff.deliveryStaffId,
                                                                            day.value,
                                                                            slot.id
                                                                        )

                                                                        return (
                                                                            <div
                                                                                key={`${staff.deliveryStaffId}-${day.value}-${slot.id}`}
                                                                                onDragOver={(e) => e.preventDefault()}
                                                                                onDrop={() =>
                                                                                    handleDropToSlot(
                                                                                        staff.deliveryStaffId,
                                                                                        day.value,
                                                                                        slot.id
                                                                                    )
                                                                                }
                                                                                className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-2.5 transition hover:border-slate-300"
                                                                            >
                                                                                <div className="mb-2 flex items-center justify-between gap-2">
                                                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                                                        {slot.label}
                                                                                    </p>
                                                                                </div>

                                                                                {assignedGroup ? (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            void loadGroupDetail(
                                                                                                assignedGroup.deliveryGroupId
                                                                                            )
                                                                                        }
                                                                                        className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:bg-slate-50"
                                                                                    >
                                                                                        <div className="flex items-start justify-between gap-2">
                                                                                            <div className="min-w-0">
                                                                                                <p className="truncate font-semibold text-slate-900">
                                                                                                    {assignedGroup.groupCode ||
                                                                                                        assignedGroup.deliveryGroupId}
                                                                                                </p>
                                                                                                <p className="mt-1 text-xs text-slate-500">
                                                                                                    {assignedGroup.deliveryArea ||
                                                                                                        "--"}
                                                                                                </p>
                                                                                            </div>

                                                                                            <span
                                                                                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                                                                                                    assignedGroup.status
                                                                                                )}`}
                                                                                            >
                                                                                                {assignedGroup.status || "--"}
                                                                                            </span>
                                                                                        </div>

                                                                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                                                                                            <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                                                                                                <p>Tổng đơn</p>
                                                                                                <p className="mt-1 font-bold text-slate-900">
                                                                                                    {formatNumber(
                                                                                                        assignedGroup.totalOrders
                                                                                                    )}
                                                                                                </p>
                                                                                            </div>

                                                                                            <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                                                                                                <p>Hình thức</p>
                                                                                                <p className="mt-1 font-bold text-slate-900">
                                                                                                    {assignedGroup.deliveryType ||
                                                                                                        "--"}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </button>
                                                                                ) : (
                                                                                    <div className="flex min-h-[110px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-3 text-center text-xs text-slate-400">
                                                                                        Kéo nhóm giao vào ô này
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </SectionCard>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                        <div className="space-y-6 xl:col-span-2">
                            <SectionCard
                                title="Danh sách chờ sắp lịch"
                                description="Chọn hoặc kéo thả nhóm giao vào từng ô trong thời khóa biểu tuần."
                            >
                                {loading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 4 }).map((_, index) => (
                                            <div
                                                key={index}
                                                className="h-24 animate-pulse rounded-2xl bg-slate-100"
                                            />
                                        ))}
                                    </div>
                                ) : unplannedGroups.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                        Tất cả nhóm giao đã được sắp vào lịch hoặc hiện không còn nhóm chờ.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {unplannedGroups.map((item) => (
                                            <button
                                                key={item.deliveryGroupId}
                                                type="button"
                                                draggable
                                                onDragStart={() => setDraggingGroupId(item.deliveryGroupId)}
                                                onDragEnd={() => setDraggingGroupId("")}
                                                onClick={() => void loadGroupDetail(item.deliveryGroupId)}
                                                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="font-semibold text-slate-900">
                                                                {item.groupCode || item.deliveryGroupId}
                                                            </p>
                                                            <span
                                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                                    item.status
                                                                )}`}
                                                            >
                                                                {item.status || "--"}
                                                            </span>
                                                        </div>

                                                        <div className="mt-3 space-y-1 text-sm text-slate-600">
                                                            <p>Khu vực giao: {item.deliveryArea || "--"}</p>
                                                            <p>Khung giờ: {item.timeSlotDisplay || "--"}</p>
                                                            <p>Ngày giao: {formatDate(item.deliveryDate)}</p>
                                                        </div>
                                                    </div>

                                                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                                                </div>

                                                <div className="mt-4 grid grid-cols-3 gap-2">
                                                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-700">
                                                        <p className="opacity-80">Tổng đơn</p>
                                                        <p className="mt-1 font-bold">
                                                            {formatNumber(item.totalOrders)}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-700">
                                                        <p className="opacity-80">Đã hoàn tất</p>
                                                        <p className="mt-1 font-bold">
                                                            {formatNumber(item.completedOrders)}
                                                        </p>
                                                    </div>

                                                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-700">
                                                        <p className="opacity-80">Hình thức</p>
                                                        <p className="mt-1 font-bold">
                                                            {item.deliveryType || "--"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </SectionCard>

                            <SectionCard
                                title="Tổng quan nhân sự giao hàng"
                                description="Theo dõi nhanh mức độ bận rộn và hiệu suất của từng người."
                            >
                                {danhSachNhanSu.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                        Chưa có dữ liệu nhân sự giao hàng.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {danhSachNhanSu.map((staff) => (
                                            <div
                                                key={staff.deliveryStaffId}
                                                className="rounded-2xl border border-slate-200 p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="rounded-2xl bg-slate-100 p-3">
                                                            <UserRound className="h-5 w-5 text-slate-700" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900">
                                                                {staff.deliveryStaffName || "--"}
                                                            </p>
                                                            <p className="mt-1 text-sm text-slate-500">
                                                                Mã nhân sự: {staff.deliveryStaffId}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getLoadClass(
                                                            staff.load
                                                        )}`}
                                                    >
                                                        {staff.load === "rảnh"
                                                            ? "Đang rảnh"
                                                            : staff.load === "đang bận"
                                                                ? "Đang có chuyến"
                                                                : "Gần quá tải"}
                                                    </span>
                                                </div>

                                                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                                                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                                                        <p className="text-slate-500">Nhóm đang giao</p>
                                                        <p className="mt-1 font-bold text-slate-900">
                                                            {formatNumber(staff.totalAssignedGroups)}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                                                        <p className="text-slate-500">Tổng đơn</p>
                                                        <p className="mt-1 font-bold text-slate-900">
                                                            {formatNumber(staff.totalOrders)}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                                                        <p className="text-slate-500">Tỷ lệ hoàn tất</p>
                                                        <p className="mt-1 font-bold text-slate-900">
                                                            {staff.completionRate ?? 0}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </SectionCard>
                        </div>

                        <div className="xl:col-span-3">
                            <SectionCard
                                title="Chi tiết nhóm giao"
                                description="Xem danh sách đơn hàng, người phụ trách và thao tác xử lý."
                            >
                                {detailLoading ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 4 }).map((_, index) => (
                                            <div
                                                key={index}
                                                className="h-24 animate-pulse rounded-2xl bg-slate-100"
                                            />
                                        ))}
                                    </div>
                                ) : selectedGroup ? (
                                    <GroupDetailPanel
                                        detail={selectedGroup}
                                        assigningStaffId={assigningStaffId}
                                        setAssigningStaffId={setAssigningStaffId}
                                        assignInput={assignInput}
                                        setAssignInput={setAssignInput}
                                        actingAction={actingAction}
                                        onAssign={handleAssign}
                                        onStart={handleStart}
                                        onComplete={handleComplete}
                                        onCancel={handleCancel}
                                    />
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-16 text-center text-sm text-slate-500">
                                        Chọn một nhóm giao trong danh sách chờ hoặc trên lịch tuần để xem chi tiết.
                                    </div>
                                )}
                            </SectionCard>
                        </div>
                    </div>
                </div>
            ) : null}

            {activeTab === "history" ? (
                <SectionCard
                    title="Lịch sử giao hàng"
                    description="Theo dõi các lượt giao đã hoàn thành hoặc phát sinh sự cố."
                >
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-20 animate-pulse rounded-2xl bg-slate-100"
                                />
                            ))}
                        </div>
                    ) : historyItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                            Hiện chưa có lịch sử giao hàng phù hợp với bộ lọc đang chọn.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-left text-sm text-slate-500">
                                        <th className="px-4 py-2 font-medium">Mã lượt giao</th>
                                        <th className="px-4 py-2 font-medium">Mã đơn hàng</th>
                                        <th className="px-4 py-2 font-medium">Người giao</th>
                                        <th className="px-4 py-2 font-medium">Trạng thái</th>
                                        <th className="px-4 py-2 font-medium">Ghi nhận</th>
                                        <th className="px-4 py-2 font-medium">Hoàn tất lúc</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyItems.map((item) => (
                                        <tr key={item.deliveryId} className="bg-slate-50">
                                            <td className="rounded-l-2xl px-4 py-3 text-sm font-medium text-slate-900">
                                                {item.deliveryId}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {item.orderCode || item.orderId}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {item.deliveryStaffName || "--"}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                        item.status
                                                    )}`}
                                                >
                                                    {item.status || "--"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-700">
                                                {item.failureReason || "--"}
                                            </td>
                                            <td className="rounded-r-2xl px-4 py-3 text-sm text-slate-700">
                                                {formatDateTime(item.deliveredAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Tổng số bản ghi:{" "}
                            <span className="font-semibold text-slate-900">{totalResult}</span>
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
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={page >= totalPages}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </SectionCard>
            ) : null}

            {activeTab === "stats" ? (
                <SectionCard
                    title="Hiệu suất giao hàng theo nhân sự"
                    description="Tổng hợp kết quả giao hàng của từng người trong hệ thống."
                >
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-24 animate-pulse rounded-2xl bg-slate-100"
                                />
                            ))}
                        </div>
                    ) : statsItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                            Hiện chưa có dữ liệu hiệu suất giao hàng.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {statsItems.map((item) => (
                                <div
                                    key={item.deliveryStaffId}
                                    className="rounded-3xl border border-slate-200 p-5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-2xl bg-slate-100 p-3">
                                                <UserRound className="h-5 w-5 text-slate-700" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900">
                                                    {item.deliveryStaffName || "--"}
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    Mã nhân sự: {item.deliveryStaffId}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                                            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                                                Tỷ lệ hoàn tất
                                            </p>
                                            <p className="mt-1 text-lg font-bold text-emerald-900">
                                                {item.completionRate ?? 0}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                            <p className="text-sm text-slate-500">Nhóm được giao</p>
                                            <p className="mt-1 text-lg font-bold text-slate-900">
                                                {formatNumber(item.totalAssignedGroups)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                            <p className="text-sm text-slate-500">Tổng đơn</p>
                                            <p className="mt-1 text-lg font-bold text-slate-900">
                                                {formatNumber(item.totalOrders)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                            <p className="text-sm text-slate-500">Giao thành công</p>
                                            <p className="mt-1 text-lg font-bold text-emerald-700">
                                                {formatNumber(item.completedOrders)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                            <p className="text-sm text-slate-500">
                                                Giao chưa thành công
                                            </p>
                                            <p className="mt-1 text-lg font-bold text-rose-700">
                                                {formatNumber(item.failedOrders)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                            <p className="text-sm text-slate-500">Đơn đang chờ</p>
                                            <p className="mt-1 text-lg font-bold text-amber-700">
                                                {formatNumber(item.pendingOrders)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                            <p className="text-sm text-slate-500">Đơn đang giao</p>
                                            <p className="mt-1 text-lg font-bold text-violet-700">
                                                {formatNumber(item.inTransitOrders)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        <span className="font-medium text-slate-900">
                                            Lần giao gần nhất:
                                        </span>{" "}
                                        {formatDateTime(item.lastDeliveryAt)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            ) : null}
        </div>
    )
}

export default AdminDelivery
