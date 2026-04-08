import axios from "axios";
import axiosClient from "@/utils/axiosClient";
import type { ApiEnvelope } from "@/types/api.types";
import type {
	ConfirmPaymentResponse,
	CreateMyOrderPayload,
	CreateOrderPayload,
	CreatePaymentLinkPayload,
	OrderDetails,
	OrderTimeSlot,
	PaginationResult,
	PaymentLinkResponse,
	RefundDetails,
	UpdateOrderPayload,
} from "@/types/order.type";

const unwrap = <T>(response: { data: ApiEnvelope<T> }) => response.data.data;

const getAxiosErrorMessage = (error: unknown, fallback: string): string => {
	if (axios.isAxiosError(error)) {
		const data = error.response?.data as
			| { message?: string; errors?: string[]; error?: string }
			| undefined;
		return data?.errors?.[0] || data?.message || data?.error || fallback;
	}
	return fallback;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const orderService = {
	/* =========================
       Orders
    ========================= */
	async getOrders(params?: { pageNumber?: number; pageSize?: number }) {
		const response = await axiosClient.get<
			ApiEnvelope<PaginationResult<OrderDetails>>
		>("/Orders", { params });
		return unwrap(response);
	},

	async getMyOrders(params?: { pageNumber?: number; pageSize?: number }) {
		const response = await axiosClient.get<
			ApiEnvelope<PaginationResult<OrderDetails>>
		>("/Orders/my-orders", { params });
		return unwrap(response);
	},

	async createOrder(payload: CreateOrderPayload) {
		try {
			const response = await axiosClient.post<ApiEnvelope<OrderDetails>>(
				"/Orders",
				payload,
			);
			return unwrap(response);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Tạo đơn hàng không thành công"),
			);
		}
	},

	async createMyOrder(payload: CreateMyOrderPayload) {
		try {
			const response = await axiosClient.post<ApiEnvelope<OrderDetails>>(
				"/Orders/my-orders",
				payload,
			);
			return unwrap(response);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Tạo đơn hàng không thành công"),
			);
		}
	},

	async getOrder(orderId: string) {
		const response = await axiosClient.get<ApiEnvelope<OrderDetails>>(
			`/Orders/${orderId}`,
		);
		return unwrap(response);
	},

	async getOrderDetails(orderId: string) {
		const response = await axiosClient.get<ApiEnvelope<OrderDetails>>(
			`/Orders/${orderId}/details`,
		);
		return unwrap(response);
	},

	async updateOrder(orderId: string, payload: UpdateOrderPayload) {
		try {
			await axiosClient.put(`/Orders/${orderId}`, payload);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(
					error,
					"Cập nhật đơn hàng không thành công",
				),
			);
		}
	},

	async deleteOrder(orderId: string) {
		try {
			await axiosClient.delete(`/Orders/${orderId}`);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Xóa đơn hàng không thành công"),
			);
		}
	},

	/* =========================
       Order Meta
    ========================= */
	async getTimeSlots() {
		const response =
			await axiosClient.get<ApiEnvelope<OrderTimeSlot[]>>(
				"/Orders/time-slots",
			);
		return unwrap(response);
	},

	/* =========================
       Payment
    ========================= */
	async createPaymentLink(
		payload: CreatePaymentLinkPayload,
	): Promise<PaymentLinkResponse> {
		try {
			const response = await axiosClient.post<PaymentLinkResponse>(
				"/Payment/create-payment-link",
				payload,
			);
			return response.data;
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(
					error,
					"Tạo link thanh toán không thành công",
				),
			);
		}
	},

	/**
	 * Gọi POST /api/Payment/confirm.
	 * Trả 200 + success khi đã paid;
	 * 400/404 với body JSON khi chưa settled hoặc lỗi.
	 */
	async confirmPayment(orderCode: string): Promise<ConfirmPaymentResponse> {
		try {
			const response = await axiosClient.post<ConfirmPaymentResponse>(
				"/Payment/confirm",
				{ orderCode },
				{
					validateStatus: (status) =>
						status === 200 || status === 400 || status === 404,
				},
			);

			if (response.status === 200) {
				return { success: true };
			}

			const data = response.data as ConfirmPaymentResponse;
			return {
				success: false,
				message: data?.message,
				errorCode: data?.errorCode,
				payOsStatus: data?.payOsStatus,
				amountPaid: data?.amountPaid,
				amount: data?.amount,
			};
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(
					error,
					"Xác nhận thanh toán không thành công",
				),
			);
		}
	},

	/**
	 * Gọi confirm lặp lại khi PayOS/BE trả PaymentNotComplete
	 * (race với webhook hoặc redirect sớm).
	 */
	async confirmPaymentWithRetry(
		orderCode: string,
		options?: { maxAttempts?: number; delayMs?: number },
	): Promise<ConfirmPaymentResponse> {
		const maxAttempts = options?.maxAttempts ?? 5;
		const delayMs = options?.delayMs ?? 2500;

		let last: ConfirmPaymentResponse = {
			success: false,
			message: "Không xác nhận được thanh toán",
		};

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const result = await this.confirmPayment(orderCode);
			if (result.success) return result;

			last = result;
			if (result.errorCode !== "PaymentNotComplete") return result;

			if (attempt < maxAttempts - 1) {
				await sleep(delayMs);
			}
		}

		return last;
	},

	/* =========================
       Order Status Actions
    ========================= */
	async markPending(orderId: string) {
		await axiosClient.put(`/Orders/${orderId}/pending`);
	},

	/** PUT /api/Orders/{id}/paid — đồng bộ OrderState.Paid trên BE */
	async markPaid(orderId: string) {
		await axiosClient.put(`/Orders/${orderId}/paid`);
	},

	async markReadyToShip(orderId: string) {
		await axiosClient.put(`/Orders/${orderId}/ready-to-ship`);
	},

	async markDeliveredWaitConfirm(orderId: string) {
		await axiosClient.put(`/Orders/${orderId}/delivered-wait-confirm`);
	},

	async markCompleted(orderId: string) {
		await axiosClient.put(`/Orders/${orderId}/completed`);
	},

	/** PUT /api/Orders/{id}/canceled — bắt buộc body { reason } */
	async markCanceled(orderId: string, reason: string) {
		await axiosClient.put(`/Orders/${orderId}/canceled`, { reason });
	},

	async markRefunded(orderId: string) {
		await axiosClient.put(`/Orders/${orderId}/refunded`);
	},

	async markFailed(orderId: string) {
		await axiosClient.put(`/Orders/${orderId}/failed`);
	},

	async getMyRefunds(params?: {
		orderId?: string;
		pageNumber?: number;
		pageSize?: number;
	}) {
		const response = await axiosClient.get<
			ApiEnvelope<PaginationResult<RefundDetails>>
		>("/Refunds/my", { params });
		return unwrap(response);
	},
};
