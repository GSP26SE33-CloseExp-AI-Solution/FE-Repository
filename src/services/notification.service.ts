import axios from "axios";
import axiosClient from "@/utils/axiosClient";
import type { ApiEnvelope } from "@/types/api.types";
import type {
	NotificationItem,
	NotificationType,
	UpdateNotificationPayload,
} from "@/types/notification.type";

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

const dispatchUpdated = () => {
	window.dispatchEvent(new Event("notifications:updated"));
};

export const notificationService = {
	async getMine(): Promise<NotificationItem[]> {
		try {
			const response = await axiosClient.get<
				ApiEnvelope<NotificationItem[]>
			>("/notifications/me");
			return unwrap(response) ?? [];
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Không thể tải danh sách thông báo"),
			);
		}
	},

	async getOrderThread(orderId: string): Promise<NotificationItem[]> {
		try {
			const response = await axiosClient.get<
				ApiEnvelope<NotificationItem[]>
			>(`/notifications/me/order/${orderId}`);
			return unwrap(response) ?? [];
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(
					error,
					"Không thể tải thông báo theo đơn hàng",
				),
			);
		}
	},

	async countUnread(): Promise<number> {
		const items = await this.getMine();
		return items.filter((item) => !item.isRead).length;
	},

	async markAsRead(notificationId: string): Promise<NotificationItem> {
		try {
			const response = await axiosClient.put<
				ApiEnvelope<NotificationItem>
			>(`/notifications/${notificationId}`, { isRead: true });
			dispatchUpdated();
			return unwrap(response);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Không thể đánh dấu đã đọc"),
			);
		}
	},

	async markAllAsRead(notifications: NotificationItem[]): Promise<void> {
		const unread = notifications.filter((item) => !item.isRead);
		if (unread.length === 0) return;

		await Promise.all(
			unread.map((item) =>
				axiosClient.put<ApiEnvelope<NotificationItem>>(
					`/notifications/${item.notificationId}`,
					{ isRead: true },
				),
			),
		);
		dispatchUpdated();
	},

	async update(
		notificationId: string,
		payload: UpdateNotificationPayload,
	): Promise<NotificationItem> {
		try {
			const response = await axiosClient.put<
				ApiEnvelope<NotificationItem>
			>(`/notifications/${notificationId}`, payload);
			if (payload.isRead !== undefined) {
				dispatchUpdated();
			}
			return unwrap(response);
		} catch (error) {
			throw new Error(
				getAxiosErrorMessage(error, "Không thể cập nhật thông báo"),
			);
		}
	},
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
	OrderUpdate: "Cập nhật đơn hàng",
	Promotion: "Khuyến mãi",
	SystemAlert: "Hệ thống",
	DeliveryUpdate: "Giao hàng",
	PriceAlert: "Giá sản phẩm",
};
