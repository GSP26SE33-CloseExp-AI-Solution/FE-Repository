import {
    Building2,
    CheckCircle2,
    Copy,
    MapPin,
    MapPinned,
    Search,
    XCircle,
} from "lucide-react"

import type {
    AdminOrder,
    PendingSupermarketApplication,
} from "@/types/admin.type"

import {
    cn,
    formatCompactNumber,
    formatDateTime,
    hasCoordinates,
} from "./adminSupermarkets.utils"

type ApplicationListProps = {
    loading: boolean
    applications: PendingSupermarketApplication[]
    copiedCode: string
    checkingOrdersId: string
    approvingId: string
    rejectingId: string
    openRejectId: string
    rejectNote: string
    blockingOrdersMap: Record<string, AdminOrder[]>
    onCopyCode: (code: string) => void | Promise<void>
    onOpenMap: (item: { latitude?: number | null; longitude?: number | null }) => void
    onCheckBlockingOrders: (application: PendingSupermarketApplication) => void | Promise<void>
    onApprove: (application: PendingSupermarketApplication) => void | Promise<void>
    onOpenReject: (application: PendingSupermarketApplication) => void
    onCloseReject: () => void
    onRejectNoteChange: (value: string) => void
    onReject: (application: PendingSupermarketApplication) => void | Promise<void>
}

const ApplicationList = ({
    loading,
    applications,
    copiedCode,
    checkingOrdersId,
    approvingId,
    rejectingId,
    openRejectId,
    rejectNote,
    blockingOrdersMap,
    onCopyCode,
    onOpenMap,
    onCheckBlockingOrders,
    onApprove,
    onOpenReject,
    onCloseReject,
    onRejectNoteChange,
    onReject,
}: ApplicationListProps) => {
    if (loading) {
        return (
            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-sm">
                Đang tải danh sách hồ sơ đối tác...
            </div>
        )
    }

    if (applications.length === 0) {
        return (
            <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500 shadow-sm">
                Hiện chưa có hồ sơ đối tác phù hợp với bộ lọc đang chọn.
            </div>
        )
    }

    return (
        <section className="space-y-4">
            {applications.map((item) => {
                const blockingOrders = blockingOrdersMap[item.applicantUserId] ?? []
                const blocked = blockingOrders.length > 0
                const hasCheckedOrders = Object.prototype.hasOwnProperty.call(
                    blockingOrdersMap,
                    item.applicantUserId
                )
                const isChecking = checkingOrdersId === item.supermarketId
                const isApproving = approvingId === item.supermarketId
                const isRejecting = rejectingId === item.supermarketId
                const isRejectPanelOpen = openRejectId === item.supermarketId

                return (
                    <article
                        key={item.supermarketId}
                        className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
                    >
                        <div className="border-b border-slate-100 px-5 py-5 lg:px-6">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
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
                                                Gửi lúc: {formatDateTime(item.submittedAt || item.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 xl:justify-end">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onCopyCode(item.applicationReference || item.supermarketId)
                                        }
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                    >
                                        <Copy className="h-4 w-4" />
                                        {copiedCode ===
                                            (item.applicationReference || item.supermarketId)
                                            ? "Đã sao chép"
                                            : "Sao chép mã"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onOpenMap(item)}
                                        disabled={!hasCoordinates(item)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                            Liên hệ đại diện
                                        </p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900">
                                            {item.contactPhone || "--"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-700">
                                            {item.contactEmail || "--"}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
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
                                                Tọa độ:{" "}
                                                {hasCoordinates(item)
                                                    ? `${item.latitude}, ${item.longitude}`
                                                    : "--"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {blocked ? (
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                        <p className="text-sm font-semibold text-amber-900">
                                            Cần hoàn tất đơn mua trước khi phê duyệt
                                        </p>
                                        <p className="mt-1 text-sm leading-6 text-amber-700">
                                            Tài khoản này hiện còn{" "}
                                            {formatCompactNumber(blockingOrders.length)} đơn mua chưa hoàn tất.
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
                                                        {formatDateTime(order.orderDate || order.createdAt)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                {isRejectPanelOpen ? (
                                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                                        <p className="text-sm font-semibold text-rose-900">
                                            Ghi rõ lý do để người nộp hồ sơ dễ theo dõi
                                        </p>

                                        <textarea
                                            value={rejectNote}
                                            onChange={(e) => onRejectNoteChange(e.target.value)}
                                            rows={4}
                                            placeholder="Ví dụ: Hồ sơ liên hệ chưa đầy đủ, cần bổ sung thông tin pháp lý hoặc xác minh lại địa chỉ..."
                                            className="mt-3 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-rose-300"
                                        />

                                        <div className="mt-3 flex flex-wrap justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={onCloseReject}
                                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                            >
                                                Đóng lại
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void onReject(item)}
                                                disabled={isRejecting}
                                                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {isRejecting ? "Đang xử lý..." : "Xác nhận từ chối"}
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <aside className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:p-5">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                        Hành động đề xuất
                                    </p>
                                    <h3 className="mt-2 text-base font-semibold text-slate-900">
                                        Ra quyết định cho hồ sơ này
                                    </h3>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">
                                        Kiểm tra điều kiện trước, sau đó chọn phê duyệt hoặc từ chối.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => void onCheckBlockingOrders(item)}
                                        disabled={isChecking}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Search className="h-4 w-4" />
                                        {isChecking
                                            ? "Đang kiểm tra đơn mua..."
                                            : "Kiểm tra đơn mua đang mở"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => void onApprove(item)}
                                        disabled={isApproving || blocked}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        {isApproving
                                            ? "Đang phê duyệt..."
                                            : "Phê duyệt trở thành đối tác"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onOpenReject(item)}
                                        disabled={isRejecting}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Từ chối hồ sơ
                                    </button>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <p className="text-sm font-semibold text-slate-900">
                                        Tình trạng rà soát
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">
                                        {hasCheckedOrders
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
            })}
        </section>
    )
}

export default ApplicationList
