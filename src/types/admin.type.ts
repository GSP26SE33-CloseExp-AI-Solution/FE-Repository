export type { ApiResponse } from "./api.types"

/* ========================= Shared ========================= */

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
    relatedOrderCount: number
    displayTimeRange?: string
}

export type TimeSpanPayload = {
    ticks: number
}

export type UpsertTimeSlotPayload = {
    startTime: TimeSpanPayload
    endTime: TimeSpanPayload
}

export type CollectionPoint = {
    collectionId: string
    name: string
    addressLine: string
    latitude: number
    longitude: number
    relatedOrderCount: number
}

export type UpsertCollectionPointPayload = {
    name: string
    addressLine: string
    latitude: number
    longitude: number
}

export type SystemParameter = {
    configKey: string
    configValue: string
    updatedAt: string
}

export type UpdateSystemParameterPayload = {
    configValue: string
}

/* ========================= Categories ========================= */

export type CategoryItem = {
    categoryId: string
    parentCatId?: string | null
    parentName?: string | null
    isFreshFood: boolean
    name: string
    description?: string | null
    catIconUrl?: string | null
    isActive: boolean
}

export type UpsertCategoryPayload = {
    parentCatId?: string | null
    isFreshFood: boolean
    name: string
    description?: string | null
    catIconUrl?: string | null
    isActive: boolean
}

/* ========================= Catalog ========================= */

export type UnitItem = {
    unitId: string
    name: string
    type: string
    symbol: string
    createdAt: string
    updatedAt: string
    relatedStockLotCount: number
    isInUse: boolean
}

export type UpsertUnitPayload = {
    name: string
    type: string
    symbol: string
}

export type PromotionItem = {
    promotionId: string
    code: string
    categoryId: string
    name: string
    discountType: string
    discountValue: number
    minOrderAmount?: number | null
    maxDiscountAmount?: number | null
    maxUsage: number
    usedCount: number
    perUserLimit: number
    startDate: string
    endDate: string
    status: string
}

export type UpsertPromotionPayload = {
    code: string
    categoryId: string
    name: string
    discountType: string
    discountValue: number
    minOrderAmount?: number | null
    maxDiscountAmount?: number | null
    maxUsage: number
    perUserLimit: number
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
    confirmedBy?: string | null
    confirmedAt?: string | null
    createdAt: string
}

/* ========================= Users / Accounts ========================= */

export type MarketStaffInfo = {
    marketStaffId: string
    position?: string
    joinedAt?: string
    isManager?: boolean
    employeeCodeHint?: string
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

export type AdminRegisterInternalPayload = {
    fullName: string
    email: string
    phone?: string
    password?: string
    roleId: number
}

export type UpdateUserPayload = {
    fullName?: string
    email?: string
    phone?: string
    status?: number
    roleId?: number
}

export type UpdateCurrentUserProfilePayload = {
    fullName?: string
    phone?: string
}

export type PatchUserStatusPayload = {
    status: number
}

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
    lotId: string
    quantity: number
    unitPrice: number
    totalPrice?: number
    productName?: string
    expiryDate?: string
}

export type AdminOrder = {
    orderId: string
    orderCode: string
    status: string
    orderDate: string
    createdAt: string
    updatedAt: string
    deliveryType: string
    totalAmount: number
    discountAmount: number
    finalAmount: number
    deliveryFee: number
    systemUsageFeeAmount?: number
    userId: string
    userName?: string
    timeSlotId: string
    timeSlotDisplay?: string
    collectionId?: string | null
    collectionPointName?: string | null
    deliveryGroupId?: string | null
    orderItems?: AdminOrderItem[]
}

export type AdminOrdersQuery = {
    pageNumber?: number
    pageSize?: number
    fromUtc?: string
    toUtc?: string
    status?: string
    deliveryType?: string
    userId?: string
    timeSlotId?: string
    collectionId?: string
    deliveryGroupId?: string
    unassignedOnly?: boolean
    search?: string
    sortBy?: string
    sortDir?: string
}

/* ========================= Delivery ========================= */

export type DeliveryGroupsQuery = {
    deliveryDate?: string
    pageNumber?: number
    pageSize?: number
    status?: string
}

export type DraftDeliveryGroupsQuery = {
    deliveryDate?: string
    timeSlotId?: string
    collectionId?: string
    pageNumber?: number
    pageSize?: number
}

export type GenerateDraftDeliveryGroupsPayload = {
    deliveryDate?: string
    timeSlotId?: string
    collectionId?: string
    maxDistanceKm?: number
    maxOrdersPerGroup?: number
    maxRouteDurationMinutes?: number
}

export type AssignDeliveryGroupPayload = {
    deliveryStaffId: string
    reason?: string
}

export type MoveOrderItemsToDraftGroupPayload = {
    orderItemIds: string[]
    deliveryGroupId?: string | null
}

export type MoveOrderItemsToDraftGroupResult = {
    updatedItemCount: number
    updatedOrderCount: number
    orderItemIds: string[]
    orderIds: string[]
    deliveryGroupId?: string | null
}

export type DeliveryGroupSummary = {
    deliveryGroupId: string
    groupCode: string
    timeSlotDisplay: string
    deliveryType: string
    deliveryArea: string
    centerLatitude: number
    centerLongitude: number
    status: string
    totalOrders: number
    completedOrders: number
    deliveryDate: string

    slotStartAtUtc?: string
    slotEndAtUtc?: string
    distanceFromCurrentKm?: number
    priorityScore?: number
    priorityReasons?: string[]

    deliveryStaffId?: string | null
    deliveryStaffName?: string | null
    timeSlotId?: string
    collectionId?: string | null
    collectionPointName?: string | null
    failedOrders?: number
    createdAt?: string
    updatedAt?: string
}

export type DeliveryGroupOrderItem = {
    orderItemId: string
    productName: string
    quantity: number
    unitPrice: number
    subTotal: number
    packagingStatus: string
    deliveryStatus: string
    deliveryGroupId: string
}

export type DeliveryGroupOrder = {
    orderId: string
    deliveryGroupId: string
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
    latitude?: number
    longitude?: number
    deliveryNote: string
    timeSlotDisplay: string
    totalItems?: number
    items: DeliveryGroupOrderItem[]
}

export type DeliveryGroupDetail = {
    deliveryGroupId: string
    groupCode: string
    deliveryStaffId?: string | null
    deliveryStaffName?: string | null
    timeSlotId: string
    timeSlotDisplay: string
    deliveryType: string
    deliveryArea: string
    centerLatitude: number
    centerLongitude: number
    status: string
    totalOrders: number
    completedOrders: number
    failedOrders: number
    notes?: string | null
    deliveryDate: string
    createdAt: string
    updatedAt: string
    orders: DeliveryGroupOrder[]
    collectionId?: string | null
    collectionPointName?: string | null
}

/* ========================= Delivery Calendar / Scheduler UI ========================= */

export type DeliveryCalendarDaySummary = {
    date: string
    totalGroups: number
    totalDraftGroups: number
    totalPendingGroups: number
    totalAssignedGroups: number
    totalInTransitGroups: number
    totalCompletedGroups: number
    totalFailedGroups: number
    totalUnassignedGroups: number
    totalOrders: number
    groups: DeliveryGroupSummary[]
}

export type DeliveryCalendarSlotSummary = {
    timeSlotId?: string
    timeSlotDisplay: string
    totalGroups: number
    totalOrders: number
    unassignedGroups: number
    groups: DeliveryGroupSummary[]
}

export type DeliveryCalendarMonthSummary = {
    monthKey: string
    year: number
    month: number
    days: DeliveryCalendarDaySummary[]
}

export type DeliveryGroupSchedulerCard = {
    deliveryGroupId: string
    groupCode: string
    deliveryDate: string
    timeSlotId?: string
    timeSlotDisplay: string
    collectionId?: string | null
    collectionPointName?: string | null
    deliveryType: string
    deliveryArea: string
    status: string
    totalOrders: number
    completedOrders: number
    failedOrders: number
    unassigned: boolean
    deliveryStaffId?: string | null
    deliveryStaffName?: string | null
}

/* ========================= FE Aggregate for Admin Delivery ========================= */

export type DeliveryStaffBoardItem = {
    deliveryStaffId: string
    deliveryStaffName: string
    email?: string
    phone?: string
    status: number
    totalAssignedGroups: number
    draftGroups: number
    activeGroups: number
    completedGroups: number
    failedGroups: number
    inTransitGroups: number
    pendingGroups: number
    latestAssignedGroupDate?: string
}

/* ========================= Packaging ========================= */

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

/* ========================= Supermarkets ========================= */

export type AdminSupermarketItem = {
    supermarketId: string
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone: string
    contactEmail?: string
    status: number
    createdAt?: string
    updatedAt?: string
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

/* ========================= Supermarket Applications ========================= */

export type PendingSupermarketApplication = {
    supermarketId: string
    applicationReference: string
    name: string
    address: string
    latitude: number
    longitude: number
    contactPhone: string
    contactEmail?: string
    applicantUserId: string
    applicantEmail: string
    applicantFullName: string
    submittedAt: string
    createdAt: string
}

export type RejectSupermarketApplicationPayload = {
    adminReviewNote: string
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

/* ========================= Reports UI ========================= */

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

/* ========================= Enum State ========================= */

export const USER_STATUS = {
    UNVERIFIED: 0,
    PENDING_APPROVAL: 1,
    ACTIVE: 2,
    REJECTED: 3,
    LOCKED: 4,
    BANNED: 5,
    DELETED: 6,
    HIDDEN: 7,
} as const

export const PACKAGING_STATUS = {
    PENDING: 0,
    PACKAGING: 1,
    COMPLETED: 2,
    FAILED: 3,
} as const

export const SUPERMARKET_STATUS = {
    PENDING_APPROVAL: 0,
    ACTIVE: 1,
    SUSPENDED: 2,
    CLOSED: 3,
    REJECTED: 4,
} as const

export const SUPERMARKET_STAFF_STATUS = {
    PENDING_APPROVAL: 0,
    ACTIVE: 1,
    SUSPENDED: 2,
    CLOSED: 3,
    REJECTED: 4,
} as const

export const ROLE_USER = {
    ADMIN: 1,
    PACKAGING_STAFF: 2,
    MARKETING_STAFF: 3,
    SUPERMARKET_STAFF: 4,
    DELIVERY_STAFF: 5,
    VENDOR: 6,
} as const

export const DELIVERY_GROUP_STATUS = {
    DRAFT: "Draft",
    PENDING: "Pending",
    ASSIGNED: "Assigned",
    IN_TRANSIT: "InTransit",
    COMPLETED: "Completed",
    FAILED: "Failed",
    CONFIRMED: "Confirmed",
} as const

export const PROMOTION_STATUS = {
    DRAFT: "Draft",
    ACTIVE: "Active",
    EXPIRED: "Expired",
    DISABLED: "Disabled",
} as const
