import { useEffect, useMemo, useState } from "react"
import {
    CheckCircle2,
    Clock3,
    MessageSquare,
    RefreshCcw,
    Search,
    ShieldAlert,
    Star,
    Trash2,
    UserRound,
    XCircle,
} from "lucide-react"

import { adminService } from "@/services/admin.service"
import type { AdminApprovalRow, FeedbackItem } from "@/types/admin.type"

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

const renderStars = (rating?: number) => {
    const safeRating = Math.max(0, Math.min(5, rating ?? 0))

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
                const active = index < safeRating
                return (
                    <Star
                        key={index}
                        className={`h-4 w-4 ${active ? "fill-amber-400 text-amber-400" : "text-slate-300"
                            }`}
                    />
                )
            })}
        </div>
    )
}

const approvalStatusMap: Record<number, string> = {
    0: "Chờ duyệt",
    1: "Đã duyệt",
    2: "Từ chối",
}

const getApprovalStatusClass = (status?: number) => {
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

const StatCard = ({
    title,
    value,
    hint,
    icon: Icon,
}: {
    title: string
    value: string | number
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

const AdminModeration = () => {
    const [activeTab, setActiveTab] = useState<"approvals" | "feedbacks">("approvals")

    const [approvalItems, setApprovalItems] = useState<AdminApprovalRow[]>([])
    const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState("")
    const [actingId, setActingId] = useState("")
    const [deletingId, setDeletingId] = useState("")

    const [search, setSearch] = useState("")
    const [keyword, setKeyword] = useState("")
    const [ratingFilter, setRatingFilter] = useState("")

    const filteredApprovals = useMemo(() => {
        const normalized = keyword.trim().toLowerCase()

        return approvalItems.filter((item) => {
            if (!normalized) return true

            return Boolean(
                item.fullName?.toLowerCase().includes(normalized) ||
                item.email?.toLowerCase().includes(normalized) ||
                item.phone?.toLowerCase().includes(normalized) ||
                item.roleName?.toLowerCase().includes(normalized) ||
                item.supermarketName?.toLowerCase().includes(normalized) ||
                item.position?.toLowerCase().includes(normalized)
            )
        })
    }, [approvalItems, keyword])

    const filteredFeedbacks = useMemo(() => {
        const normalized = keyword.trim().toLowerCase()

        return feedbackItems.filter((item) => {
            const matchesKeyword =
                !normalized ||
                item.userName?.toLowerCase().includes(normalized) ||
                item.comment?.toLowerCase().includes(normalized) ||
                item.orderId?.toLowerCase().includes(normalized) ||
                item.feedbackId?.toLowerCase().includes(normalized)

            const matchesRating =
                !ratingFilter || String(item.rating ?? "") === ratingFilter

            return Boolean(matchesKeyword && matchesRating)
        })
    }, [feedbackItems, keyword, ratingFilter])

    const averageRating = useMemo(() => {
        if (!filteredFeedbacks.length) return 0
        const total = filteredFeedbacks.reduce((sum, item) => sum + (item.rating ?? 0), 0)
        return total / filteredFeedbacks.length
    }, [filteredFeedbacks])

    const loadApprovals = async () => {
        const response = await adminService.getApprovalRows({
            pageNumber: 1,
            pageSize: 100,
        })
        setApprovalItems(response.items ?? [])
    }

    const loadFeedbacks = async () => {
        const response = await adminService.getFeedbacks({
            pageNumber: 1,
            pageSize: 100,
        })
        setFeedbackItems(response.items ?? [])
    }

    const loadData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError("")

            await Promise.all([loadApprovals(), loadFeedbacks()])
        } catch (err: any) {
            setError(err?.response?.data?.message || "Không thể tải dữ liệu moderation.")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        void loadData()
    }, [])

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setKeyword(search.trim())
    }

    const handleApprove = async (userId: string) => {
        try {
            setActingId(userId)
            setError("")
            await adminService.approveUser(userId)
            await loadApprovals()
        } catch (err: any) {
            setError(err?.response?.data?.message || "Duyệt tài khoản thất bại.")
        } finally {
            setActingId("")
        }
    }

    const handleReject = async (userId: string) => {
        try {
            setActingId(userId)
            setError("")
            await adminService.rejectUser(userId)
            await loadApprovals()
        } catch (err: any) {
            setError(err?.response?.data?.message || "Từ chối tài khoản thất bại.")
        } finally {
            setActingId("")
        }
    }

    const handleDeleteFeedback = async (feedbackId: string) => {
        try {
            setDeletingId(feedbackId)
            setError("")
            await adminService.deleteFeedback(feedbackId)
            await loadFeedbacks()
        } catch (err: any) {
            setError(err?.response?.data?.message || "Xoá feedback thất bại.")
        } finally {
            setDeletingId("")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Moderation</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Quản lý các nội dung cần kiểm duyệt: tài khoản chờ duyệt và feedback từ
                        người dùng.
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
                    title="Chờ duyệt tài khoản"
                    value={approvalItems.length}
                    hint="Hồ sơ đang đợi admin xử lý"
                    icon={Clock3}
                />
                <StatCard
                    title="Feedback hiện có"
                    value={feedbackItems.length}
                    hint="Tổng feedback đang tải lên trang"
                    icon={MessageSquare}
                />
                <StatCard
                    title="Feedback sau lọc"
                    value={filteredFeedbacks.length}
                    hint="Theo keyword và rating hiện tại"
                    icon={ShieldAlert}
                />
                <StatCard
                    title="Điểm trung bình"
                    value={averageRating.toFixed(1)}
                    hint="Rating trung bình của feedback đang hiển thị"
                    icon={Star}
                />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab("approvals")}
                            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === "approvals"
                                    ? "bg-slate-900 text-white"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            Account Approvals
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("feedbacks")}
                            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${activeTab === "feedbacks"
                                    ? "bg-slate-900 text-white"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            Feedback Moderation
                        </button>
                    </div>

                    <form
                        onSubmit={handleSearch}
                        className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(280px,1fr)_180px_auto]"
                    >
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={
                                    activeTab === "approvals"
                                        ? "Tìm tên, email, số điện thoại, vai trò..."
                                        : "Tìm người dùng, nội dung, mã đơn..."
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                            />
                        </div>

                        {activeTab === "feedbacks" ? (
                            <select
                                value={ratingFilter}
                                onChange={(e) => setRatingFilter(e.target.value)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                            >
                                <option value="">Tất cả số sao</option>
                                <option value="5">5 sao</option>
                                <option value="4">4 sao</option>
                                <option value="3">3 sao</option>
                                <option value="2">2 sao</option>
                                <option value="1">1 sao</option>
                            </select>
                        ) : (
                            <div />
                        )}

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Tìm kiếm
                        </button>
                    </form>
                </div>
            </div>

            {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-48 animate-pulse rounded-3xl border border-slate-200 bg-slate-100"
                        />
                    ))}
                </div>
            ) : null}

            {!loading && activeTab === "approvals" ? (
                filteredApprovals.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                            <Clock3 className="h-7 w-7 text-slate-500" />
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                            Không có hồ sơ chờ duyệt
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Hiện chưa có tài khoản nào phù hợp với điều kiện lọc.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredApprovals.map((item) => {
                            const isActing = actingId === item.userId

                            return (
                                <div
                                    key={item.id}
                                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-lg font-bold text-slate-900">
                                                    {item.fullName}
                                                </h3>
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getApprovalStatusClass(
                                                        item.status
                                                    )}`}
                                                >
                                                    {approvalStatusMap[item.status] ??
                                                        "Không xác định"}
                                                </span>
                                            </div>

                                            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        Email
                                                    </p>
                                                    <p className="mt-1 break-all text-sm font-medium text-slate-900">
                                                        {item.email || "--"}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        Số điện thoại
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                                        {item.phone || "--"}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        Vai trò
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                                        {item.roleName || "--"}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        Siêu thị
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                                        {item.supermarketName || "--"}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        Chức vụ
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                                        {item.position || "--"}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        Ngày tạo
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                                        {formatDateTime(item.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-auto">
                                            <button
                                                type="button"
                                                onClick={() => void handleApprove(item.userId)}
                                                disabled={isActing}
                                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                {isActing ? "Đang xử lý..." : "Duyệt"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => void handleReject(item.userId)}
                                                disabled={isActing}
                                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                {isActing ? "Đang xử lý..." : "Từ chối"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            ) : null}

            {!loading && activeTab === "feedbacks" ? (
                filteredFeedbacks.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                            <MessageSquare className="h-7 w-7 text-slate-500" />
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                            Không có feedback phù hợp
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            Chưa tìm thấy phản hồi nào khớp với điều kiện hiện tại.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredFeedbacks.map((item) => {
                            const isDeleting = deletingId === item.feedbackId

                            return (
                                <div
                                    key={item.feedbackId}
                                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-lg font-bold text-slate-900">
                                                    {item.userName || "Người dùng ẩn danh"}
                                                </h3>
                                                <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1">
                                                    {renderStars(item.rating)}
                                                    <span className="text-xs font-semibold text-amber-700">
                                                        {item.rating ?? 0}/5
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        Feedback ID
                                                    </p>
                                                    <p className="mt-1 break-all text-sm font-medium text-slate-900">
                                                        {item.feedbackId || "--"}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        User ID
                                                    </p>
                                                    <p className="mt-1 break-all text-sm font-medium text-slate-900">
                                                        {item.userId || "--"}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        Order ID
                                                    </p>
                                                    <p className="mt-1 break-all text-sm font-medium text-slate-900">
                                                        {item.orderId || "--"}
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        Cập nhật lúc
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                                        {formatDateTime(item.updatedAt || item.createdAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                    Nội dung phản hồi
                                                </p>
                                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                                                    {item.comment || "Không có nội dung phản hồi."}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full shrink-0 lg:w-auto">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void handleDeleteFeedback(item.feedbackId)
                                                }
                                                disabled={isDeleting}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                {isDeleting ? "Đang xoá..." : "Xoá feedback"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            ) : null}
        </div>
    )
}

export default AdminModeration
