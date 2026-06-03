export type PaginationResult<T> = {
    items: T[]
    totalResult: number
    page: number
    pageSize: number
}

export type PackagingActionPayload = {
    orderItemIds?: string[]
    notes?: string
}

export type ConfirmPackagingOrderPayload = PackagingActionPayload

export type CollectPackagingOrderPayload = {
    orderItemIds?: string[]
    notes: string
}

export type PackagePackagingOrderPayload = PackagingActionPayload

export type FailPackagingOrderPayload = PackagingActionPayload & {
    failureReason: string
}

export type PackagingOrderItem = {
    orderItemId: string
    lotId: string
    productName: string
    quantity: number
    unitPrice: number
    subTotal: number
    expiryDate?: string | null
    manufactureDate?: string | null
    unitName?: string | null
    purchaseUnitId?: string | null
    purchaseUnitName?: string | null
    purchaseUnitSymbol?: string | null
    purchaseQuantity?: number | null
    supermarketName?: string | null
    packagingStatus?: string
    deliveryStatus?: string | null
    packagedAt?: string | null
    packagingFailedReason?: string | null
}

export type PackagingOrderSummary = {
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

export type PackagingActivityLog = {
    changedAt: string
    actionLabel: string
    note: string
    changedByUserId?: string | null
}

export type PackagingOrderDetail = PackagingOrderSummary & {
    packagingStaffId?: string | null
    packagingStaffName?: string | null
    lastPackagedAt?: string | null
    items: PackagingOrderItem[]
    activityLogs?: PackagingActivityLog[]
}

/** GET /api/Packaging/history query params */

export type PackagingHistoryRecord = {
    packagingId: string
    orderId: string
    orderItemId?: string | null
    orderCode: string
    productName?: string | null
    quantity: number
    userId: string
    packagingStaffName: string
    status: string
    failureReason?: string | null
    packagedAt?: string | null
}

export type PackagingHistoryQuery = {
    fromDate?: string
    toDate?: string
    status?: string
    orderCode?: string
    pageNumber?: number
    pageSize?: number
}

export type PackagingHistoryResponse = PaginationResult<PackagingHistoryRecord>
