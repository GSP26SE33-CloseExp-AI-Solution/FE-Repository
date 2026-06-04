import { useEffect, useMemo, useState } from "react";
import {
	RefreshCcw,
	Banknote,
	Clock,
	CheckCircle2,
	XCircle,
	CircleDollarSign,
	Package,
	Mail,
	Phone,
	User,
	ArrowRight,
	ShoppingBag,
} from "lucide-react";

import { refundService } from "@/services/refund.service";
import type {
	AdminRefundOrderDetail,
	AdminRefundOrderSummary,
	RefundListItem,
	RefundStatus,
} from "@/types/refund.types";
import { showSuccess, showError } from "@/utils/toast";

const PAGE_SIZE = 10;

const cn = (...classes: Array<string | false | null | undefined>) =>
	classes.filter(Boolean).join(" ");

const formatDateTime = (value?: string | null) => {
	if (!value) return "--";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "--";
	return new Intl.DateTimeFormat("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(date);
};

const formatCurrency = (amount: number) =>
	new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND",
	}).format(amount);

const STATUS_CONFIG: Record<
	RefundStatus,
	{ label: string; bg: string; text: string }
> = {
	Pending: { label: "Chờ duyệt", bg: "bg-amber-50", text: "text-amber-700" },
	Approved: { label: "Đã duyệt", bg: "bg-blue-50", text: "text-blue-700" },
	Rejected: { label: "Từ chối", bg: "bg-rose-50", text: "text-rose-700" },
	Completed: { label: "Hoàn tất", bg: "bg-emerald-50", text: "text-emerald-700" },
};

const getStatusBadge = (status: RefundStatus) => {
	const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
				config.bg,
				config.text
			)}
		>
			{status === "Pending" && <Clock className="h-3 w-3" />}
			{status === "Approved" && <CheckCircle2 className="h-3 w-3" />}
			{status === "Rejected" && <XCircle className="h-3 w-3" />}
			{status === "Completed" && <CircleDollarSign className="h-3 w-3" />}
			{config.label}
		</span>
	);
};

const NEXT_STATUS_MAP: Partial<Record<RefundStatus, RefundStatus[]>> = {
	Pending: ["Approved", "Rejected"],
	Approved: ["Completed", "Rejected"],
	Rejected: [],
	Completed: [],
};

const AdminRefunds = () => {
	const [orders, setOrders] = useState<AdminRefundOrderSummary[]>([]);
	const [detail, setDetail] = useState<AdminRefundOrderDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [detailLoading, setDetailLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState("");

	const [page, setPage] = useState(1);
	const [totalResult, setTotalResult] = useState(0);
	const [statusFilter, setStatusFilter] = useState("");

	const [selectedOrderId, setSelectedOrderId] = useState("");
	const [updatingRefundId, setUpdatingRefundId] = useState("");

	const loadOrders = async (isRefresh = false) => {
		try {
			if (isRefresh) setRefreshing(true);
			else setLoading(true);
			setError("");

			const result = await refundService.listOrdersWithRefunds({
				pageNumber: page,
				pageSize: PAGE_SIZE,
			});

			setOrders(result.items);
			setTotalResult(result.totalResult);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Không thể tải danh sách đơn hoàn tiền";
			setError(message);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const loadOrderDetail = async (orderId: string) => {
		try {
			setDetailLoading(true);
			const data = await refundService.getOrderRefundDetail(orderId);
			setDetail(data);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Không thể tải chi tiết đơn hàng";
			showError(message);
			setDetail(null);
		} finally {
			setDetailLoading(false);
		}
	};

	useEffect(() => {
		void loadOrders();
	}, [page]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!selectedOrderId) {
			setDetail(null);
			return;
		}
		void loadOrderDetail(selectedOrderId);
	}, [selectedOrderId]);

	const filteredOrders = useMemo(() => {
		if (!statusFilter) return orders;
		return orders.filter((o) => o.primaryRefundStatus === statusFilter);
	}, [orders, statusFilter]);

	const handleSelectOrder = (orderId: string) => {
		setSelectedOrderId(orderId);
	};

	const handleUpdateRefundStatus = async (
		refund: RefundListItem,
		newStatus: RefundStatus
	) => {
		const confirmMsg =
			newStatus === "Approved"
				? "Bạn có chắc muốn duyệt yêu cầu hoàn tiền này?"
				: newStatus === "Rejected"
					? "Bạn có chắc muốn từ chối yêu cầu hoàn tiền này?"
					: newStatus === "Completed"
						? "Bạn có chắc muốn đánh dấu hoàn tất yêu cầu này?"
						: "Bạn có chắc muốn thay đổi trạng thái?";

		if (!window.confirm(confirmMsg)) return;

		try {
			setUpdatingRefundId(refund.refundId);
			await refundService.updateStatus(refund.refundId, newStatus);
			showSuccess(`Đã cập nhật trạng thái thành ${STATUS_CONFIG[newStatus].label}`);
			if (selectedOrderId) {
				await loadOrderDetail(selectedOrderId);
			}
			void loadOrders(true);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Cập nhật trạng thái thất bại";
			showError(message);
		} finally {
			setUpdatingRefundId("");
		}
	};

	const totalPages = Math.max(1, Math.ceil(totalResult / PAGE_SIZE));

	const stats = useMemo(() => {
		const pending = orders.filter((o) => o.primaryRefundStatus === "Pending").length;
		const pendingAmount = orders.reduce((s, o) => s + o.pendingRefundAmount, 0);
		const totalRefund = orders.reduce((s, o) => s + o.totalRefundAmount, 0);
		return { pending, pendingAmount, totalRefund, orderCount: totalResult };
	}, [orders, totalResult]);

	const feeRefundEstimate = useMemo(() => {
		if (!detail) return 0;
		const itemsTotal = detail.items
			.filter((i) => i.isRefunded)
			.reduce((s, i) => s + (i.lineRefundAmount ?? i.totalPrice), 0);
		return Math.max(0, detail.totalRefundAmount - itemsTotal);
	}, [detail]);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Quản lý hoàn tiền</h1>
					<p className="mt-1 text-sm text-slate-500">
						Theo dõi theo đơn hàng — xem toàn bộ sản phẩm và số tiền cần hoàn
					</p>
				</div>
				<button
					type="button"
					onClick={() => void loadOrders(true)}
					disabled={refreshing}
					className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
				>
					<RefreshCcw className={cn("h-4 w-4", refreshing && "animate-spin")} />
					Làm mới
				</button>
			</div>

			{error && (
				<div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
					{error}
				</div>
			)}

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<p className="text-sm font-medium text-slate-500">Đơn có hoàn tiền</p>
					<h3 className="mt-2 text-2xl font-bold text-slate-900">{stats.orderCount}</h3>
				</div>
				<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<p className="text-sm font-medium text-slate-500">Chờ xử lý (trang này)</p>
					<h3 className="mt-2 text-2xl font-bold text-amber-600">{stats.pending}</h3>
				</div>
				<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<p className="text-sm font-medium text-slate-500">Tiền chờ hoàn (trang)</p>
					<h3 className="mt-2 text-lg font-bold text-rose-600">
						{formatCurrency(stats.pendingAmount)}
					</h3>
				</div>
			</div>

			<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<label className="text-sm font-medium text-slate-700">Lọc trạng thái:</label>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
					>
						<option value="">Tất cả</option>
						<option value="Pending">Chờ duyệt</option>
						<option value="Approved">Đã duyệt</option>
						<option value="Rejected">Từ chối</option>
						<option value="Completed">Hoàn tất</option>
					</select>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
				<div className="space-y-4 xl:col-span-2">
					{loading ? (
						<div className="space-y-3">
							{Array.from({ length: 4 }).map((_, i) => (
								<div
									key={i}
									className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
								/>
							))}
						</div>
					) : filteredOrders.length === 0 ? (
						<div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
							<Banknote className="mx-auto h-8 w-8 text-slate-400" />
							<p className="mt-3 text-sm text-slate-500">Không có đơn phù hợp</p>
						</div>
					) : (
						<div className="space-y-3">
							{filteredOrders.map((order) => {
								const isSelected = selectedOrderId === order.orderId;
								return (
									<button
										key={order.orderId}
										type="button"
										onClick={() => handleSelectOrder(order.orderId)}
										className={cn(
											"w-full rounded-2xl border p-4 text-left transition",
											isSelected
												? "border-slate-900 bg-slate-50 shadow-sm"
												: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
										)}
									>
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className="font-bold text-slate-900">{order.orderCode}</p>
												<p className="mt-1 text-sm text-slate-600">
													{order.customerFullName || "Khách hàng"}
												</p>
												<p className="text-xs text-slate-500">
													{order.refundCount} yêu cầu ·{" "}
													{formatDateTime(order.lastRefundAt)}
												</p>
											</div>
											{getStatusBadge(order.primaryRefundStatus)}
										</div>
										<div className="mt-3 flex flex-wrap gap-3 text-sm">
											<span className="font-semibold text-rose-700">
												Cần hoàn: {formatCurrency(order.pendingRefundAmount)}
											</span>
											<span className="text-slate-500">
												Tổng HT: {formatCurrency(order.totalRefundAmount)}
											</span>
										</div>
									</button>
								);
							})}
						</div>
					)}

					{!loading && filteredOrders.length > 0 && (
						<div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
							<button
								type="button"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
								className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
							>
								Trước
							</button>
							<span className="text-sm font-medium text-slate-600">
								{page} / {totalPages}
							</span>
							<button
								type="button"
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								disabled={page >= totalPages}
								className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
							>
								Sau
							</button>
						</div>
					)}
				</div>

				<div className="xl:col-span-3">
					{!selectedOrderId ? (
						<div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
							<ShoppingBag className="h-10 w-10 text-slate-400" />
							<p className="mt-4 text-sm font-medium text-slate-600">
								Chọn một đơn hàng để xem chi tiết sản phẩm và hoàn tiền
							</p>
						</div>
					) : detailLoading ? (
						<div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
					) : detail ? (
						<div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
							<div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
								<div>
									<h2 className="text-xl font-bold text-slate-900">
										{detail.orderCode}
									</h2>
									<p className="mt-1 text-sm text-slate-500">
										Trạng thái đơn: {detail.orderStatus}
									</p>
								</div>
								<div className="text-right">
									<p className="text-xs font-medium uppercase text-slate-500">
										Tổng cần hoàn (đơn)
									</p>
									<p className="text-xl font-bold text-rose-600">
										{formatCurrency(detail.pendingRefundAmount)}
									</p>
									<p className="mt-1 text-xs text-slate-500">
										Đã ghi nhận HT: {formatCurrency(detail.totalRefundAmount)}
									</p>
								</div>
							</div>

							<div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
								<p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
									Khách hàng
								</p>
								<div className="mt-3 grid gap-2 sm:grid-cols-3">
									<div className="flex items-center gap-2 text-sm">
										<User className="h-4 w-4 text-emerald-700" />
										{detail.customerFullName || "--"}
									</div>
									<div className="flex items-center gap-2 text-sm">
										<Mail className="h-4 w-4 text-emerald-700" />
										{detail.customerEmail ? (
											<a
												href={`mailto:${detail.customerEmail}`}
												className="text-emerald-800 hover:underline"
											>
												{detail.customerEmail}
											</a>
										) : (
											"--"
										)}
									</div>
									<div className="flex items-center gap-2 text-sm">
										<Phone className="h-4 w-4 text-emerald-700" />
										{detail.customerPhone ? (
											<a
												href={`tel:${detail.customerPhone}`}
												className="text-emerald-800 hover:underline"
											>
												{detail.customerPhone}
											</a>
										) : (
											"--"
										)}
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
								<div className="rounded-xl bg-slate-50 px-3 py-2">
									<p className="text-xs text-slate-500">Tiền hàng</p>
									<p className="font-semibold text-slate-900">
										{formatCurrency(detail.totalAmount)}
									</p>
								</div>
								<div className="rounded-xl bg-slate-50 px-3 py-2">
									<p className="text-xs text-slate-500">Phí giao</p>
									<p className="font-semibold text-slate-900">
										{formatCurrency(detail.deliveryFee)}
									</p>
								</div>
								<div className="rounded-xl bg-slate-50 px-3 py-2">
									<p className="text-xs text-slate-500">Phí hệ thống</p>
									<p className="font-semibold text-slate-900">
										{formatCurrency(detail.systemUsageFeeAmount)}
									</p>
								</div>
								<div className="rounded-xl bg-slate-50 px-3 py-2">
									<p className="text-xs text-slate-500">Thanh toán</p>
									<p className="font-semibold text-slate-900">
										{formatCurrency(detail.orderFinalAmount)}
									</p>
								</div>
							</div>

							{feeRefundEstimate > 0 && (
								<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
									Phần hoàn phí (ước tính từ yêu cầu hoàn tiền):{" "}
									<span className="font-bold">{formatCurrency(feeRefundEstimate)}</span>
								</div>
							)}

							<div>
								<h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
									<Package className="h-4 w-4" />
									Tất cả sản phẩm trong đơn
								</h3>
								<div className="overflow-hidden rounded-2xl border border-slate-200">
									<table className="w-full text-left text-sm">
										<thead className="bg-slate-50 text-xs uppercase text-slate-500">
											<tr>
												<th className="px-4 py-3">Sản phẩm</th>
												<th className="px-4 py-3">Siêu thị</th>
												<th className="px-4 py-3">SL</th>
												<th className="px-4 py-3">Thành tiền</th>
												<th className="px-4 py-3">Hoàn tiền</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-slate-100">
											{detail.items.map((item) => (
												<tr
													key={item.orderItemId}
													className={cn(
														item.isRefunded ? "bg-rose-50/50" : "bg-white"
													)}
												>
													<td className="px-4 py-3">
														<p className="font-medium text-slate-900">
															{item.productName || "--"}
														</p>
														<p className="text-xs text-slate-500">
															ĐG: {formatCurrency(item.unitPrice)}
														</p>
													</td>
													<td className="px-4 py-3 text-slate-600">
														{item.supermarketName || "--"}
													</td>
													<td className="px-4 py-3">{item.quantity}</td>
													<td className="px-4 py-3 font-medium">
														{formatCurrency(item.totalPrice)}
													</td>
													<td className="px-4 py-3">
														{item.isRefunded ? (
															<div className="space-y-1">
																<span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
																	Có hoàn tiền
																</span>
																{item.refundStatus &&
																	getStatusBadge(item.refundStatus)}
																{item.lineRefundAmount != null && (
																	<p className="text-xs font-semibold text-rose-700">
																		{formatCurrency(item.lineRefundAmount)}
																	</p>
																)}
															</div>
														) : (
															<span className="text-xs text-slate-400">
																Không hoàn
															</span>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>

							<div>
								<h3 className="mb-3 text-sm font-bold text-slate-800">
									Yêu cầu hoàn tiền ({detail.refunds.length})
								</h3>
								<div className="space-y-4">
									{detail.refunds.map((refund) => (
										<div
											key={refund.refundId}
											className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
										>
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div>
													<p className="font-mono text-xs text-slate-500">
														{refund.refundId.slice(0, 8)}...
													</p>
													<p className="mt-1 text-lg font-bold text-slate-900">
														{formatCurrency(refund.amount)}
													</p>
													<p className="mt-1 text-sm text-slate-600">
														{refund.reason}
													</p>
													<p className="mt-1 text-xs text-slate-500">
														{formatDateTime(refund.createdAt)}
														{refund.isFullOrderRefund
															? " · Hoàn cả đơn (gồm phí)"
															: refund.refundedOrderItemIds?.length
																? ` · ${refund.refundedOrderItemIds.length} dòng hàng`
																: ""}
													</p>
												</div>
												{getStatusBadge(refund.status)}
											</div>

											{NEXT_STATUS_MAP[refund.status]?.length ? (
												<div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
													{NEXT_STATUS_MAP[refund.status]?.map((nextStatus) => {
														const config = STATUS_CONFIG[nextStatus];
														return (
															<button
																key={nextStatus}
																type="button"
																onClick={() =>
																	void handleUpdateRefundStatus(
																		refund,
																		nextStatus
																	)
																}
																disabled={updatingRefundId === refund.refundId}
																className={cn(
																	"inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:opacity-50",
																	nextStatus === "Approved" &&
																		"border-blue-200 bg-blue-50 text-blue-700",
																	nextStatus === "Rejected" &&
																		"border-rose-200 bg-rose-50 text-rose-700",
																	nextStatus === "Completed" &&
																		"border-emerald-200 bg-emerald-50 text-emerald-700"
																)}
															>
																<ArrowRight className="h-3 w-3" />
																{config.label}
															</button>
														);
													})}
												</div>
											) : null}
										</div>
									))}
								</div>
							</div>
						</div>
					) : (
						<div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm text-rose-700">
							Không tải được chi tiết đơn hàng
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default AdminRefunds;
