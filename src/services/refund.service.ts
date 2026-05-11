import axios from "axios";
import axiosClient from "@/utils/axiosClient";
import type { ApiEnvelope } from "@/types/api.types";
import type { PaginationResult } from "@/types/order.type";
import type {
	RefundListItem,
	RefundListParams,
	RefundStatus,
} from "@/types/refund.types";

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

export const refundService = {
	/**
	 * GET /api/Refunds — danh sách refund cho Admin/MarketingStaff
	 */
	async listRefunds(params?: RefundListParams) {
		const response = await axiosClient.get<
			ApiEnvelope<PaginationResult<RefundListItem>>
		>("/Refunds", { params });
		return unwrap(response);
	},

	/**
	 * GET /api/Refunds/{id} — chi tiết refund
	 */
	async getById(refundId: string) {
		const response = await axiosClient.get<ApiEnvelope<RefundListItem>>(
			`/Refunds/${refundId}`
		);
		return unwrap(response);
	},

	/**
	 * PUT /api/Refunds/{id}/pending — chuyển về Pending
	 */
	async markPending(refundId: string) {
		try {
			await axiosClient.put(`/Refunds/${refundId}/pending`);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Cập nhật trạng thái thất bại")
			);
		}
	},

	/**
	 * PUT /api/Refunds/{id}/approved — duyệt refund
	 */
	async markApproved(refundId: string) {
		try {
			await axiosClient.put(`/Refunds/${refundId}/approved`);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Duyệt hoàn tiền thất bại")
			);
		}
	},

	/**
	 * PUT /api/Refunds/{id}/rejected — từ chối refund
	 */
	async markRejected(refundId: string) {
		try {
			await axiosClient.put(`/Refunds/${refundId}/rejected`);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Từ chối hoàn tiền thất bại")
			);
		}
	},

	/**
	 * PUT /api/Refunds/{id}/completed — hoàn tất refund
	 */
	async markCompleted(refundId: string) {
		try {
			await axiosClient.put(`/Refunds/${refundId}/completed`);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Hoàn tất hoàn tiền thất bại")
			);
		}
	},

	/**
	 * Cập nhật trạng thái dựa trên status mới
	 */
	async updateStatus(refundId: string, newStatus: RefundStatus) {
		switch (newStatus) {
			case "Pending":
				return this.markPending(refundId);
			case "Approved":
				return this.markApproved(refundId);
			case "Rejected":
				return this.markRejected(refundId);
			case "Completed":
				return this.markCompleted(refundId);
			default:
				throw new Error(`Trạng thái không hợp lệ: ${newStatus}`);
		}
	},
};
