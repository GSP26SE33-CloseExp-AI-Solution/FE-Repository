import { useEffect, useMemo, useState } from "react"
import {
    Bike,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    MapPinned,
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
                        Mã nhóm
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
                        Khu vực
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {detail.deliveryArea || "--"}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Hình thức
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {detail.deliveryType || "--"}
                    </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Tổng đơn
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatNumber(detail.totalOrders)}
                    </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Hoàn tất
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatNumber(detail.completedOrders)}
                    </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Thất bại
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatNumber(detail.failedOrders)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4 xl:col-span-2">
                    <h3 className="text-base font-bold text-slate-900">Đơn hàng trong nhóm</h3>

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
                                                        Khách:
                                                    </span>{" "}
                                                    {order.customerName || "--"}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-slate-900">
                                                        SĐT:
                                                    </span>{" "}
                                                    {order.customerPhone || "--"}
                                                </p>
                                                <p>
                                                    <span className="font-medium text-slate-900">
                                                        Điểm nhận:
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
                                            <p className="text-slate-500">Tổng tiền</p>
                                            <p className="mt-1 font-semibold text-slate-900">
                                                {currency.format(order.totalAmount ?? 0)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 overflow-x-auto">
                                        <table className="min-w-full border-separate border-spacing-y-2">
                                            <thead>
                                                <tr className="text-left text-xs text-slate-500">
                                                    <th className="px-3 py-2 font-medium">
                                                        Sản phẩm
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Số lượng
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Đơn giá
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Thành tiền
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.items?.map((item) => (
                                                    <tr
                                                        key={item.orderItemId}
                                                        className="bg-slate-50"
                                                    >
                                                        <td className="rounded-l-2xl px-3 py-3 text-sm text-slate-900">
                                                            {item.productName || "--"}
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-slate-700">
                                                            {formatNumber(item.quantity)}
                                                        </td>
                                                        <td className="px-3 py-3 text-sm text-slate-700">
                                                            {currency.format(item.unitPrice ?? 0)}
                                                        </td>
                                                        <td className="rounded-r-2xl px-3 py-3 text-sm text-slate-700">
                                                            {currency.format(item.subTotal ?? 0)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                            Nhóm giao hàng này chưa có đơn.
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="text-base font-bold text-slate-900">Thao tác nhóm giao</h3>

                    <div className="mt-4 space-y-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm font-medium text-slate-700">
                                Nhân sự đang phụ trách
                            </p>
                            <p className="mt-1 text-sm text-slate-900">
                                {detail.deliveryStaffName || "--"}
                            </p>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Delivery Staff ID
                            </label>
                            <input
                                value={assignInput}
                                onChange={(e) => {
                                    setAssignInput(e.target.value)
                                    setAssigningStaffId(e.target.value)
                                }}
                                placeholder="Nhập deliveryStaffId..."
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                            />
                            <button
                                type="button"
                                onClick={() => void onAssign()}
                                disabled={isAssigning || !assigningStaffId.trim()}
                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <UserRound className="h-4 w-4" />
                                {isAssigning ? "Đang gán..." : "Gán nhân sự giao"}
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
                                {isStarting ? "Đang xử lý..." : "Bắt đầu giao"}
                            </button>

                            <button
                                type="button"
                                onClick={() => void onComplete()}
                                disabled={isCompleting}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {isCompleting ? "Đang xử lý..." : "Hoàn tất nhóm giao"}
                            </button>

                            <button
                                type="button"
                                onClick={() => void onCancel()}
                                disabled={isCancelling}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <XCircle className="h-4 w-4" />
                                {isCancelling ? "Đang xử lý..." : "Hủy nhóm giao"}
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
                                <span className="font-medium text-slate-900">Cập nhật:</span>{" "}
                                {formatDateTime(detail.updatedAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
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

    const loadGroups = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const response = await adminService.getDeliveryGroups({
                pageNumber: page,
                pageSize,
                status: statusFilter || undefined,
                deliveryType: deliveryTypeFilter || undefined,
            })

            let nextItems = response.items ?? []

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

            setGroupItems(nextItems)
            setTotalResult(keyword.trim() ? nextItems.length : response.totalResult ?? nextItems.length)
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể tải danh sách nhóm giao hàng.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const loadHistory = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const response = await adminService.getDeliveryHistory({
                pageNumber: page,
                pageSize,
                status: statusFilter || undefined,
                keyword: keyword || undefined,
            })

            setHistoryItems(response.items ?? [])
            setTotalResult(response.totalResult ?? 0)
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể tải lịch sử giao hàng.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const loadStats = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            const response = await adminService.getDeliveryStats()
            setStatsItems(response ?? [])
            setTotalResult(response?.length ?? 0)
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể tải thống kê giao hàng.")
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
            await loadGroups(isRefresh)
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
    }, [activeTab, page, keyword, statusFilter, deliveryTypeFilter])

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
        } catch (err: any) {
            setError(err?.response?.data?.message || "Gán nhân sự giao thất bại.")
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
        } catch (err: any) {
            setError(err?.response?.data?.message || "Bắt đầu giao thất bại.")
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
        } catch (err: any) {
            setError(err?.response?.data?.message || "Hoàn tất nhóm giao thất bại.")
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
        } catch (err: any) {
            setError(err?.response?.data?.message || "Hủy nhóm giao thất bại.")
        } finally {
            setActingAction("")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Delivery</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Quản lý nhóm giao hàng, lịch sử vận chuyển và hiệu suất nhân sự giao.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadData(true)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Làm mới
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Nhóm giao hiện có"
                    value={formatNumber(groupItems.length)}
                    hint="Số nhóm giao trong danh sách hiện tại"
                    icon={Truck}
                />
                <StatCard
                    title="Tổng đơn trong nhóm"
                    value={formatNumber(totalOrdersInGroups)}
                    hint="Tổng đơn thuộc các nhóm đang hiển thị"
                    icon={ClipboardList}
                />
                <StatCard
                    title="Đã hoàn tất"
                    value={formatNumber(totalCompletedInGroups)}
                    hint="Số đơn đã giao thành công"
                    icon={PackageCheck}
                />
                <StatCard
                    title="Nhân sự giao"
                    value={formatNumber(statsItems.length)}
                    hint="Số nhân sự có thống kê giao hàng"
                    icon={Bike}
                />
            </div>

            <SectionCard
                title="Bộ lọc"
                description="Lọc dữ liệu theo tab đang xem."
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
                            Delivery Groups
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("history")}
                            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === "history"
                                    ? "bg-slate-900 text-white"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            Delivery History
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("stats")}
                            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === "stats"
                                    ? "bg-slate-900 text-white"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            Delivery Stats
                        </button>
                    </div>
                }
            >
                <form
                    onSubmit={handleSearch}
                    className="grid grid-cols-1 gap-3 xl:grid-cols-4"
                >
                    <div className="relative xl:col-span-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo mã nhóm, khu vực, trạng thái, mã đơn..."
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
                        <option value="Pending">Pending</option>
                        <option value="Assigned">Assigned</option>
                        <option value="InTransit">InTransit</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Failed">Failed</option>
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
                                <option value="Delivery">Delivery</option>
                                <option value="Pickup">Pickup</option>
                            </select>
                        ) : (
                            <div className="flex-1" />
                        )}

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Tìm
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
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                    <div className="space-y-6 xl:col-span-2">
                        <SectionCard
                            title="Danh sách nhóm giao"
                            description="Chọn một nhóm để xem chi tiết và thao tác."
                        >
                            {loading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <div
                                            key={index}
                                            className="h-28 animate-pulse rounded-2xl bg-slate-100"
                                        />
                                    ))}
                                </div>
                            ) : groupItems.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                                    Không có nhóm giao phù hợp.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {groupItems.map((item) => {
                                        const active =
                                            selectedGroup?.deliveryGroupId === item.deliveryGroupId

                                        return (
                                            <button
                                                key={item.deliveryGroupId}
                                                type="button"
                                                onClick={() => void loadGroupDetail(item.deliveryGroupId)}
                                                className={`w-full rounded-2xl border p-4 text-left transition ${active
                                                        ? "border-slate-900 bg-slate-900 text-white"
                                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p
                                                                className={`font-semibold ${active
                                                                        ? "text-white"
                                                                        : "text-slate-900"
                                                                    }`}
                                                            >
                                                                {item.groupCode || item.deliveryGroupId}
                                                            </p>
                                                            <span
                                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${active
                                                                        ? "bg-white/15 text-white border border-white/20"
                                                                        : getStatusClass(item.status)
                                                                    }`}
                                                            >
                                                                {item.status || "--"}
                                                            </span>
                                                        </div>

                                                        <div
                                                            className={`mt-3 space-y-1 text-sm ${active
                                                                    ? "text-slate-200"
                                                                    : "text-slate-600"
                                                                }`}
                                                        >
                                                            <p>Khu vực: {item.deliveryArea || "--"}</p>
                                                            <p>Khung giờ: {item.timeSlotDisplay || "--"}</p>
                                                            <p>Ngày giao: {formatDate(item.deliveryDate)}</p>
                                                        </div>
                                                    </div>

                                                    <ChevronRight
                                                        className={`h-5 w-5 shrink-0 ${active
                                                                ? "text-white"
                                                                : "text-slate-400"
                                                            }`}
                                                    />
                                                </div>

                                                <div className="mt-4 grid grid-cols-3 gap-2">
                                                    <div
                                                        className={`rounded-xl px-3 py-2 text-center text-xs ${active
                                                                ? "bg-white/10 text-white"
                                                                : "bg-slate-50 text-slate-700"
                                                            }`}
                                                    >
                                                        <p className="opacity-80">Tổng đơn</p>
                                                        <p className="mt-1 font-bold">
                                                            {formatNumber(item.totalOrders)}
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={`rounded-xl px-3 py-2 text-center text-xs ${active
                                                                ? "bg-white/10 text-white"
                                                                : "bg-slate-50 text-slate-700"
                                                            }`}
                                                    >
                                                        <p className="opacity-80">Hoàn tất</p>
                                                        <p className="mt-1 font-bold">
                                                            {formatNumber(item.completedOrders)}
                                                        </p>
                                                    </div>

                                                    <div
                                                        className={`rounded-xl px-3 py-2 text-center text-xs ${active
                                                                ? "bg-white/10 text-white"
                                                                : "bg-slate-50 text-slate-700"
                                                            }`}
                                                    >
                                                        <p className="opacity-80">Loại giao</p>
                                                        <p className="mt-1 font-bold">
                                                            {item.deliveryType || "--"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-500">
                                    Hiển thị{" "}
                                    <span className="font-semibold text-slate-900">
                                        {groupItems.length}
                                    </span>{" "}
                                    /{" "}
                                    <span className="font-semibold text-slate-900">
                                        {totalResult}
                                    </span>{" "}
                                    nhóm giao
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
                        </SectionCard>
                    </div>

                    <div className="xl:col-span-3">
                        <SectionCard
                            title="Chi tiết nhóm giao"
                            description="Xem đơn hàng, người giao và thao tác xử lý."
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
                                    Chọn một nhóm giao ở cột bên trái để xem chi tiết.
                                </div>
                            )}
                        </SectionCard>
                    </div>
                </div>
            ) : null}

            {activeTab === "history" ? (
                <SectionCard
                    title="Lịch sử giao hàng"
                    description="Theo dõi kết quả giao hàng đã diễn ra."
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
                            Chưa có lịch sử giao hàng phù hợp.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-left text-sm text-slate-500">
                                        <th className="px-4 py-2 font-medium">Mã giao</th>
                                        <th className="px-4 py-2 font-medium">Mã đơn</th>
                                        <th className="px-4 py-2 font-medium">Nhân sự giao</th>
                                        <th className="px-4 py-2 font-medium">Trạng thái</th>
                                        <th className="px-4 py-2 font-medium">Lý do lỗi</th>
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
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(item.status)}`}
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
                            Tổng bản ghi:{" "}
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
                </SectionCard>
            ) : null}

            {activeTab === "stats" ? (
                <SectionCard
                    title="Hiệu suất delivery staff"
                    description="Tổng hợp hiệu suất giao hàng theo từng nhân sự."
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
                            Chưa có thống kê giao hàng.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {statsItems.map((item) => (
                                <div
                                    key={item.deliveryStaffId}
                                    className="rounded-3xl border border-slate-200 p-5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="rounded-2xl bg-slate-100 p-3">
                                                    <UserRound className="h-5 w-5 text-slate-700" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900">
                                                        {item.deliveryStaffName || "--"}
                                                    </h3>
                                                    <p className="text-sm text-slate-500">
                                                        ID: {item.deliveryStaffId}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                                            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                                                Completion Rate
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
                                            <p className="text-sm text-slate-500">Thành công</p>
                                            <p className="mt-1 text-lg font-bold text-emerald-700">
                                                {formatNumber(item.completedOrders)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                            <p className="text-sm text-slate-500">Thất bại</p>
                                            <p className="mt-1 text-lg font-bold text-rose-700">
                                                {formatNumber(item.failedOrders)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                            <p className="text-sm text-slate-500">Đang chờ</p>
                                            <p className="mt-1 text-lg font-bold text-amber-700">
                                                {formatNumber(item.pendingOrders)}
                                            </p>
                                        </div>

                                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                            <p className="text-sm text-slate-500">Đang giao</p>
                                            <p className="mt-1 text-lg font-bold text-violet-700">
                                                {formatNumber(item.inTransitOrders)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                        <span className="font-medium text-slate-900">
                                            Giao gần nhất:
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
