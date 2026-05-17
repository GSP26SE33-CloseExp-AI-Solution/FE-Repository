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

export type CollectPackagingOrderPayload = PackagingActionPayload

export type PackagePackagingOrderPayload = PackagingActionPayload

/**
 * POST /api/Packaging/orders/{orderId}/fail
 */
export type FailPackagingOrderPayload = PackagingActionPayload & {
    failureReason: string
}

export type PackagingOrderItem = {
    orderItemId: string
    lotId?: string | null
    productName: string
    quantity: number
    unitPrice: number
    subTotal: number
    expiryDate?: string | null
    manufactureDate?: string | null
    unitName?: string | null
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

export type PackagingOrderDetail = PackagingOrderSummary & {
    packagingStaffId?: string | null
    packagingStaffName?: string | null
    lastPackagedAt?: string | null
    items: PackagingOrderItem[]
}

export type PackagingHistoryQuery = {
    fromDate?: string
    toDate?: string
    status?: string
    orderCode?: string
    pageNumber?: number
    pageSize?: number
}

export type PackagingHistoryItem = {
    packagingId: string
    orderId: string
    orderItemId: string
    orderCode: string
    productName: string
    quantity: number
    userId: string
    packagingStaffName: string
    status: string
    failureReason?: string | null
    packagedAt?: string | null
}

export type PackagingHistoryResponse = PaginationResult<PackagingHistoryItem>
