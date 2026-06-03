import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CheckCircle2,
    ChevronRight,
    Loader2,
    PackageCheck,
    PackageOpen,
    RefreshCcw,
    Search,
    ShoppingBag,
    Store,
    Truck,
    UserRound,
    XCircle,
    Clock3,
} from "lucide-react";

import { packagingService } from "@/services/packaging.service";
import type {
    PackagingOrderItem,
    PackagingOrderSummary,
} from "@/types/packaging.type";
import { showError } from "@/utils/toast";

import {
    cn,
    currency,
    formatDateTime,
    getDeliveryTypeLabel,
    getFriendlyPackagingErrorMessage,
    getOrderStatusLabel,
    getPackagingActionLabel,
    getPackagingActionRoute,
    getPackagingProgress,
    getPackagingProgressClass,
    getPackagingStatusClass,
    getPackagingStepText,
    resolvePackagingOrderActionPhase,
    sortOrdersByDeliverySlot,
} from "./packagingShared";

const PackageOrders = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState<PackagingOrderSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalResult, setTotalResult] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [supermarketFilter, setSupermarketFilter] = useState("");
    const [orderSupermarketNames, setOrderSupermarketNames] = useState<
        Record<string, string>
    >({});
    const [orderItemsById, setOrderItemsById] = useState<
        Record<string, PackagingOrderItem[]>
    >({});

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(totalResult / pageSize));
    }, [pageSize, totalResult]);

    const sortedOrders = useMemo(
        () => sortOrdersByDeliverySlot(orders),
        [orders],
    );

    const getOrderSupermarketName = useCallback(
        (orderId: string) =>
            orderSupermarketNames[orderId] || "Đang tải siêu thị...",
        [orderSupermarketNames],
    );

    const supermarketOptions = useMemo(() => {
        const names = Object.values(orderSupermarketNames)
            .flatMap((name) => name.split(","))
            .map((name) => name.trim())
            .filter(
                (name) =>
                    name &&
                    name !== "Đang tải siêu thị..." &&
                    name !== "Chưa có siêu thị" &&
                    name !== "Không tải được siêu thị",
            );

        return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "vi"));
    }, [orderSupermarketNames]);

    const filteredOrders = useMemo(() => {
        const q = keyword.trim().toLowerCase();
        const selectedSupermarket = supermarketFilter.trim().toLowerCase();

        return sortedOrders.filter((item) => {
            const supermarketName = getOrderSupermarketName(item.orderId);
            const matchesSupermarket = selectedSupermarket
                ? supermarketName.toLowerCase().includes(selectedSupermarket)
                : true;

            const matchesKeyword = q
                ? item.orderCode?.toLowerCase().includes(q) ||
                item.customerName?.toLowerCase().includes(q) ||
                item.deliveryType?.toLowerCase().includes(q) ||
                item.timeSlotDisplay?.toLowerCase().includes(q) ||
                item.packagingStatus?.toLowerCase().includes(q) ||
                item.orderStatus?.toLowerCase().includes(q) ||
                supermarketName.toLowerCase().includes(q)
                : true;

            return matchesSupermarket && matchesKeyword;
        });
    }, [sortedOrders, keyword, supermarketFilter, getOrderSupermarketName]);

    const stats = useMemo(() => {
        return filteredOrders.reduce(
            (result, order) => {
                const items = orderItemsById[order.orderId];
                const phase = resolvePackagingOrderActionPhase(
                    order.packagingStatus,
                    order.orderStatus,
                    items,
                );

                if (phase === "collect") result.pending += 1;
                else if (phase === "packing") result.packaging += 1;
                else if (phase === "view") result.completed += 1;

                const hasFailedLine =
                    items?.some(
                        (item) =>
                            String(item.packagingStatus ?? "")
                                .toLowerCase()
                                .trim() === "failed",
                    ) ?? false;

                if (hasFailedLine) result.failed += 1;

                return result;
            },
            {
                pending: 0,
                packaging: 0,
                completed: 0,
                failed: 0,
            },
        );
    }, [filteredOrders, orderItemsById]);

    const fetchOrders = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) setRefreshing(true);
                else setLoading(true);

                const response = await packagingService.getPendingOrders(
                    page,
                    pageSize,
                );
                const nextOrders = response.data?.items || [];

                setOrders(nextOrders);
                setTotalResult(response.data?.totalResult || 0);

                if (nextOrders.length === 0) {
                    setOrderSupermarketNames({});
                    setOrderItemsById({});
                    return;
                }

                const detailResults = await Promise.allSettled(
                    nextOrders.map(async (order) => {
                        const detailResponse = await packagingService.getOrderDetail(
                            order.orderId,
                        );
                        const items = detailResponse.data?.items || [];
                        const supermarketNames = Array.from(
                            new Set(
                                items
                                    .map((item) => item.supermarketName?.trim())
                                    .filter(Boolean),
                            ),
                        );

                        return {
                            orderId: order.orderId,
                            supermarketName:
                                supermarketNames.length > 0
                                    ? supermarketNames.join(", ")
                                    : "Chưa có siêu thị",
                            items,
                        };
                    }),
                );

                const nextSupermarketNames: Record<string, string> = {};
                const nextItemsById: Record<string, PackagingOrderItem[]> = {};

                detailResults.forEach((detailResult, index) => {
                    const orderId = nextOrders[index]?.orderId;
                    if (!orderId) return;

                    if (detailResult.status === "fulfilled") {
                        const { supermarketName, items } = detailResult.value;
                        nextSupermarketNames[orderId] = supermarketName;
                        nextItemsById[orderId] = items;
                    } else {
                        nextSupermarketNames[orderId] = "Không tải được siêu thị";
                        nextItemsById[orderId] = [];
                    }
                });

                setOrderSupermarketNames(nextSupermarketNames);
                setOrderItemsById(nextItemsById);
            } catch (error: any) {
                console.error("PackageOrders.fetchOrders error:", {
                    error,
                    status: error?.response?.status,
                    responseData: error?.response?.data,
                });

                showError(
                    getFriendlyPackagingErrorMessage(
                        error,
                        "Không tải được danh sách đơn đóng gói.",
                    ),
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [page, pageSize],
    );

    useEffect(() => {
        void fetchOrders();
    }, [fetchOrders]);

    return (
        <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-sky-700 ring-1 ring-sky-100">
                            <PackageCheck className="h-3.5 w-3.5" />
                            Bàn làm việc đóng gói
                        </div>

                        <h1 className="mt-3 text-2xl font-medium text-slate-900 lg:text-3xl">
                            Đơn cần xử lý hôm nay
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Xử lý từ trên xuống theo khung giờ giao gần nhất. Mỗi đơn chỉ có
                            một nút thao tác chính để tránh bấm nhầm bước.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[560px]">
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-amber-700">Chờ gom</p>
                                <PackageOpen className="h-4 w-4 text-amber-600" />
                            </div>
                            <p className="mt-2 text-2xl font-semibold text-slate-800">
                                {stats.pending}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-sky-700">Đang làm</p>
                                <ShoppingBag className="h-4 w-4 text-sky-600" />
                            </div>
                            <p className="mt-2 text-2xl font-semibold text-slate-800">
                                {stats.packaging}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-emerald-700">
                                    Đã xong
                                </p>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <p className="mt-2 text-2xl font-semibold text-slate-800">
                                {stats.completed}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-rose-700">Có lỗi</p>
                                <XCircle className="h-4 w-4 text-rose-600" />
                            </div>
                            <p className="mt-2 text-2xl font-semibold text-slate-800">
                                {stats.failed}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 lg:grid-cols-[minmax(0,1fr)_260px_auto] lg:items-end">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="Tìm mã đơn, khách hàng, siêu thị, khung giờ, trạng thái..."
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-50"
                        />
                    </div>

                    <label className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-500">
                            Lọc theo siêu thị
                        </span>
                        <select
                            value={supermarketFilter}
                            onChange={(e) => setSupermarketFilter(e.target.value)}
                            disabled={supermarketOptions.length === 0}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <option value="">Tất cả siêu thị</option>
                            {supermarketOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="button"
                        onClick={() => void fetchOrders(true)}
                        disabled={refreshing}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
                    >
                        <RefreshCcw
                            className={cn("h-4 w-4", refreshing && "animate-spin")}
                        />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="hidden grid-cols-[72px_1.05fr_1fr_0.95fr_0.75fr_0.65fr_0.85fr_150px] items-center gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-[0.08em] text-slate-500 xl:grid">
                    <div>Ưu tiên</div>
                    <div>Đơn hàng</div>
                    <div>Khách hàng</div>
                    <div>Siêu thị</div>
                    <div>Khung giờ</div>
                    <div>Số món</div>
                    <div>Trạng thái</div>
                    <div className="text-right">Thao tác</div>
                </div>

                {loading ? (
                    <div className="flex min-h-[260px] items-center justify-center">
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Đang tải danh sách đơn...
                        </div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                            <PackageCheck className="h-7 w-7 text-slate-500" />
                        </div>
                        <h2 className="mt-4 text-lg font-medium text-slate-900">
                            Không có đơn cần hiển thị
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Thử đổi từ khóa, bộ lọc siêu thị hoặc bấm làm mới để lấy dữ liệu
                            mới nhất.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredOrders.map((order, index) => {
                            const isFirst = index === 0;
                            const orderItems = orderItemsById[order.orderId];
                            const actionPhase = resolvePackagingOrderActionPhase(
                                order.packagingStatus,
                                order.orderStatus,
                                orderItems,
                            );
                            const progress = getPackagingProgress(
                                order.packagingStatus,
                                order.orderStatus,
                                orderItems,
                            );
                            const actionRoute = getPackagingActionRoute(
                                order.orderId,
                                order.packagingStatus,
                                order.orderStatus,
                                orderItems,
                            );
                            const actionLabel = getPackagingActionLabel(
                                order.packagingStatus,
                                order.orderStatus,
                                orderItems,
                            );

                            return (
                                <div
                                    key={order.orderId}
                                    className={cn(
                                        "px-5 py-4 transition hover:bg-slate-50",
                                        isFirst && "bg-sky-50/40",
                                    )}
                                >
                                    <div className="hidden grid-cols-[72px_1.05fr_1fr_0.95fr_0.75fr_0.65fr_0.85fr_150px] items-center gap-4 xl:grid">
                                        <div>
                                            <div
                                                className={cn(
                                                    "flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold",
                                                    isFirst
                                                        ? "bg-sky-600 text-white"
                                                        : "bg-slate-100 text-slate-700",
                                                )}
                                            >
                                                {index + 1}
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                    {order.orderCode}
                                                </p>
                                                {isFirst ? (
                                                    <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[11px] font-medium text-white">
                                                        Làm trước
                                                    </span>
                                                ) : null}
                                            </div>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {formatDateTime(order.orderDate)}
                                            </p>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                                                <p className="truncate text-sm font-semibold text-slate-800">
                                                    {order.customerName || "--"}
                                                </p>
                                            </div>

                                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                                <Truck className="h-3.5 w-3.5" />
                                                {getDeliveryTypeLabel(order.deliveryType)}
                                            </div>
                                        </div>

                                        <div className="min-w-0">
                                            <div className="inline-flex max-w-full items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                                <Store className="h-4 w-4 shrink-0" />
                                                <span className="truncate">
                                                    {getOrderSupermarketName(order.orderId)}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900">
                                                <Clock3 className="h-4 w-4 text-sky-600" />
                                                {order.timeSlotDisplay || "--"}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {order.totalItems ?? 0} món
                                            </p>
                                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                                {currency.format(order.finalAmount || 0)}
                                            </p>
                                        </div>

                                        <div>
                                            <div className="flex flex-wrap gap-1.5">
                                                <span
                                                    className={cn(
                                                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                                                        getPackagingStatusClass(
                                                            order.packagingStatus,
                                                            order.orderStatus,
                                                            orderItems,
                                                        ),
                                                    )}
                                                >
                                                    {getPackagingStepText(
                                                        order.packagingStatus,
                                                        order.orderStatus,
                                                        orderItems,
                                                    )}
                                                </span>

                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                    {getOrderStatusLabel(order.orderStatus)}
                                                </span>
                                            </div>

                                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full",
                                                        getPackagingProgressClass(
                                                            order.packagingStatus,
                                                            order.orderStatus,
                                                            orderItems,
                                                        ),
                                                    )}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            {actionPhase === "view" ? (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(actionRoute)}
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    {actionLabel}
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(actionRoute)}
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-sky-700"
                                                >
                                                    {actionLabel}
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="xl:hidden">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                                                            isFirst
                                                                ? "bg-sky-600 text-white"
                                                                : "bg-slate-900 text-white",
                                                        )}
                                                    >
                                                        #{index + 1}
                                                    </span>

                                                    {isFirst ? (
                                                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-100">
                                                            Làm trước
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <h3 className="mt-2 truncate text-base font-semibold text-slate-800">
                                                    {order.orderCode}
                                                </h3>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {formatDateTime(order.orderDate)}
                                                </p>
                                            </div>

                                            <span
                                                className={cn(
                                                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                                                    getPackagingStatusClass(
                                                        order.packagingStatus,
                                                        order.orderStatus,
                                                        orderItems,
                                                    ),
                                                )}
                                            >
                                                {getPackagingStepText(
                                                    order.packagingStatus,
                                                    order.orderStatus,
                                                    orderItems,
                                                )}
                                            </span>
                                        </div>

                                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                            <div className="rounded-2xl bg-slate-50 px-3 py-2">
                                                <p className="text-xs text-slate-500">Khách hàng</p>
                                                <p className="mt-1 truncate text-sm font-medium text-slate-900">
                                                    {order.customerName || "--"}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
                                                <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                                    <Store className="h-3.5 w-3.5" />
                                                    Siêu thị
                                                </p>
                                                <p className="mt-1 truncate text-sm font-semibold text-emerald-800">
                                                    {getOrderSupermarketName(order.orderId)}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl bg-slate-50 px-3 py-2">
                                                <p className="text-xs text-slate-500">Khung giờ</p>
                                                <p className="mt-1 text-sm font-medium text-slate-900">
                                                    {order.timeSlotDisplay || "--"}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl bg-slate-50 px-3 py-2">
                                                <p className="text-xs text-slate-500">Giao nhận</p>
                                                <p className="mt-1 text-sm font-medium text-slate-900">
                                                    {getDeliveryTypeLabel(order.deliveryType)}
                                                </p>
                                            </div>

                                            <div className="rounded-2xl bg-slate-50 px-3 py-2">
                                                <p className="text-xs text-slate-500">Số món / tiền</p>
                                                <p className="mt-1 text-sm font-medium text-slate-900">
                                                    {order.totalItems ?? 0} món ·{" "}
                                                    {currency.format(order.finalAmount || 0)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full",
                                                    getPackagingProgressClass(
                                                        order.packagingStatus,
                                                        order.orderStatus,
                                                        orderItems,
                                                    ),
                                                )}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => navigate(actionRoute)}
                                            className={cn(
                                                "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition",
                                                actionPhase === "view"
                                                    ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                                    : "bg-slate-900 text-white hover:bg-sky-700",
                                            )}
                                        >
                                            {actionLabel}
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row">
                <p className="text-sm text-slate-500">
                    Hiển thị{" "}
                    <span className="font-medium text-slate-900">
                        {filteredOrders.length}
                    </span>{" "}
                    đơn · Trang <span className="font-medium text-slate-900">{page}</span>{" "}
                    / <span className="font-medium text-slate-900">{totalPages}</span>
                    {supermarketFilter ? (
                        <>
                            {" "}
                            · Siêu thị:{" "}
                            <span className="font-medium text-slate-900">
                                {supermarketFilter}
                            </span>
                        </>
                    ) : null}
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={page <= 1}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    >
                        Trước
                    </button>

                    <button
                        type="button"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={page >= totalPages}
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                        Sau
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PackageOrders;
