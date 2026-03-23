import axiosClient from "@/utils/axiosClient"
import type {
    AdminApprovalRow,
    AdminDashboardOverview,
    AdminOrder,
    AdminSupermarketItem,
    AdminUser,
    ApiResponse,
    AssignDeliveryPayload,
    CollectionPoint,
    ConfirmDeliveryPayload,
    CreateSupermarketPayload,
    CreateUserPayload,
    CustomerConfirmationPayload,
    DeliveryActionPayload,
    DeliveryGroupDetail,
    DeliveryGroupListItem,
    DeliveryHistoryItem,
    DeliveryOrderDetail,
    DeliveryStats,
    FeedbackItem,
    InternalStaffRow,
    PackagingActionPayload,
    PackagingOrderDetail,
    PackagingPendingOrderItem,
    PaginationResult,
    PatchUserStatusPayload,
    PromotionItem,
    ReportDeliveryFailurePayload,
    RevenueTrendItem,
    SlaAlertItem,
    SlaAlertQuery,
    SystemParameter,
    TimeSpanDto,
    UnitItem,
    UpdateSupermarketPayload,
    UpdateSystemParameterPayload,
    UpdateUserPayload,
    UpsertCollectionPointPayload,
    UpsertPromotionPayload,
    UpsertTimeSlotPayload,
    UpsertUnitPayload,
    AdminTimeSlot,
    AiPricingHistoryItem,
} from "@/types/admin.type"

type Query = Record<string, string | number | boolean | undefined | null>

const buildQueryString = (params?: Query) => {
    if (!params) return ""
    const search = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return
        search.append(key, String(value))
    })

    const query = search.toString()
    return query ? `?${query}` : ""
}

const unwrap = <T>(response: ApiResponse<T>): T => response.data

const get = async <T>(url: string) => {
    const response = await axiosClient.get<ApiResponse<T>>(url)
    return unwrap(response.data)
}

const post = async <T, P = unknown>(url: string, payload?: P) => {
    const response = await axiosClient.post<ApiResponse<T>>(url, payload)
    return unwrap(response.data)
}

const put = async <T, P = unknown>(url: string, payload?: P) => {
    const response = await axiosClient.put<ApiResponse<T>>(url, payload)
    return unwrap(response.data)
}

const patch = async <T, P = unknown>(url: string, payload?: P) => {
    const response = await axiosClient.patch<ApiResponse<T>>(url, payload)
    return unwrap(response.data)
}

const remove = async <T>(url: string) => {
    const response = await axiosClient.delete<ApiResponse<T>>(url)
    return unwrap(response.data)
}

export const adminService = {
    /* ========================= Dashboard ========================= */

    getDashboardOverview() {
        return get<AdminDashboardOverview>("/admin/dashboard/overview")
    },

    getRevenueTrend(params?: {
        days?: number
        fromDate?: string
        toDate?: string
        groupBy?: string
    }) {
        return get<RevenueTrendItem[]>(
            `/admin/dashboard/revenue-trend${buildQueryString(params)}`
        )
    },

    getSlaAlerts(params?: SlaAlertQuery) {
        return get<SlaAlertItem[]>(
            `/admin/dashboard/sla-alerts${buildQueryString(params)}`
        )
    },

    /* ========================= System Config ========================= */

    getTimeSlots() {
        return get<AdminTimeSlot[]>("/admin/system-config/time-slots")
    },

    createTimeSlot(payload: UpsertTimeSlotPayload) {
        return post<AdminTimeSlot, UpsertTimeSlotPayload>(
            "/admin/system-config/time-slots",
            payload
        )
    },

    updateTimeSlot(timeSlotId: string, payload: UpsertTimeSlotPayload) {
        return put<AdminTimeSlot, UpsertTimeSlotPayload>(
            `/admin/system-config/time-slots/${timeSlotId}`,
            payload
        )
    },

    deleteTimeSlot(timeSlotId: string) {
        return remove<boolean>(`/admin/system-config/time-slots/${timeSlotId}`)
    },

    getCollectionPoints() {
        return get<CollectionPoint[]>("/admin/system-config/collection-points")
    },

    createCollectionPoint(payload: UpsertCollectionPointPayload) {
        return post<CollectionPoint, UpsertCollectionPointPayload>(
            "/admin/system-config/collection-points",
            payload
        )
    },

    updateCollectionPoint(collectionId: string, payload: UpsertCollectionPointPayload) {
        return put<CollectionPoint, UpsertCollectionPointPayload>(
            `/admin/system-config/collection-points/${collectionId}`,
            payload
        )
    },

    deleteCollectionPoint(collectionId: string) {
        return remove<boolean>(`/admin/system-config/collection-points/${collectionId}`)
    },

    getSystemParameters() {
        return get<SystemParameter[]>("/admin/system-config/parameters")
    },

    updateSystemParameter(configKey: string, payload: UpdateSystemParameterPayload) {
        return put<SystemParameter, UpdateSystemParameterPayload>(
            `/admin/system-config/parameters/${configKey}`,
            payload
        )
    },

    /* ========================= Catalog ========================= */

    getUnits() {
        return get<UnitItem[]>("/admin/catalog/units")
    },

    createUnit(payload: UpsertUnitPayload) {
        return post<UnitItem, UpsertUnitPayload>("/admin/catalog/units", payload)
    },

    updateUnit(unitId: string, payload: UpsertUnitPayload) {
        return put<UnitItem, UpsertUnitPayload>(`/admin/catalog/units/${unitId}`, payload)
    },

    deleteUnit(unitId: string) {
        return remove<boolean>(`/admin/catalog/units/${unitId}`)
    },

    getPromotions(params?: { status?: string }) {
        return get<PromotionItem[]>(`/admin/catalog/promotions${buildQueryString(params)}`)
    },

    createPromotion(payload: UpsertPromotionPayload) {
        return post<PromotionItem, UpsertPromotionPayload>(
            "/admin/catalog/promotions",
            payload
        )
    },

    updatePromotion(promotionId: string, payload: UpsertPromotionPayload) {
        return put<PromotionItem, UpsertPromotionPayload>(
            `/admin/catalog/promotions/${promotionId}`,
            payload
        )
    },

    updatePromotionStatus(promotionId: string, status: string) {
        return patch<PromotionItem, { status: string }>(
            `/admin/catalog/promotions/${promotionId}/status`,
            { status }
        )
    },

    deletePromotion(promotionId: string) {
        return remove<boolean>(`/admin/catalog/promotions/${promotionId}`)
    },

    /* ========================= Monitoring ========================= */

    getAiPricingHistory(params?: { page?: number; pageSize?: number }) {
        return get<PaginationResult<AiPricingHistoryItem>>(
            `/admin/monitoring/ai-pricing-history${buildQueryString(params)}`
        )
    },

    /* ========================= Users ========================= */

    getUsers(params?: {
        pageNumber?: number
        pageSize?: number
        keyword?: string
        roleId?: number
        status?: number
    }) {
        return get<PaginationResult<AdminUser>>(`/Users${buildQueryString(params)}`)
    },

    getUserById(userId: string) {
        return get<AdminUser>(`/Users/${userId}`)
    },

    createUser(payload: CreateUserPayload) {
        return post<AdminUser, CreateUserPayload>("/Users", payload)
    },

    updateUser(userId: string, payload: UpdateUserPayload) {
        return put<AdminUser, UpdateUserPayload>(`/Users/${userId}`, payload)
    },

    deleteUser(userId: string) {
        return remove<boolean>(`/Users/${userId}`)
    },

    patchUserStatus(userId: string, payload: PatchUserStatusPayload) {
        return patch<AdminUser, PatchUserStatusPayload>(`/Users/${userId}`, payload)
    },

    async getApprovalRows(params?: {
        pageNumber?: number
        pageSize?: number
        keyword?: string
    }): Promise<PaginationResult<AdminApprovalRow>> {
        const users = await this.getUsers({
            pageNumber: params?.pageNumber ?? 1,
            pageSize: params?.pageSize ?? 20,
            keyword: params?.keyword,
        })

        const items = users.items
            .filter((item) => item.status === 0)
            .map<AdminApprovalRow>((item) => ({
                id: item.userId,
                userId: item.userId,
                fullName: item.fullName,
                email: item.email,
                phone: item.phone,
                roleName: item.roleName,
                status: item.status,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                supermarketId: item.marketStaffInfo?.supermarket?.supermarketId,
                supermarketName: item.marketStaffInfo?.supermarket?.name,
                position: item.marketStaffInfo?.position,
            }))

        return {
            ...users,
            items,
            totalResult: items.length,
        }
    },

    async approveUser(userId: string) {
        return this.patchUserStatus(userId, { status: 1 })
    },

    async rejectUser(userId: string) {
        return this.patchUserStatus(userId, { status: 2 })
    },

    async getInternalStaffRows(params?: {
        pageNumber?: number
        pageSize?: number
        keyword?: string
    }): Promise<PaginationResult<InternalStaffRow>> {
        const users = await this.getUsers({
            pageNumber: params?.pageNumber ?? 1,
            pageSize: params?.pageSize ?? 20,
            keyword: params?.keyword,
        })

        const staffRoleIds = [1, 2, 3, 4, 5]

        const items = users.items
            .filter((item) => staffRoleIds.includes(item.roleId))
            .map<InternalStaffRow>((item) => ({
                id: item.userId,
                userId: item.userId,
                fullName: item.fullName,
                email: item.email,
                phone: item.phone,
                roleName: item.roleName,
                roleId: item.roleId,
                status: item.status,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                department: item.roleName,
                position: item.marketStaffInfo?.position,
                organizationName: item.marketStaffInfo?.supermarket?.name,
            }))

        return {
            ...users,
            items,
            totalResult: items.length,
        }
    },

    /* ========================= Orders / Transactions ========================= */

    getOrders(params?: {
        pageNumber?: number
        pageSize?: number
        status?: string
        keyword?: string
    }) {
        return get<PaginationResult<AdminOrder>>(`/Orders${buildQueryString(params)}`)
    },

    getOrderById(orderId: string) {
        return get<AdminOrder>(`/Orders/${orderId}`)
    },

    /* ========================= Feedbacks ========================= */

    getFeedbacks(params?: { pageNumber?: number; pageSize?: number }) {
        return get<PaginationResult<FeedbackItem>>(`/Feedbacks${buildQueryString(params)}`)
    },

    getFeedbackById(feedbackId: string) {
        return get<FeedbackItem>(`/Feedbacks/${feedbackId}`)
    },

    deleteFeedback(feedbackId: string) {
        return remove<boolean>(`/Feedbacks/${feedbackId}`)
    },

    /* ========================= Supermarkets ========================= */

    getSupermarkets(params?: { pageNumber?: number; pageSize?: number; keyword?: string }) {
        return get<PaginationResult<AdminSupermarketItem>>(
            `/Supermarkets${buildQueryString(params)}`
        )
    },

    getSupermarketById(supermarketId: string) {
        return get<AdminSupermarketItem>(`/Supermarkets/${supermarketId}`)
    },

    createSupermarket(payload: CreateSupermarketPayload) {
        return post<AdminSupermarketItem, CreateSupermarketPayload>("/Supermarkets", payload)
    },

    updateSupermarket(supermarketId: string, payload: UpdateSupermarketPayload) {
        return put<AdminSupermarketItem, UpdateSupermarketPayload>(
            `/Supermarkets/${supermarketId}`,
            payload
        )
    },

    deleteSupermarket(supermarketId: string) {
        return remove<boolean>(`/Supermarkets/${supermarketId}`)
    },

    /* ========================= Delivery Groups ========================= */

    getDeliveryGroups(params?: {
        pageNumber?: number
        pageSize?: number
        status?: string
        deliveryType?: string
        deliveryDate?: string
    }) {
        return get<PaginationResult<DeliveryGroupListItem>>(
            `/admin/delivery/groups${buildQueryString(params)}`
        )
    },

    getDeliveryGroupById(groupId: string) {
        return get<DeliveryGroupDetail>(`/admin/delivery/groups/${groupId}`)
    },

    assignDeliveryGroup(groupId: string, payload: AssignDeliveryPayload) {
        return post<DeliveryGroupDetail, AssignDeliveryPayload>(
            `/admin/delivery/groups/${groupId}/assign`,
            payload
        )
    },

    startDeliveryGroup(groupId: string, payload?: DeliveryActionPayload) {
        return post<DeliveryGroupDetail, DeliveryActionPayload>(
            `/admin/delivery/groups/${groupId}/start`,
            payload
        )
    },

    completeDeliveryGroup(groupId: string, payload?: DeliveryActionPayload) {
        return post<DeliveryGroupDetail, DeliveryActionPayload>(
            `/admin/delivery/groups/${groupId}/complete`,
            payload
        )
    },

    cancelDeliveryGroup(groupId: string, payload?: DeliveryActionPayload) {
        return post<DeliveryGroupDetail, DeliveryActionPayload>(
            `/admin/delivery/groups/${groupId}/cancel`,
            payload
        )
    },

    /* ========================= Delivery Orders ========================= */

    getDeliveryOrderById(orderId: string) {
        return get<DeliveryOrderDetail>(`/admin/delivery/orders/${orderId}`)
    },

    confirmDelivered(orderId: string, payload?: ConfirmDeliveryPayload) {
        return post<DeliveryOrderDetail, ConfirmDeliveryPayload>(
            `/admin/delivery/orders/${orderId}/confirm-delivered`,
            payload
        )
    },

    reportDeliveryFailure(orderId: string, payload: ReportDeliveryFailurePayload) {
        return post<DeliveryOrderDetail, ReportDeliveryFailurePayload>(
            `/admin/delivery/orders/${orderId}/report-failure`,
            payload
        )
    },

    confirmCustomerReceived(orderId: string, payload?: CustomerConfirmationPayload) {
        return post<DeliveryOrderDetail, CustomerConfirmationPayload>(
            `/admin/delivery/orders/${orderId}/customer-confirmation`,
            payload
        )
    },

    getDeliveryHistory(params?: {
        pageNumber?: number
        pageSize?: number
        status?: string
        keyword?: string
    }) {
        return get<PaginationResult<DeliveryHistoryItem>>(
            `/admin/delivery/history${buildQueryString(params)}`
        )
    },

    getDeliveryStats(params?: { fromDate?: string; toDate?: string }) {
        return get<DeliveryStats[]>(`/admin/delivery/stats${buildQueryString(params)}`)
    },

    /* ========================= Packaging / Operations ========================= */

    getPackagingPendingOrders(params?: {
        pageNumber?: number
        pageSize?: number
        keyword?: string
    }) {
        return get<PaginationResult<PackagingPendingOrderItem>>(
            `/admin/operations/packaging/pending-orders${buildQueryString(params)}`
        )
    },

    getPackagingOrderDetail(orderId: string) {
        return get<PackagingOrderDetail>(`/admin/operations/packaging/orders/${orderId}`)
    },

    markPackagingReady(orderId: string, payload?: PackagingActionPayload) {
        return post<PackagingOrderDetail, PackagingActionPayload>(
            `/admin/operations/packaging/orders/${orderId}/ready`,
            payload
        )
    },

    markPackagingCollected(orderId: string, payload?: PackagingActionPayload) {
        return post<PackagingOrderDetail, PackagingActionPayload>(
            `/admin/operations/packaging/orders/${orderId}/collected`,
            payload
        )
    },

    /* ========================= Helpers ========================= */

    timeSpanToClockText(value?: TimeSpanDto | null) {
        if (!value) return "--"

        const hh = String(value.hours ?? 0).padStart(2, "0")
        const mm = String(value.minutes ?? 0).padStart(2, "0")
        return `${hh}:${mm}`
    },

    toTimeSlotPayload(startHHmm: string, endHHmm: string): UpsertTimeSlotPayload {
        const toTicks = (value: string) => {
            const [hour, minute] = value.split(":").map(Number)
            const totalSeconds = hour * 3600 + minute * 60
            return totalSeconds * 10_000_000
        }

        return {
            startTime: { ticks: toTicks(startHHmm) },
            endTime: { ticks: toTicks(endHHmm) },
        }
    },
}
