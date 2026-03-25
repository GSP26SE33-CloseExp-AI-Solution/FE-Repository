export type ApiResponse<T> = {
    success: boolean
    message: string
    data: T
    errors?: string[] | null
}

export type PaginationResult<T> = {
    items: T[]
    totalResult: number
    page: number
    pageSize: number
}

export type TimeSpanDto = {
    ticks: number
    days: number
    hours: number
    milliseconds: number
    microseconds: number
    nanoseconds: number
    minutes: number
    seconds: number
    totalDays: number
    totalHours: number
    totalMilliseconds: number
    totalMicroseconds: number
    totalNanoseconds: number
    totalMinutes: number
    totalSeconds: number
}

/* ========================= Dashboard ========================= */

export type DashboardOverviewQuery = {
    fromUtc?: string
    toUtc?: string
}

export type RevenueTrendQuery = {
    days?: number
}

export type SlaAlertQuery = {
    thresholdMinutes?: number
    top?: number
}

export type AdminDashboardOverview = {
    totalRevenue: number
    totalOrders: number
    totalUsers: number
    activeSupermarkets: number
    slaBreachedOrders: number
}

export type RevenueTrendItem = {
    date: string
    revenue: number
    orderCount: number
}

export type SlaAlertItem = {
    orderId: string
    orderCode: string
    status: string
    orderDate: string
    minutesLate: number
    deliveryType: string
    userId: string
}

/* ========================= System Config ========================= */

export type AdminTimeSlot = {
    timeSlotId: string
    startTime: TimeSpanDto
    endTime: TimeSpanDto
}

export type UpsertTimeSlotPayload = {
    startTime: {
        ticks: number
    }
    endTime: {
        ticks: number
    }
}

export type CollectionPoint = {
    collectionId: string
    name: string
    addressLine: string
}

export type UpsertCollectionPointPayload = {
    name: string
    addressLine: string
}

export type SystemParameter = {
    configKey: string
    configValue: string
    updatedAt: string
}

export type UpdateSystemParameterPayload = {
    configValue: string
}

/* ========================= Catalog ========================= */

export type UnitItem = {
    unitId: string
    name: string
    type: string
    symbol: string
    createdAt: string
    updatedAt: string
}

export type UpsertUnitPayload = {
    name: string
    type: string
    symbol: string
}

export type PromotionItem = {
    promotionId: string
    categoryId: string
    name: string
    discountType: string
    discountValue: number
    startDate: string
    endDate: string
    status: string
}

export type UpsertPromotionPayload = {
    categoryId: string
    name: string
    discountType: string
    discountValue: number
    startDate: string
    endDate: string
    status: string
}

export type UpdatePromotionStatusPayload = {
    status: string
}

/* ========================= Monitoring ========================= */

export type AiPricingHistoryItem = {
    aiPriceId: string
    lotId: string
    suggestedPrice: number
    marketAvgPrice: number
    aiConfidence: number
    acceptedSuggestion: boolean
    confirmedBy: string
    confirmedAt: string
    createdAt: string
}

/* ========================= Users / Accounts ========================= */

export type MarketStaffInfo = {
    marketStaffId: string
    position?: string
    joinedAt?: string
    supermarket?: {
        supermarketId: string
        name: string
        address?: string
        contactPhone?: string
    }
}

export type AdminUser = {
    userId: string
    fullName: string
    email: string
    phone?: string
    roleName: string
    roleId: number
    status: number
    createdAt: string
    updatedAt: string
    marketStaffInfo?: MarketStaffInfo | null
}

export type CreateUserPayload = {
    fullName: string
    email: string
    phone?: string
    password: string
    roleId: number
}

export type UpdateUserPayload = {
    fullName: string
    email: string
    phone?: string
    status: number
    roleId: number
}

export type UpdateCurrentUserProfilePayload = {
    fullName: string
    phone?: string
}

export type PatchUserStatusPayload = {
    status: number
}

/**
 * FE aggregate row: map từ AdminUser để dùng cho UI bảng account
 */
export type AdminAccountRow = {
    id: string
    fullName: string
    email: string
    phone?: string
    roleName: string
    roleId: number
    status: number
    createdAt: string
    updatedAt: string
    organizationName?: string
    marketStaffId?: string
    position?: string
}

/**
 * FE aggregate row: không phải response BE
 */
export type AdminApprovalRow = {
    id: string
    userId: string
    fullName: string
    email: string
    phone?: string
    roleName: string
    status: number
    createdAt: string
    updatedAt: string
    supermarketId?: string
    supermarketName?: string
    position?: string
}

/**
 * FE aggregate row: không phải response BE
 */
export type InternalStaffRow = {
    id: string
    userId: string
    fullName: string
    email: string
    phone?: string
    roleName: string
    roleId: number
    status: number
    createdAt: string
    updatedAt: string
    department?: string
    position?: string
    organizationName?: string
}

/* ========================= Orders / Transactions ========================= */

export type AdminOrderItem = {
    orderItemId: string
    orderId: string
    lotId: string
    quantity: number
    unitPrice: number
    totalPrice?: number
    lineTotal?: number
    productName?: string
    expiryDate?: string
}

export type AdminOrder = {
    orderId: string
    orderCode?: string
    userId?: string
    userName?: string
    timeSlotId?: string
    timeSlotDisplay?: string
    collectionId?: string
    collectionPointName?: string
    deliveryType?: string
    totalAmount: number
    discountAmount?: number
    finalAmount: number
    deliveryFee?: number
    status?: string
    orderDate?: string
    addressId?: string
    promotionId?: string
    deliveryGroupId?: string
    deliveryNote?: string
    cancelDeadline?: string
    createdAt?: string
    updatedAt?: string
    orderItems?: AdminOrderItem[]
}

/* ========================= Delivery ========================= */

export type DeliveryGroupListItem = {
    deliveryGroupId: string
    groupCode: string
    timeSlotDisplay: string
    deliveryType: string
    deliveryArea: string
    status: string
    totalOrders: number
    completedOrders: number
    deliveryDate: string
}

export type DeliveryGroupOrderItem = {
    orderItemId: string
    productName: string
    quantity: number
    unitPrice: number
    subTotal: number
}

export type DeliveryGroupOrder = {
    orderId: string
    orderCode: string
    status: string
    deliveryType: string
    totalAmount: number
    deliveryFee: number
    orderDate: string
    customerName: string
    customerPhone: string
    collectionPointName: string
    addressLine: string
    deliveryNote: string
    timeSlotDisplay: string
    totalItems: number
    items: DeliveryGroupOrderItem[]
}

export type DeliveryGroupDetail = {
    deliveryGroupId: string
    groupCode: string
    deliveryStaffId?: string
    deliveryStaffName?: string
    deliveryTimeSlotId?: string
    timeSlotDisplay: string
    deliveryType: string
    deliveryArea: string
    status: string
    totalOrders: number
    completedOrders: number
    failedOrders: number
    notes?: string
    deliveryDate: string
    createdAt: string
    updatedAt: string
    orders: DeliveryGroupOrder[]
}

export type AssignDeliveryPayload = {
    deliveryStaffId: string
    reason?: string
}

export type DeliveryActionPayload = {
    notes?: string
}

export type DeliveryOrderDetailItem = {
    orderItemId: string
    productName: string
    quantity: number
    unitPrice: number
    subTotal: number
}

export type DeliveryOrderDetail = {
    orderId: string
    orderCode: string
    status: string
    deliveryType: string
    totalAmount: number
    deliveryFee: number
    orderDate: string
    customerName: string
    customerPhone: string
    collectionPointName: string
    addressLine: string
    deliveryNote: string
    timeSlotDisplay: string
    totalItems: number
    items: DeliveryOrderDetailItem[]
}

export type ConfirmDeliveryPayload = {
    proofImageUrl?: string
    notes?: string
}

export type ReportDeliveryFailurePayload = {
    failureReason: string
    notes?: string
}

export type CustomerConfirmationPayload = {
    notes?: string
}

export type DeliveryHistoryItem = {
    deliveryId: string
    orderId: string
    orderCode: string
    userId: string
    deliveryStaffName: string
    status: string
    failureReason?: string
    deliveredAt?: string
}

export type DeliveryStats = {
    deliveryStaffId: string
    deliveryStaffName: string
    totalAssignedGroups: number
    totalOrders: number
    completedOrders: number
    failedOrders: number
    pendingOrders: number
    inTransitOrders: number
    completionRate: number
    lastDeliveryAt?: string
}

/* ========================= Packaging / Operations ========================= */

export type PackagingPendingOrderItem = {
    orderId: string
    orderCode: string
    orderStatus: string
    packagingStatus: string
    customerName: string
    timeSlotDisplay: string
    deliveryType: string
    totalItems: number
    finalAmount: number
    orderDate: string
}

export type PackagingOrderProductItem = {
    orderItemId: string
    productName: string
    quantity: number
    unitPrice: number
    subTotal: number
}

export type PackagingOrderDetail = {
    orderId: string
    orderCode: string
    orderStatus: string
    packagingStatus: string
    customerName: string
    timeSlotDisplay: string
    deliveryType: string
    totalItems: number
    finalAmount: number
    orderDate: string
    packagingRecordId?: string
    packagingStaffId?: string
    packagingStaffName?: string
    packagedAt?: string
    items: PackagingOrderProductItem[]
}

export type PackagingActionPayload = {
    notes?: string
}

/* ========================= Feedbacks ========================= */

export type FeedbackItem = {
    feedbackId: string
    userId: string
    userName: string
    orderId: string
    rating: number
    comment: string
    createdAt: string
    updatedAt: string
}

export type CreateFeedbackPayload = {
    orderId: string
    rating: number
    comment: string
}

export type UpdateFeedbackPayload = {
    rating: number
    comment: string
}

/* ========================= Supermarkets ========================= */

export type AdminSupermarketItem = {
    supermarketId: string
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone: string
    status: number
    createdAt: string
}

export type CreateSupermarketPayload = {
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone: string
}

export type UpdateSupermarketPayload = {
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone: string
    status: number
}

/* ========================= User Images ========================= */

export type UserImageItem = {
    imageId: string
    userId: string
    imageUrl: string
    preSignedUrl?: string
    imageType: string
    isPrimary: boolean
    createdAt: string
}

/* ========================= Reports UI (FE aggregate types) ========================= */

export type ReportStatCard = {
    label: string
    value: number | string
    hint?: string
}

export type ReportSeriesPoint = {
    label: string
    value: number
}

export type ReportBreakdownItem = {
    label: string
    value: number
    percentage?: number
}
