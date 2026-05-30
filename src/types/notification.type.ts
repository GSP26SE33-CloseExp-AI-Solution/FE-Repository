export type NotificationType =
	| "OrderUpdate"
	| "Promotion"
	| "SystemAlert"
	| "DeliveryUpdate"
	| "PriceAlert";

export type NotificationItem = {
	notificationId: string;
	userId: string;
	userFullName?: string | null;
	orderId?: string | null;
	parentNotificationId?: string | null;
	orderCode?: string | null;
	title: string;
	content: string;
	type: NotificationType;
	isRead: boolean;
	createdAt: string;
};

export type UpdateNotificationPayload = {
	title?: string;
	content?: string;
	type?: NotificationType;
	isRead?: boolean;
};
