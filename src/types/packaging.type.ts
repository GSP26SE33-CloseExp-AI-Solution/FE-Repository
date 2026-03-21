export type PackagingActionPayload = {
    notes?: string
}

export type PackagingOrderItem = {
    orderItemId: string
    productName: string
    quantity: number
    unitPrice: number
    subTotal: number
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
    packagingRecordId: string
    packagingStaffId: string
    packagingStaffName: string
    packagedAt: string
    items: PackagingOrderItem[]
}

export type PaginationResult<T> = {
    items: T[]
    totalResult: number
    page: number
    pageSize: number
}

export type ApiResponse<T> = {
    success: boolean
    message: string
    data: T
    errors: string[] | null
}
