import { useEffect, useMemo, useState } from "react";
import {
	RefreshCcw,
	Banknote,
	Clock,
	CheckCircle2,
	XCircle,
	CircleDollarSign,
	Eye,
	ArrowRight,
} from "lucide-react";

import { refundService } from "@/services/refund.service";
import type { RefundListItem, RefundStatus } from "@/types/refund.types";
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
	const [items, setItems] = useState<RefundListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState("");

	const [page, setPage] = useState(1);
	const [totalResult, setTotalResult] = useState(0);
	const [statusFilter, setStatusFilter] = useState("");

	const [selectedId, setSelectedId] = useState("");
	const [updatingStatus, setUpdatingStatus] = useState(false);

	const loadRefunds = async (isRefresh = false) => {
		try {
			if (isRefresh) {
				setRefreshing(true);
			} else {
				setLoading(true);
			}
			setError("");

			const result = await refundService.listRefunds({
				pageNumber: page,
				pageSize: PAGE_SIZE,
			});

			setItems(result.items);
			setTotalResult(result.totalResult);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Không thể tải danh sách hoàn tiền";
			setError(message);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		void loadRefunds();
	}, [page]); // eslint-disable-line react-hooks/exhaustive-deps

	const filteredItems = useMemo(() => {
		if (!statusFilter) return items;
		return items.filter((item) => item.status === statusFilter);
	}, [items, statusFilter]);

	const selectedItem = useMemo(
		() => items.find((item) => item.refundId === selectedId) ?? null,
		[items, selectedId]
	);

	const handleUpdateStatus = async (newStatus: RefundStatus) => {
		if (!selectedItem) return;

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
			setUpdatingStatus(true);
			await refundService.updateStatus(selectedItem.refundId, newStatus);
			showSuccess(`Đã cập nhật trạng thái thành ${STATUS_CONFIG[newStatus].label}`);
			void loadRefunds(true);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Cập nhật trạng thái thất bại";
			showError(message);
		} finally {
			setUpdatingStatus(false);
		}
	};

	const totalPages = Math.max(1, Math.ceil(totalResult / PAGE_SIZE));

	const stats = useMemo(() => {
		const pending = items.filter((i) => i.status === "Pending").length;
		const approved = items.filter((i) => i.status === "Approved").length;
		const rejected = items.filter((i) => i.status === "Rejected").length;
		const completed = items.filter((i) => i.status === "Completed").length;
		const totalAmount = items.reduce((sum, i) => sum + i.amount, 0);
		return { pending, approved, rejected, completed, totalAmount };
	}, [items]);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">
						Quản lý hoàn tiền
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Duyệt và theo dõi các yêu cầu hoàn tiền từ khách hàng
					</p>
				</div>

				<button
					type="button"
					onClick={() => void loadRefunds(true)}
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

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
				<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-sm font-medium text-slate-500">Tổng yêu cầu</p>
							<h3 className="mt-2 text-2xl font-bold text-slate-900">
								{totalResult}
							</h3>
						</div>
						<div className="rounded-2xl bg-slate-100 p-3">
							<Banknote className="h-5 w-5 text-slate-700" />
						</div>
					</div>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-sm font-medium text-slate-500">Chờ duyệt</p>
							<h3 className="mt-2 text-2xl font-bold text-amber-600">
								{stats.pending}
							</h3>
						</div>
						<div className="rounded-2xl bg-amber-50 p-3">
							<Clock className="h-5 w-5 text-amber-600" />
						</div>
					</div>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-sm font-medium text-slate-500">Đã duyệt</p>
							<h3 className="mt-2 text-2xl font-bold text-blue-600">
								{stats.approved}
							</h3>
						</div>
						<div className="rounded-2xl bg-blue-50 p-3">
							<CheckCircle2 className="h-5 w-5 text-blue-600" />
						</div>
					</div>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-sm font-medium text-slate-500">Hoàn tất</p>
							<h3 className="mt-2 text-2xl font-bold text-emerald-600">
								{stats.completed}
							</h3>
						</div>
						<div className="rounded-2xl bg-emerald-50 p-3">
							<CircleDollarSign className="h-5 w-5 text-emerald-600" />
						</div>
					</div>
				</div>

				<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-sm font-medium text-slate-500">Tổng tiền</p>
							<h3 className="mt-2 text-lg font-bold text-slate-900">
								{formatCurrency(stats.totalAmount)}
							</h3>
						</div>
						<div className="rounded-2xl bg-slate-100 p-3">
							<CircleDollarSign className="h-5 w-5 text-slate-700" />
						</div>
					</div>
				</div>
			</div>

			<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<label className="text-sm font-medium text-slate-700">
						Lọc theo trạng thái:
					</label>
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

			{loading ? (
				<div className="space-y-4">
					{Array.from({ length: 4 }).map((_, index) => (
						<div
							key={index}
							className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
						/>
					))}
				</div>
			) : filteredItems.length === 0 ? (
				<div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
					<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
						<Banknote className="h-7 w-7 text-slate-500" />
					</div>
					<h3 className="mt-4 text-lg font-bold text-slate-900">
						Không có yêu cầu hoàn tiền
					</h3>
					<p className="mt-2 text-sm text-slate-500">
						Chưa có yêu cầu hoàn tiền nào phù hợp với điều kiện lọc.
					</p>
				</div>
			) : (
				<div className="space-y-4">
					<div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm">
								<thead className="border-b border-slate-200 bg-slate-50">
									<tr>
										<th className="whitespace-nowrap px-6 py-4 font-semibold text-slate-700">
											Mã refund
										</th>
										<th className="whitespace-nowrap px-6 py-4 font-semibold text-slate-700">
											Mã đơn hàng
										</th>
										<th className="whitespace-nowrap px-6 py-4 font-semibold text-slate-700">
											Số tiền
										</th>
										<th className="whitespace-nowrap px-6 py-4 font-semibold text-slate-700">
											Trạng thái
										</th>
										<th className="whitespace-nowrap px-6 py-4 font-semibold text-slate-700">
											Lý do
										</th>
										<th className="whitespace-nowrap px-6 py-4 font-semibold text-slate-700">
											Ngày tạo
										</th>
										<th className="whitespace-nowrap px-6 py-4 font-semibold text-slate-700">
											Xử lý bởi
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{filteredItems.map((item) => {
										const isSelected = selectedId === item.refundId;
										return (
											<tr
												key={item.refundId}
												onClick={() => setSelectedId(item.refundId)}
												className={cn(
													"cursor-pointer transition",
													isSelected
														? "bg-slate-100"
														: "hover:bg-slate-50"
												)}
											>
												<td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-600">
													{item.refundId.slice(0, 8)}...
												</td>
												<td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-slate-600">
													{item.orderId.slice(0, 8)}...
												</td>
												<td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
													{formatCurrency(item.amount)}
												</td>
												<td className="whitespace-nowrap px-6 py-4">
													{getStatusBadge(item.status)}
												</td>
												<td className="max-w-[200px] truncate px-6 py-4 text-slate-600">
													{item.reason || "--"}
												</td>
												<td className="whitespace-nowrap px-6 py-4 text-slate-600">
													{formatDateTime(item.createdAt)}
												</td>
												<td className="whitespace-nowrap px-6 py-4 text-slate-600">
													{item.processedBy || "--"}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>

					<div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm text-slate-500">
							Hiển thị{" "}
							<span className="font-semibold text-slate-900">
								{filteredItems.length}
							</span>{" "}
							/{" "}
							<span className="font-semibold text-slate-900">{totalResult}</span>{" "}
							yêu cầu
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

					{selectedItem && (
						<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
							<div className="flex items-center gap-2 border-b border-slate-100 pb-4">
								<Eye className="h-5 w-5 text-slate-600" />
								<h2 className="text-lg font-bold text-slate-900">
									Chi tiết yêu cầu hoàn tiền
								</h2>
							</div>

							<div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="rounded-2xl bg-slate-50 px-4 py-3">
									<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
										Mã refund
									</p>
									<p className="mt-1 break-all font-mono text-sm text-slate-900">
										{selectedItem.refundId}
									</p>
								</div>

								<div className="rounded-2xl bg-slate-50 px-4 py-3">
									<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
										Mã đơn hàng
									</p>
									<p className="mt-1 break-all font-mono text-sm text-slate-900">
										{selectedItem.orderId}
									</p>
								</div>

								<div className="rounded-2xl bg-slate-50 px-4 py-3">
									<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
										Mã giao dịch
									</p>
									<p className="mt-1 break-all font-mono text-sm text-slate-900">
										{selectedItem.transactionId}
									</p>
								</div>

								<div className="rounded-2xl bg-slate-50 px-4 py-3">
									<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
										Số tiền
									</p>
									<p className="mt-1 text-lg font-bold text-slate-900">
										{formatCurrency(selectedItem.amount)}
									</p>
								</div>

								<div className="rounded-2xl bg-slate-50 px-4 py-3">
									<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
										Trạng thái
									</p>
									<div className="mt-1">
										{getStatusBadge(selectedItem.status)}
									</div>
								</div>

								<div className="rounded-2xl bg-slate-50 px-4 py-3">
									<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
										Ngày tạo
									</p>
									<p className="mt-1 text-sm text-slate-900">
										{formatDateTime(selectedItem.createdAt)}
									</p>
								</div>

								<div className="rounded-2xl bg-slate-50 px-4 py-3 md:col-span-2">
									<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
										Lý do
									</p>
									<p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
										{selectedItem.reason || "--"}
									</p>
								</div>

								{selectedItem.processedBy && (
									<div className="rounded-2xl bg-slate-50 px-4 py-3">
										<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
											Xử lý bởi
										</p>
										<p className="mt-1 text-sm text-slate-900">
											{selectedItem.processedBy}
										</p>
									</div>
								)}

								{selectedItem.processedAt && (
									<div className="rounded-2xl bg-slate-50 px-4 py-3">
										<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
											Xử lý lúc
										</p>
										<p className="mt-1 text-sm text-slate-900">
											{formatDateTime(selectedItem.processedAt)}
										</p>
									</div>
								)}

								{selectedItem.refundedOrderItemIds &&
									selectedItem.refundedOrderItemIds.length > 0 && (
										<div className="rounded-2xl bg-slate-50 px-4 py-3 md:col-span-2">
											<p className="text-xs font-medium uppercase tracking-wide text-slate-500">
												Sản phẩm hoàn tiền
											</p>
											<div className="mt-2 flex flex-wrap gap-2">
												{selectedItem.refundedOrderItemIds.map((id) => (
													<span
														key={id}
														className="rounded-lg bg-slate-200 px-2 py-1 font-mono text-xs text-slate-700"
													>
														{id.slice(0, 8)}...
													</span>
												))}
											</div>
										</div>
									)}
							</div>

							{NEXT_STATUS_MAP[selectedItem.status]?.length ? (
								<div className="mt-6 border-t border-slate-100 pt-5">
									<h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
										<ArrowRight className="h-4 w-4" />
										Thao tác
									</h3>
									<div className="flex flex-wrap gap-3">
										{NEXT_STATUS_MAP[selectedItem.status]?.map((nextStatus) => {
											const config = STATUS_CONFIG[nextStatus];
											return (
												<button
													key={nextStatus}
													type="button"
													onClick={() => void handleUpdateStatus(nextStatus)}
													disabled={updatingStatus}
													className={cn(
														"inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
														nextStatus === "Approved" &&
															"border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
														nextStatus === "Rejected" &&
															"border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
														nextStatus === "Completed" &&
															"border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
													)}
												>
													{nextStatus === "Approved" && (
														<CheckCircle2 className="h-4 w-4" />
													)}
													{nextStatus === "Rejected" && (
														<XCircle className="h-4 w-4" />
													)}
													{nextStatus === "Completed" && (
														<CircleDollarSign className="h-4 w-4" />
													)}
													{config.label}
												</button>
											);
										})}
									</div>
								</div>
							) : (
								<div className="mt-6 border-t border-slate-100 pt-5">
									<p className="text-sm text-slate-500">
										Không có thao tác khả dụng cho trạng thái này.
									</p>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default AdminRefunds;
